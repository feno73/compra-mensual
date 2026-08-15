import { expect, test } from "vitest";

import { compareAggregates } from "../../src/domain/comparison/compare";
import type { MonthlyAggregate } from "../../src/domain/comparison/aggregate";

function aggregate(month: string, products: MonthlyAggregate["products"], adjustmentCents = 0n): MonthlyAggregate {
  return {
    month,
    products,
    adjustmentCents,
    totalCents: products.reduce((sum, product) => sum + product.netCents, adjustmentCents),
    usdCents: 0n,
    rates: [],
  };
}

const shared = { name: "Producto", category: "Almacén", unit: "unit" as const, quantityScale: 0 };

test("separa composición, cantidad, precio y descuento sin doble conteo", () => {
  const previous = aggregate("2026-07", [
    { ...shared, id: "gtin:7790000000001", quantity: 2n, grossCents: 200n, discountCents: 20n, netCents: 180n },
    { ...shared, id: "gtin:7790000000003", quantity: 1n, grossCents: 40n, discountCents: 0n, netCents: 40n },
  ]);
  const current = aggregate("2026-08", [
    { ...shared, id: "gtin:7790000000001", quantity: 3n, grossCents: 360n, discountCents: 30n, netCents: 330n },
    { ...shared, id: "gtin:7790000000002", quantity: 1n, grossCents: 50n, discountCents: 0n, netCents: 50n },
  ], -1n);

  const result = compareAggregates(previous, current, [{
    id: "reemplazo",
    previousProductIds: ["gtin:7790000000003"],
    currentProductIds: ["gtin:7790000000002"],
    kind: "equivalent",
    reason: "Misma función",
    comparisonBasis: "Una unidad",
    confidence: "confirmed",
  }]);
  expect(result.factors).toEqual({
    newProductsCents: 0n,
    absentProductsCents: 0n,
    substitutionsCents: 10n,
    quantityCents: 100n,
    priceCents: 60n,
    discountCents: -10n,
    adjustmentsCents: -1n,
  });
  expect(result.totalChangeCents).toBe(159n);
  expect(result.reconciledCents).toBe(159n);
  expect(result.comparable).toHaveLength(1);
  expect(result.newProducts).toHaveLength(0);
  expect(result.absentProducts).toHaveLength(0);
  expect(result.substitutions).toEqual([expect.objectContaining({
    id: "reemplazo",
    previousNetCents: 40n,
    currentNetCents: 50n,
    changeCents: 10n,
  })]);
});

test("agrega reemplazos varios a uno sin inventar precio unitario", () => {
  const previous = aggregate("2026-07", [
    { ...shared, id: "gtin:7790000000001", quantity: 1n, grossCents: 100n, discountCents: 10n, netCents: 90n },
    { ...shared, id: "gtin:7790000000002", quantity: 1n, grossCents: 80n, discountCents: 0n, netCents: 80n },
  ]);
  const current = aggregate("2026-08", [
    { ...shared, id: "gtin:7790000000003", quantity: 1n, grossCents: 150n, discountCents: 20n, netCents: 130n },
  ]);
  const result = compareAggregates(previous, current, [{
    id: "grupo",
    previousProductIds: ["gtin:7790000000001", "gtin:7790000000002"],
    currentProductIds: ["gtin:7790000000003"],
    kind: "group-replacement",
    reason: "Reposición grupal",
    comparisonBasis: "Surtido",
    confidence: "confirmed",
  }]);
  expect(result.factors.substitutionsCents).toBe(-40n);
  expect(result.substitutions[0]).toMatchObject({
    previousGrossCents: 180n,
    currentGrossCents: 150n,
    previousDiscountCents: 10n,
    currentDiscountCents: 20n,
    changeCents: -40n,
  });
  expect(result.reconciledCents).toBe(-40n);
});
