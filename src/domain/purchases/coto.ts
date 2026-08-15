import type { PurchaseTicket } from "./types";

interface ParseOptions {
  sourceDigest: string;
  rateCentsPerUsd: number;
  sourceReference: string;
  fetchedAt: string;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .trim();
}

function cents(value: string): number {
  const normalized = value.replace(/\$/g, "").replace(/\./g, "").trim();
  const negative = normalized.startsWith("-");
  const [whole, fraction = ""] = normalized.replace("-", "").split(",");
  const result = Number(BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, "0").slice(0, 2)));
  return negative ? -result : result;
}

function scaledDecimal(value: string): { value: number; scale: number } {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const [whole, fraction = ""] = normalized.split(".");
  return { value: Number(`${whole}${fraction}`), scale: fraction.length };
}

function classText(html: string, className: string): string {
  const match = html.match(new RegExp(`<[^>]+class="[^"]*${className}[^"]*"[^>]*>([\\s\\S]*?)<\\/[^>]+>`));
  if (!match?.[1]) throw new Error(`No se encontró ${className}`);
  return decodeHtml(match[1].replace(/<[^>]+>/g, ""));
}

function totalAfter(html: string, label: string): number {
  const pattern = new RegExp(`${label}<\\/span>[\\s\\S]*?<span class="[^"]*text-right">\\$(-?[\\d.,]+)<\\/span>`, "i");
  const match = html.match(pattern);
  if (!match?.[1]) throw new Error(`No se encontró el total ${label}`);
  return Math.abs(cents(match[1]));
}

function categoryFor(name: string): string {
  if (/(LECHE|QUESO|YOGUR|MANTECA)/.test(name)) return "Lácteos";
  if (/(GASEOSA|CERVEZA|ESPUMANTE|JUGO|YERBA|\bTE\b)/.test(name)) return "Bebidas";
  if (/(DENTAL|JABON|JABÓN|CREMA CORPORAL|SHAMPOO|ACONDICIONADOR|MASCARILLA)/.test(name)) return "Cuidado personal";
  if (/(ESPONJA|PAÑO|ROLLO|BOLSA RESIDUO|LIMPIADOR|INSECTICIDA|P\.HIGIENICO)/.test(name)) return "Limpieza";
  if (/(TARTERA|HERMETICO|COPA|VELA|INCIENSO|RALL|AROMATIZADOR|DIFUSOR)/.test(name)) return "Hogar";
  return "Almacén";
}

function normalizedName(name: string): string {
  const lower = name.replace(/\s+/g, " ").toLocaleLowerCase("es-AR");
  return lower.charAt(0).toLocaleUpperCase("es-AR") + lower.slice(1);
}

export function parseCotoTicketHtml(html: string, options: ParseOptions): PurchaseTicket {
  const rawDate = html.match(/Fecha:\s*(\d{2})\/(\d{2})\/(\d{2})/);
  if (!rawDate) throw new Error("No se encontró la fecha de compra");
  const purchaseDate = `20${rawDate[3]}-${rawDate[2]}-${rawDate[1]}`;
  const branch = classText(html, "single-title");
  const segments = [...html.matchAll(/<li class="product-li">([\s\S]*?)<\/li>/g)].map((match) => match[1]!);
  if (segments.length === 0) throw new Error("El ticket no contiene productos");

  const lines = segments.map((segment, index) => {
    const ticketName = classText(segment, "info-producto-h2");
    const plu = classText(segment, "plu");
    const gtin = classText(segment, "lean");
    const grossCents = cents(classText(segment, "info-producto-price"));
    const quantityText = classText(segment, "info-cant");
    const quantityMatch = quantityText.match(/^([\d.,]+)\s+x\s+\$([\d.,]+)$/);
    if (!quantityMatch?.[1] || !quantityMatch[2]) throw new Error(`Cantidad ilegible en la línea ${index + 1}`);
    const quantity = scaledDecimal(quantityMatch[1]);
    const unitListPrice = scaledDecimal(quantityMatch[2]);
    const discountMatches = [...segment.matchAll(/class="[^"]*info-descuento[^"]*"[^>]*>([\s\S]*?)<\/div>[\s\S]*?class="[^"]*precio-descuento[^"]*"[^>]*>(-?[\d.,]+)<\/div>/g)];
    const discounts = discountMatches.map((match) => ({
      description: decodeHtml(match[1]!.replace(/<[^>]+>/g, "")),
      amountCents: Math.abs(cents(match[2]!)),
      promotion: decodeHtml(match[1]!.replace(/<[^>]+>/g, "")),
    }));
    const discountCents = discounts.reduce((total, discount) => total + discount.amountCents, 0);

    return {
      lineId: String(index + 1),
      product: {
        id: gtin ? `gtin:${gtin}` : `coto:plu:${plu}`,
        ticketName,
        normalizedName: normalizedName(ticketName),
        category: categoryFor(ticketName),
      },
      quantity: { ...quantity, unit: quantity.scale > 0 ? "kg" as const : "unit" as const },
      unitListPrice: { ...unitListPrice, currency: "ARS" as const },
      grossCents,
      discounts,
      netCents: grossCents - discountCents,
    };
  });

  const grossCents = totalAfter(html, "Subtotal sin descuentos");
  const discountCents = totalAfter(html, "Ahorro por línea de cajas");
  const paidCents = totalAfter(html, "TOTAL");
  const calculatedPaid = lines.reduce((total, line) => total + line.netCents, 0);
  const difference = paidCents - calculatedPaid;
  const adjustments = difference === 0 ? [] : [{
    description: "Redondeo informado por conciliación",
    amountCents: difference,
    kind: "rounding" as const,
  }];

  return {
    sourceDigest: options.sourceDigest,
    purchaseDate,
    merchant: { name: "Coto", branch },
    exchangeRate: {
      nominalDate: purchaseDate,
      effectiveDate: purchaseDate,
      rateCentsPerUsd: options.rateCentsPerUsd,
      source: "ArgentinaDatos",
      sourceField: "venta",
      sourceReference: options.sourceReference,
      fetchedAt: options.fetchedAt,
    },
    lines,
    adjustments,
    totals: { grossCents, discountCents, paidCents },
  };
}
