import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { purchaseMonthSchema, type PurchaseMonth } from "./schema";

export async function loadPurchaseMonths(directory = resolve("data/purchases")): Promise<PurchaseMonth[]> {
  const files = (await readdir(directory)).filter((file) => /^\d{4}-\d{2}\.json$/.test(file)).sort();
  const months = await Promise.all(files.map(async (file) => {
    const raw = JSON.parse(await readFile(resolve(directory, file), "utf8")) as unknown;
    return purchaseMonthSchema.parse(raw);
  }));
  return months;
}
