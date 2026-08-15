import { readFile } from "node:fs/promises";
import { expect, test } from "vitest";

const skillPath = ".agents/skills/update-monthly-purchases/SKILL.md";

test("el skill se descubre al incorporar, analizar o comparar tickets mensuales", async () => {
  const skill = await readFile(skillPath, "utf8");
  expect(skill).toMatch(/^---\nname: update-monthly-purchases\ndescription: Use when .*incorporar.*analizar.*comparar.*ticket.*supermercado/im);
});

test("el skill cubre el flujo mensual completo y bloquea ambigüedades", async () => {
  const skill = await readFile(skillPath, "utf8");
  for (const requirement of [
    "leer completamente", "cada línea", "total bruto", "códigos estables", "duplicado",
    "JSON", "suma", "mes anterior", "historial", "archivos derivados", "pruebas", "build",
    "revisar visualmente", "solicitar confirmación", "dólar MEP",
  ]) expect(skill.toLocaleLowerCase("es-AR")).toContain(requirement.toLocaleLowerCase("es-AR"));
  expect(skill).toMatch(/no (?:hacer|hagas) (?:push|merge|deploy|despliegue)/i);
});
