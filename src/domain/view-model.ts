import { aggregateMonth } from "./comparison/aggregate";
import { compareAggregates } from "./comparison/compare";
import { buildProductPriceHistory, buildSpendingHistory } from "./history";
import type { PurchaseMonth } from "./purchases/types";

export function createDashboardModel(months: PurchaseMonth[], selectedMonth: string) {
  const sortedMonths = [...months].sort((left, right) => left.month.localeCompare(right.month));
  const aggregates = sortedMonths.map(aggregateMonth);
  const selectedIndex = aggregates.findIndex((aggregate) => aggregate.month === selectedMonth);
  if (selectedIndex < 0) throw new Error(`Mes no encontrado: ${selectedMonth}`);
  const selected = aggregates[selectedIndex]!;
  const previous = selectedIndex > 0 ? aggregates[selectedIndex - 1]! : null;

  return {
    months: sortedMonths.map((month) => month.month),
    selected,
    selectedSource: sortedMonths[selectedIndex]!,
    comparison: previous ? compareAggregates(previous, selected) : null,
    history: buildSpendingHistory(aggregates),
    priceHistories: buildProductPriceHistory(aggregates),
  };
}
