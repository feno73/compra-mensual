import { toUsdCents } from "../money";
import type { PurchaseMonth, PurchaseTicket } from "../purchases/types";

export interface AggregatedProduct {
  id: string;
  name: string;
  category: string;
  unit: PurchaseTicket["lines"][number]["quantity"]["unit"];
  quantity: bigint;
  quantityScale: number;
  grossCents: bigint;
  discountCents: bigint;
  netCents: bigint;
}

export interface MonthlyAggregate {
  month: string;
  totalCents: bigint;
  usdCents: bigint;
  adjustmentCents: bigint;
  products: AggregatedProduct[];
  rates: Array<{ date: string; rateCentsPerUsd: bigint }>;
}

export function aggregateMonth(month: PurchaseMonth): MonthlyAggregate {
  const products = new Map<string, AggregatedProduct>();
  let totalCents = 0n;
  let usdCents = 0n;
  let adjustmentCents = 0n;
  const rates: MonthlyAggregate["rates"] = [];

  for (const ticket of month.tickets) {
    totalCents += BigInt(ticket.totals.paidCents);
    usdCents += toUsdCents(BigInt(ticket.totals.paidCents), BigInt(ticket.exchangeRate.rateCentsPerUsd));
    adjustmentCents += ticket.adjustments.reduce((sum, adjustment) => sum + BigInt(adjustment.amountCents), 0n);
    rates.push({ date: ticket.exchangeRate.effectiveDate, rateCentsPerUsd: BigInt(ticket.exchangeRate.rateCentsPerUsd) });

    for (const line of ticket.lines) {
      const mapKey = `${line.product.id}::${line.quantity.unit}`;
      const existing = products.get(mapKey);
      const discountCents = line.discounts.reduce((sum, discount) => sum + BigInt(discount.amountCents), 0n);
      if (!existing) {
        products.set(mapKey, {
          id: line.product.id,
          name: line.product.normalizedName,
          category: line.product.category,
          unit: line.quantity.unit,
          quantity: BigInt(line.quantity.value),
          quantityScale: line.quantity.scale,
          grossCents: BigInt(line.grossCents),
          discountCents,
          netCents: BigInt(line.netCents),
        });
        continue;
      }

      const targetScale = Math.max(existing.quantityScale, line.quantity.scale);
      existing.quantity = existing.quantity * 10n ** BigInt(targetScale - existing.quantityScale)
        + BigInt(line.quantity.value) * 10n ** BigInt(targetScale - line.quantity.scale);
      existing.quantityScale = targetScale;
      existing.grossCents += BigInt(line.grossCents);
      existing.discountCents += discountCents;
      existing.netCents += BigInt(line.netCents);
    }
  }

  return {
    month: month.month,
    totalCents,
    usdCents,
    adjustmentCents,
    products: [...products.values()].sort((left, right) => left.id.localeCompare(right.id)),
    rates,
  };
}
