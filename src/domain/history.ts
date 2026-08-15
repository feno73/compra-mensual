import type { MonthlyAggregate } from "./comparison/aggregate";
import { divideRounded } from "./money";

export function buildSpendingHistory(aggregates: MonthlyAggregate[]) {
  return [...aggregates]
    .sort((left, right) => left.month.localeCompare(right.month))
    .map((aggregate) => ({ month: aggregate.month, arsCents: aggregate.totalCents, usdCents: aggregate.usdCents }));
}

export function buildProductPriceHistory(aggregates: MonthlyAggregate[]) {
  const histories = new Map<string, {
    id: string;
    name: string;
    unit: MonthlyAggregate["products"][number]["unit"];
    points: Array<{ month: string; grossUnitCents: bigint; netUnitCents: bigint }>;
  }>();

  for (const aggregate of [...aggregates].sort((left, right) => left.month.localeCompare(right.month))) {
    for (const product of aggregate.products) {
      const key = `${product.id}::${product.unit}`;
      const history = histories.get(key) ?? { id: product.id, name: product.name, unit: product.unit, points: [] };
      const scale = 10n ** BigInt(product.quantityScale);
      history.points.push({
        month: aggregate.month,
        grossUnitCents: divideRounded(product.grossCents * scale, product.quantity),
        netUnitCents: divideRounded(product.netCents * scale, product.quantity),
      });
      histories.set(key, history);
    }
  }

  return [...histories.values()]
    .filter((history) => history.points.length > 1)
    .sort((left, right) => left.name.localeCompare(right.name, "es"));
}
