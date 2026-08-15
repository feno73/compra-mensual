import type { MonthlyAggregate } from "./comparison/aggregate";
import type { compareAggregates } from "./comparison/compare";
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

export function buildReplacementPriceHistories(
  substitutions: ReturnType<typeof compareAggregates>["substitutions"],
  previousMonth: string,
  currentMonth: string,
) {
  return substitutions.flatMap((substitution) => {
    if (substitution.kind !== "equivalent" || substitution.previousProducts.length !== 1 || substitution.currentProducts.length !== 1) return [];
    const previous = substitution.previousProducts[0]!;
    const current = substitution.currentProducts[0]!;
    const scale = Math.max(previous.quantityScale, current.quantityScale);
    const previousQuantity = previous.quantity * 10n ** BigInt(scale - previous.quantityScale);
    const currentQuantity = current.quantity * 10n ** BigInt(scale - current.quantityScale);
    if (previous.unit !== current.unit || previousQuantity !== currentQuantity) return [];
    return [{
      id: substitution.id,
      label: substitution.reason,
      comparisonBasis: substitution.comparisonBasis,
      points: [
        { month: previousMonth, netUnitCents: divideRounded(previous.netCents * 10n ** BigInt(previous.quantityScale), previous.quantity) },
        { month: currentMonth, netUnitCents: divideRounded(current.netCents * 10n ** BigInt(current.quantityScale), current.quantity) },
      ],
    }];
  });
}
