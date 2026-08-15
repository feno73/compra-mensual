import { expect, test } from "vitest";

import { aggregateMonth } from "../../src/domain/comparison/aggregate";
import { compareAggregates } from "../../src/domain/comparison/compare";
import { loadPurchaseMonths } from "../../src/domain/purchases/load";

test("julio a agosto reconcilia y el cambio proviene principalmente de la composición", async () => {
  const [july, august] = await loadPurchaseMonths();
  const comparison = compareAggregates(aggregateMonth(july!), aggregateMonth(august!), august!.substitutions);
  const composition = comparison.factors.newProductsCents + comparison.factors.absentProductsCents;
  const repeated = comparison.factors.quantityCents + comparison.factors.priceCents + comparison.factors.discountCents;

  expect(comparison.totalChangeCents).toBe(6_465_612n);
  expect(comparison.reconciledCents).toBe(6_465_612n);
  expect(comparison.percentTenths).toBe(242n);
  expect(comparison.factors.newProductsCents).toBe(19_187_721n);
  expect(comparison.factors.absentProductsCents).toBe(-11_408_295n);
  expect(comparison.factors.substitutionsCents).toBe(-1_210_549n);
  expect(comparison.substitutions).toHaveLength(11);
  expect(comparison.substitutions.find((item) => item.id === "leche-proteica")).toMatchObject({ changeCents: -54_002n });
  expect(comparison.comparable.length).toBeGreaterThan(0);
  expect(composition > repeated).toBe(true);
});
