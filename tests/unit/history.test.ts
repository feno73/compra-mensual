import { expect, test } from "vitest";

import { buildProductPriceHistory, buildSpendingHistory } from "../../src/domain/history";
import type { MonthlyAggregate } from "../../src/domain/comparison/aggregate";

test("ordena la evolución mensual y conserva ARS y USD", () => {
  const aggregates = [
    { month: "2026-08", totalCents: 200n, usdCents: 2n, adjustmentCents: 0n, products: [], rates: [] },
    { month: "2026-07", totalCents: 100n, usdCents: 1n, adjustmentCents: 0n, products: [], rates: [] },
  ] satisfies MonthlyAggregate[];
  expect(buildSpendingHistory(aggregates)).toEqual([
    { month: "2026-07", arsCents: 100n, usdCents: 1n },
    { month: "2026-08", arsCents: 200n, usdCents: 2n },
  ]);
});

test("incluye historial de precio solo para productos presentes en varios meses", () => {
  const product = { id: "gtin:7790000000001", name: "Producto", category: "Almacén", unit: "unit" as const, quantity: 2n, quantityScale: 0, grossCents: 200n, discountCents: 20n, netCents: 180n };
  const aggregates = [
    { month: "2026-07", totalCents: 180n, usdCents: 1n, adjustmentCents: 0n, products: [product], rates: [] },
    { month: "2026-08", totalCents: 210n, usdCents: 1n, adjustmentCents: 0n, products: [{ ...product, grossCents: 240n, discountCents: 30n, netCents: 210n }], rates: [] },
  ] satisfies MonthlyAggregate[];
  expect(buildProductPriceHistory(aggregates)).toEqual([{
    id: product.id,
    name: product.name,
    unit: "unit",
    points: [
      { month: "2026-07", grossUnitCents: 100n, netUnitCents: 90n },
      { month: "2026-08", grossUnitCents: 120n, netUnitCents: 105n },
    ],
  }]);
});
