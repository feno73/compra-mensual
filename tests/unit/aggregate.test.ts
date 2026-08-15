import { expect, test } from "vitest";

import { aggregateMonth } from "../../src/domain/comparison/aggregate";
import type { PurchaseMonth } from "../../src/domain/purchases/types";

const month = {
  schemaVersion: 1,
  month: "2026-07",
  currency: "ARS",
  substitutions: [],
  tickets: [{
    sourceDigest: `sha256:${"a".repeat(64)}`,
    purchaseDate: "2026-07-10",
    merchant: { name: "Coto" },
    exchangeRate: { nominalDate: "2026-07-10", effectiveDate: "2026-07-10", rateCentsPerUsd: 100000, source: "ArgentinaDatos", sourceField: "venta", sourceReference: "abcdef0", fetchedAt: "2026-08-15" },
    lines: [
      { lineId: "1", product: { id: "gtin:7790000000001", ticketName: "A", normalizedName: "A", category: "Almacén" }, quantity: { value: 1, scale: 0, unit: "unit" }, unitListPrice: { value: 100, scale: 2, currency: "ARS" }, grossCents: 100, discounts: [], netCents: 100 },
      { lineId: "2", product: { id: "gtin:7790000000001", ticketName: "A", normalizedName: "A", category: "Almacén" }, quantity: { value: 500, scale: 3, unit: "unit" }, unitListPrice: { value: 100, scale: 2, currency: "ARS" }, grossCents: 50, discounts: [{ description: "Promo", amountCents: 10 }], netCents: 40 },
    ],
    adjustments: [{ description: "Redondeo", amountCents: -1, kind: "rounding" }],
    totals: { grossCents: 150, discountCents: 10, paidCents: 139 },
  }],
} satisfies PurchaseMonth;

test("agrega líneas repetidas preservando cantidad y centavos", () => {
  const result = aggregateMonth(month);
  expect(result.totalCents).toBe(139n);
  expect(result.adjustmentCents).toBe(-1n);
  expect(result.products).toEqual([expect.objectContaining({
    id: "gtin:7790000000001",
    quantity: 1500n,
    quantityScale: 3,
    grossCents: 150n,
    discountCents: 10n,
    netCents: 140n,
  })]);
});
