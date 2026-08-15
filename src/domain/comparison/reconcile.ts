export function assertReconciled(expectedCents: bigint, actualCents: bigint): void {
  if (expectedCents === actualCents) return;
  const difference = expectedCents - actualCents;
  const absolute = difference < 0n ? -difference : difference;
  throw new Error(`La comparación no reconcilia: diferencia de ${absolute} centavo${absolute === 1n ? "" : "s"}`);
}
