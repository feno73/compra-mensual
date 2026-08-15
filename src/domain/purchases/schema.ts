import { z } from "zod";

const sensitiveKey = /(invoice|factura|client|cliente|document|documento|card|tarjeta|account|cuenta|email|phone|telefono|teléfono|payment|pago|ticketurl|sourceurl)/i;
const fullUrl = /https?:\/\//i;

function scanSensitive(value: unknown, path: PropertyKey[], context: z.RefinementCtx): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanSensitive(entry, [...path, index], context));
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const [key, entry] of Object.entries(value)) {
    if (sensitiveKey.test(key)) {
      context.addIssue({ code: "custom", path: [...path, key], message: "Campo sensible no permitido" });
    }
    scanSensitive(entry, [...path, key], context);
  }
}

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const centsSchema = z.number().int().safe();
const nonNegativeCentsSchema = centsSchema.nonnegative();

export const scaledIntegerSchema = z.object({
  value: z.number().int().safe().positive(),
  scale: z.number().int().min(0).max(6),
});

const exchangeRateSchema = z.object({
  nominalDate: dateSchema,
  effectiveDate: dateSchema,
  rateCentsPerUsd: z.number().int().positive().safe(),
  source: z.literal("ArgentinaDatos"),
  sourceField: z.literal("venta"),
  sourceReference: z.string().min(7).max(128).refine((value) => !fullUrl.test(value), "Las URL completas no están permitidas"),
  fetchedAt: dateSchema,
});

const productIdSchema = z.string().regex(/^(gtin:\d{8,14}|[a-z0-9-]+:(sku|plu):[a-z0-9-]+|manual:[a-z0-9-]+)$/);

const productSchema = z.object({
  id: productIdSchema,
  ticketName: z.string().min(1),
  normalizedName: z.string().min(1),
  category: z.string().min(1),
  identityEvidence: z.string().min(1).optional(),
}).superRefine((product, context) => {
  if (product.id.startsWith("manual:") && !product.identityEvidence) {
    context.addIssue({ code: "custom", path: ["identityEvidence"], message: "Una identidad manual requiere evidencia" });
  }
});

const discountSchema = z.object({
  description: z.string().min(1),
  amountCents: nonNegativeCentsSchema,
  promotion: z.string().min(1).optional(),
});

const lineSchema = z.object({
  lineId: z.string().min(1),
  product: productSchema,
  quantity: scaledIntegerSchema.extend({ unit: z.enum(["unit", "kg", "g", "l", "ml"]) }),
  unitListPrice: scaledIntegerSchema.extend({ currency: z.literal("ARS") }),
  grossCents: nonNegativeCentsSchema,
  discounts: z.array(discountSchema),
  netCents: nonNegativeCentsSchema,
}).superRefine((line, context) => {
  const discount = line.discounts.reduce((total, item) => total + item.amountCents, 0);
  if (line.grossCents - discount !== line.netCents) {
    context.addIssue({ code: "custom", path: ["netCents"], message: "El neto de la línea no reconcilia" });
  }
});

const adjustmentSchema = z.object({
  description: z.string().min(1),
  amountCents: centsSchema,
  kind: z.enum(["general-discount", "surcharge", "rounding"]),
});

const ticketSchema = z.object({
  sourceDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  purchaseDate: dateSchema,
  merchant: z.object({ name: z.string().min(1), branch: z.string().min(1).optional() }),
  exchangeRate: exchangeRateSchema,
  lines: z.array(lineSchema).min(1),
  adjustments: z.array(adjustmentSchema),
  totals: z.object({
    grossCents: nonNegativeCentsSchema,
    discountCents: nonNegativeCentsSchema,
    paidCents: nonNegativeCentsSchema,
  }),
});

const substitutionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  previousProductIds: z.array(productIdSchema).min(1),
  currentProductIds: z.array(productIdSchema).min(1),
  kind: z.enum(["equivalent", "group-replacement"]),
  reason: z.string().min(1),
  comparisonBasis: z.string().min(1),
  confidence: z.literal("confirmed"),
});

export const purchaseMonthSchema = z.object({
  schemaVersion: z.literal(1),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  currency: z.literal("ARS"),
  tickets: z.array(ticketSchema).min(1),
  substitutions: z.array(substitutionSchema).default([]),
}).passthrough().superRefine((month, context) => scanSensitive(month, [], context));

export type PurchaseMonth = z.infer<typeof purchaseMonthSchema>;
export type PurchaseTicket = PurchaseMonth["tickets"][number];
export type PurchaseLine = PurchaseTicket["lines"][number];
