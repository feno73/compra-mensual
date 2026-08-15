import { expect, test } from "vitest";

import { createDashboardModel } from "../../src/domain/view-model";
import { loadPurchaseMonths } from "../../src/domain/purchases/load";

test("selecciona el mes y lo compara con el último mes disponible anterior", async () => {
  const months = await loadPurchaseMonths();
  const august = createDashboardModel(months, "2026-08");
  const july = createDashboardModel(months, "2026-07");

  expect(august.selected.month).toBe("2026-08");
  expect(august.comparison?.previousMonth).toBe("2026-07");
  expect(august.history).toHaveLength(2);
  expect(august.priceHistories.length).toBeGreaterThan(0);
  expect(july.comparison).toBeNull();
});
