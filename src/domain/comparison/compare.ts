import { divideRounded } from "../money";
import type { AggregatedProduct, MonthlyAggregate } from "./aggregate";
import { assertReconciled } from "./reconcile";

export interface ComparisonFactors {
  newProductsCents: bigint;
  absentProductsCents: bigint;
  quantityCents: bigint;
  priceCents: bigint;
  discountCents: bigint;
  adjustmentsCents: bigint;
}

export interface ComparableProduct {
  product: AggregatedProduct;
  previous: AggregatedProduct;
  current: AggregatedProduct;
  quantityCents: bigint;
  priceCents: bigint;
  discountCents: bigint;
  changeCents: bigint;
}

function key(product: AggregatedProduct): string {
  return `${product.id}::${product.unit}`;
}

function alignedQuantities(previous: AggregatedProduct, current: AggregatedProduct): [bigint, bigint] {
  const targetScale = Math.max(previous.quantityScale, current.quantityScale);
  return [
    previous.quantity * 10n ** BigInt(targetScale - previous.quantityScale),
    current.quantity * 10n ** BigInt(targetScale - current.quantityScale),
  ];
}

export function compareAggregates(previous: MonthlyAggregate, current: MonthlyAggregate) {
  const previousByKey = new Map(previous.products.map((product) => [key(product), product]));
  const currentByKey = new Map(current.products.map((product) => [key(product), product]));
  const comparable: ComparableProduct[] = [];
  const newProducts: AggregatedProduct[] = [];
  const absentProducts: AggregatedProduct[] = [];
  const factors: ComparisonFactors = {
    newProductsCents: 0n,
    absentProductsCents: 0n,
    quantityCents: 0n,
    priceCents: 0n,
    discountCents: 0n,
    adjustmentsCents: current.adjustmentCents - previous.adjustmentCents,
  };

  for (const product of current.products) {
    const oldProduct = previousByKey.get(key(product));
    if (!oldProduct) {
      newProducts.push(product);
      factors.newProductsCents += product.netCents;
      continue;
    }
    const [oldQuantity, newQuantity] = alignedQuantities(oldProduct, product);
    const quantityCents = divideRounded((newQuantity - oldQuantity) * oldProduct.grossCents, oldQuantity);
    const priceCents = product.grossCents - oldProduct.grossCents - quantityCents;
    const discountCents = -(product.discountCents - oldProduct.discountCents);
    const changeCents = product.netCents - oldProduct.netCents;
    factors.quantityCents += quantityCents;
    factors.priceCents += priceCents;
    factors.discountCents += discountCents;
    comparable.push({ product, previous: oldProduct, current: product, quantityCents, priceCents, discountCents, changeCents });
  }

  for (const product of previous.products) {
    if (currentByKey.has(key(product))) continue;
    absentProducts.push(product);
    factors.absentProductsCents -= product.netCents;
  }

  const reconciledCents = Object.values(factors).reduce((sum, value) => sum + value, 0n);
  const totalChangeCents = current.totalCents - previous.totalCents;
  assertReconciled(totalChangeCents, reconciledCents);

  comparable.sort((left, right) => {
    const leftMagnitude = left.changeCents < 0n ? -left.changeCents : left.changeCents;
    const rightMagnitude = right.changeCents < 0n ? -right.changeCents : right.changeCents;
    return leftMagnitude === rightMagnitude ? left.product.id.localeCompare(right.product.id) : leftMagnitude > rightMagnitude ? -1 : 1;
  });

  return {
    previousMonth: previous.month,
    currentMonth: current.month,
    previousTotalCents: previous.totalCents,
    currentTotalCents: current.totalCents,
    totalChangeCents,
    percentTenths: previous.totalCents === 0n ? null : divideRounded(totalChangeCents * 1000n, previous.totalCents),
    factors,
    reconciledCents,
    comparable,
    newProducts,
    absentProducts,
  };
}
