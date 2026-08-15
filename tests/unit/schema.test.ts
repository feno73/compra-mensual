import { expect, test } from "vitest";

import { purchaseMonthSchema } from "../../src/domain/purchases/schema";

const validMonth = {
  schemaVersion: 1,
  month: "2026-07",
  currency: "ARS",
  tickets: [
    {
      sourceDigest: `sha256:${"a".repeat(64)}`,
      purchaseDate: "2026-07-10",
      merchant: { name: "Coto", branch: "Sucursal 181" },
      exchangeRate: {
        nominalDate: "2026-07-10",
        effectiveDate: "2026-07-10",
        rateCentsPerUsd: 153270,
        source: "ArgentinaDatos",
        sourceField: "venta",
        sourceReference: "0988b5e0ac22f58f8b2044a7adb4d288a90c4009",
        fetchedAt: "2026-08-15",
      },
      lines: [
        {
          lineId: "1",
          product: {
            id: "gtin:07798039600058",
            ticketName: "LECHE ENTERA ULTRAPAS COTO SCH 1 LTR",
            normalizedName: "Leche entera Coto 1 l",
            category: "Almacén",
          },
          quantity: { value: 1, scale: 0, unit: "unit" },
          unitListPrice: { value: 179900, scale: 2, currency: "ARS" },
          grossCents: 179900,
          discounts: [{ description: "Promoción", amountCents: 44975 }],
          netCents: 134925,
        },
      ],
      adjustments: [],
      totals: { grossCents: 179900, discountCents: 44975, paidCents: 134925 },
    },
  ],
  substitutions: [],
};

test("acepta un mes válido con importes enteros", () => {
  expect(purchaseMonthSchema.parse(validMonth).month).toBe("2026-07");
});

test("rechaza identificadores sensibles aunque aparezcan en objetos anidados", () => {
  const unsafe = structuredClone(validMonth) as typeof validMonth & { invoiceNumber?: string };
  unsafe.invoiceNumber = "181-05481790";
  expect(() => purchaseMonthSchema.parse(unsafe)).toThrow(/sensible/i);
});

test("rechaza URLs completas en referencias públicas", () => {
  const unsafe = structuredClone(validMonth);
  unsafe.tickets[0]!.exchangeRate.sourceReference = "https://example.com/ticket/token";
  expect(() => purchaseMonthSchema.parse(unsafe)).toThrow(/URL/i);
});

test("acepta sustituciones confirmadas uno a varios", () => {
  const withSubstitution = structuredClone(validMonth);
  withSubstitution.substitutions = [{
    id: "crema-dental",
    previousProductIds: ["gtin:07794640170386"],
    currentProductIds: ["gtin:07794640170720", "gtin:05054563204387"],
    kind: "group-replacement",
    reason: "Reposición confirmada de crema dental",
    comparisonBasis: "Un producto anterior por dos actuales",
    confidence: "confirmed",
  }] as never;
  expect(purchaseMonthSchema.parse(withSubstitution).substitutions).toHaveLength(1);
});

test("rechaza sustituciones sin productos anteriores", () => {
  const withSubstitution = structuredClone(validMonth);
  withSubstitution.substitutions = [{
    id: "invalida",
    previousProductIds: [],
    currentProductIds: ["gtin:07794640170720"],
    kind: "equivalent",
    reason: "Inválida",
    comparisonBasis: "Sin anterior",
    confidence: "confirmed",
  }] as never;
  expect(() => purchaseMonthSchema.parse(withSubstitution)).toThrow();
});
