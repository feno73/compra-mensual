export function divideRounded(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new RangeError("El divisor no puede ser cero");

  const sign = (numerator < 0n) !== (denominator < 0n) ? -1n : 1n;
  const absoluteNumerator = numerator < 0n ? -numerator : numerator;
  const absoluteDenominator = denominator < 0n ? -denominator : denominator;
  const quotient = absoluteNumerator / absoluteDenominator;
  const remainder = absoluteNumerator % absoluteDenominator;
  const rounded = remainder * 2n >= absoluteDenominator ? quotient + 1n : quotient;
  return rounded * sign;
}

export function toUsdCents(arsCents: bigint, rateCentsPerUsd: bigint): bigint {
  if (rateCentsPerUsd <= 0n) throw new RangeError("La cotización MEP debe ser positiva");
  return divideRounded(arsCents * 100n, rateCentsPerUsd);
}

function grouped(value: bigint): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatArs(cents: bigint): string {
  const sign = cents < 0n ? "-" : "";
  const absolute = cents < 0n ? -cents : cents;
  return `${sign}$ ${grouped(absolute / 100n)},${(absolute % 100n).toString().padStart(2, "0")}`;
}

export function formatUsd(cents: bigint): string {
  const sign = cents < 0n ? "-" : "";
  const absolute = cents < 0n ? -cents : cents;
  return `${sign}US$ ${grouped(absolute / 100n)},${(absolute % 100n).toString().padStart(2, "0")}`;
}

export function formatPercent(changeCents: bigint, previousCents: bigint): string {
  if (previousCents === 0n) return "No aplicable";
  const tenths = divideRounded(changeCents * 1000n, previousCents);
  const sign = tenths < 0n ? "-" : "";
  const absolute = tenths < 0n ? -tenths : tenths;
  return `${sign}${absolute / 10n},${absolute % 10n} %`;
}
