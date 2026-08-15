import { expect, test } from "@playwright/test";

test("muestra el resumen de agosto y permite navegar a julio", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Compras mensuales" })).toBeVisible();
  await expect(page.getByRole("article", { name: "Total pagado" }).getByText("$ 332.046,28")).toBeVisible();
  await expect(page.getByRole("article", { name: "Equivalente MEP" }).getByText("US$ 218,22")).toBeVisible();
  await expect(page.getByText(/consideran los descuentos del ticket/i)).toBeVisible();
  await page.getByRole("link", { name: /julio de 2026/i }).click();
  await expect(page).toHaveURL(/\/mes\/2026-07\/$/);
  await expect(page.getByRole("article", { name: "Total pagado" }).getByText("$ 267.390,16")).toBeVisible();
});

test("no desborda la página en móvil y mantiene navegación por teclado", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});
