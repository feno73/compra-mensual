import { loadPurchaseMonths } from "../src/domain/purchases/load";
import { validatePurchaseHistory } from "../src/domain/purchases/validate";

const months = await loadPurchaseMonths();
const issues = validatePurchaseHistory(months);
if (issues.length > 0) {
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exitCode = 1;
} else {
  console.log(`${months.length} meses validados correctamente.`);
}
