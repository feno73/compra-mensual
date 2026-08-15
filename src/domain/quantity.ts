export interface ScaledInteger {
  value: number;
  scale: number;
}

function factor(scale: number): bigint {
  return 10n ** BigInt(scale);
}

export function scaledToBigInt(input: ScaledInteger, targetScale: number): bigint {
  if (targetScale < input.scale) throw new RangeError("La escala destino no puede perder precisión");
  return BigInt(input.value) * factor(targetScale - input.scale);
}

export function alignScaled(left: ScaledInteger, right: ScaledInteger) {
  const scale = Math.max(left.scale, right.scale);
  return {
    left: scaledToBigInt(left, scale),
    right: scaledToBigInt(right, scale),
    scale,
  };
}

export function compareScaled(left: ScaledInteger, right: ScaledInteger): -1 | 0 | 1 {
  const aligned = alignScaled(left, right);
  if (aligned.left === aligned.right) return 0;
  return aligned.left < aligned.right ? -1 : 1;
}
