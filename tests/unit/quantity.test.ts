import { expect, test } from "vitest";

import { alignScaled, compareScaled, scaledToBigInt } from "../../src/domain/quantity";

test("alinea cantidades decimales de forma exacta", () => {
  expect(alignScaled({ value: 256, scale: 3 }, { value: 1, scale: 0 })).toEqual({
    left: 256n,
    right: 1000n,
    scale: 3,
  });
});

test("compara y convierte cantidades sin usar coma flotante", () => {
  expect(compareScaled({ value: 1500, scale: 3 }, { value: 15, scale: 1 })).toBe(0);
  expect(scaledToBigInt({ value: 222, scale: 3 }, 6)).toBe(222_000n);
});
