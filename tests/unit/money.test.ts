import { describe, expect, test } from "vitest";

import { divideRounded, formatArs, formatPercent, toUsdCents } from "../../src/domain/money";

describe("divideRounded", () => {
  test("redondea empates alejándose de cero", () => {
    expect(divideRounded(5n, 2n)).toBe(3n);
    expect(divideRounded(-5n, 2n)).toBe(-3n);
  });
});

test("convierte pesos a centavos de USD sin coma flotante", () => {
  expect(toUsdCents(26_739_016n, 153_270n)).toBe(17_446n);
});

test("formatea moneda y porcentaje en español argentino", () => {
  expect(formatArs(26_739_016n)).toBe("$ 267.390,16");
  expect(formatPercent(6_465_612n, 26_739_016n)).toBe("24,2 %");
  expect(formatPercent(100n, 0n)).toBe("No aplicable");
});
