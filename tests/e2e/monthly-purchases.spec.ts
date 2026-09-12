import { expect, test } from "@playwright/test";

test("muestra el resumen de septiembre y permite navegar a agosto", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Compras mensuales" })).toBeVisible();
  await expect(page.getByRole("article", { name: "Total pagado" }).getByText("$ 317.987,63")).toBeVisible();
  await expect(page.getByRole("article", { name: "Equivalente MEP" }).getByText("US$ 206,77")).toBeVisible();
  await expect(page.getByText(/consideran los descuentos del ticket/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reemplazos confirmados" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reemplazos confirmados" }).locator("..").getByRole("heading", { name: /Cambio confirmado de sabor de caramelos Lheritier/i })).toBeVisible();
  await page.getByRole("link", { name: /agosto de 2026/i }).click();
  await expect(page).toHaveURL(/\/mes\/2026-08\/$/);
  await expect(page.getByRole("article", { name: "Total pagado" }).getByText("$ 332.046,28")).toBeVisible();
});

test("no desborda la página en móvil y mantiene navegación por teclado", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});
