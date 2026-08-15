# Aplicación de compras mensuales — Plan de implementación

> **Para agentes ejecutores:** usar `subagent-driven-development` o `executing-plans` para implementar este plan por tareas, con revisión entre tareas. No hacer commit, push, merge ni despliegue salvo solicitud expresa.

**Objetivo:** construir un sitio Astro estático, público y reproducible que valide compras mensuales versionadas, explique exactamente sus variaciones y muestre equivalentes en USD MEP.

**Arquitectura:** JSON validado durante tests y build como única fuente de verdad; dominio TypeScript puro para aritmética, matching, reconciliación e historial; Astro para HTML estático e interacción progresiva. La actualización mensual será asistida por agente, pero todos los controles de datos serán determinísticos y sin red durante el build.

**Stack:** Node.js 22+, pnpm, Astro, TypeScript estricto, Zod, Vitest, Playwright, CSS y SVG nativos, GitHub Actions/Pages.

## Contexto

- Repositorio greenfield: solo existe `readme.md.txt` vacío.
- Diseño aprobado: `.omc/drafts/monthly-purchases-app-design.md`.
- Destino: GitHub Pages como sitio de proyecto, con `site` y `base` derivados de `GITHUB_REPOSITORY` para no fijar una URL personal.
- Datos públicos autorizados por el usuario; tickets originales y URLs permanecerán fuera de Git.
- Julio y agosto de 2026 deben reproducir exactamente `26.739.016`, `33.204.628` y `6.465.612` centavos ARS; el porcentaje julio→agosto debe mostrarse como `24,2 %`.
- MEP vendedor de fin de jornada según ArgentinaDatos: 10/07/2026 `153.270` centavos ARS/USD y 14/08/2026 `152.160`, con equivalentes redondeados de `17.446` y `21.822` centavos USD.

## Objetivos de trabajo

1. Establecer contratos de datos y aritmética exacta antes de cargar tickets.
2. Incorporar julio/agosto únicamente desde evidencia verificable y bloquear toda ambigüedad.
3. Producir una reconciliación mensual exacta, explicable y estable.
4. Entregar una interfaz responsive, accesible y mayormente funcional sin JavaScript.
5. Automatizar actualización, validación, build y publicación estática.

## Guardrails

### Debe tener

- Importes finales como enteros JSON en centavos; cálculos intermedios con `bigint`.
- Cantidades y precios pesables como entero más escala; redondeo `half-away-from-zero` solo donde el contrato lo indique.
- Identidad `gtin:<código>` o `<comercio>:<tipo>:<código>`; fallback `manual:<slug>` solo con confirmación y evidencia declaradas.
- Huella SHA-256 de los bytes fuente para deduplicación global; evidencia fuente en `.private/tickets/`, ignorada por Git.
- Build, tests y render sin acceso de red.
- Igualdad exacta del puente mensual; cualquier centavo tolerado al validar el ticket debe aparecer como ajuste explícito.
- Contenido principal disponible sin JavaScript y navegación completa por teclado.

### No debe tener

- Backend, autenticación, base de datos, telemetría ni consultas runtime.
- OCR genérico, matching semántico automático o afirmaciones estadísticas con solo dos meses.
- Markdown como fuente de datos, URLs completas de tickets ni identificadores sensibles.
- Doble conteo de descuentos: nuevos/ausentes usan neto completo; el factor descuento solo aplica a productos coincidentes.
- Dependencia pesada de gráficos; usar CSS/SVG y equivalentes textuales.
- Sobrescritura silenciosa de meses, tickets o snapshots MEP.

## Flujo y contratos comunes

- Ecuación de línea: `netCents = grossCents - sum(discounts.amountCents)`; los descuentos son magnitudes no negativas.
- Ecuación de ticket: `paidCents = sum(line.netCents) + sum(adjustments.amountCents)`; ajustes generales usan signo y no se asignan artificialmente a productos.
- Un residuo fuente de hasta un centavo se guarda como ajuste explícito; una diferencia mayor invalida el ticket.
- Comparación predeterminada: el mes seleccionado contra el último mes cronológicamente anterior disponible. Con un solo mes no se intenta comparar.
- Para cada producto coincidente agregado por clave y unidad: `cantidad = round((qNueva-qAnterior) × brutoAnterior/qAnterior)`; `precio = brutoNuevo-brutoAnterior-cantidad`; `descuento = -(descuentoNuevo-descuentoAnterior)`. Así, cantidad + precio + descuento reproduce exactamente la variación neta del producto.
- Productos nuevos aportan su neto nuevo; ausentes aportan el negativo de su neto anterior. Ajustes generales aportan la diferencia entre meses.
- Sustituciones: lista manual opcional entre claves distintas, con motivo y nivel de confianza; nunca altera matching ni reconciliación.
- “Poco frecuente” se pospone hasta disponer de seis meses. Antes se usa únicamente “no aparece en el historial anterior”.
- MEP: resolver la fecha exacta o el registro anterior más reciente; rechazar valores nulos, no positivos, futuros o ambiguos. Convertir cada ticket y sumar USD por mes.

## Tareas

### 1. Inicializar el proyecto y fijar los contratos del dominio

**Archivos:**
- Crear: `package.json`, `pnpm-lock.yaml`, `.nvmrc`, `astro.config.ts`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `.gitignore`.
- Crear: `src/domain/purchases/schema.ts`, `src/domain/money.ts`, `src/domain/quantity.ts`, `src/domain/purchases/types.ts`.
- Crear pruebas: `tests/unit/money.test.ts`, `tests/unit/quantity.test.ts`, `tests/unit/schema.test.ts`.

**Acciones:**
- Configurar Astro estático, TypeScript estricto, scripts `dev`, `check`, `test`, `test:e2e`, `validate` y `build`; configurar `site/base` para ejecución local y GitHub Pages.
- Definir con Zod el mes, tickets, líneas, descuentos, ajustes, identidad namespaced, huellas, sustituciones declaradas y referencia MEP. Prohibir campos sensibles mediante validación recursiva de claves y patrones.
- Implementar racionales enteros, división con redondeo `half-away-from-zero`, formato ARS/USD y porcentaje; rechazar cantidades negativas, devoluciones y unidades incompatibles en v1.
- Escribir primero fixtures inválidos/válidos y casos de empate, pesables, cero, rango y serialización; luego implementar hasta que las pruebas pasen.

**Aceptación:**
- `pnpm test -- tests/unit/money.test.ts tests/unit/quantity.test.ts tests/unit/schema.test.ts` pasa sin red.
- Ningún cálculo monetario usa `number` para operaciones intermedias.
- El esquema rechaza URL/token de ticket, factura, cliente, documento, tarjeta, cuenta, email, teléfono y medio de pago.
- Astro genera una página mínima bajo la ruta base configurada.

### 2. Construir el pipeline de datos e incorporar julio/agosto

**Archivos:**
- Crear: `data/exchange-rates/mep.json`, `data/purchases/2026-07.json`, `data/purchases/2026-08.json`.
- Crear: `src/domain/purchases/load.ts`, `src/domain/purchases/validate.ts`, `scripts/validate-data.ts`, `scripts/fingerprint-ticket.ts`.
- Crear pruebas: `tests/fixtures/`, `tests/unit/purchase-validation.test.ts`, `tests/integration/initial-data.test.ts`.

**Acciones:**
- Reintentar ambos tickets; guardar temporalmente evidencia completa en `.private/tickets/` y nunca versionarla. Si agosto sigue inaccesible, detener esta tarea y solicitar imagen/PDF u otra evidencia legible al usuario.
- Extraer cada línea y ajuste con una referencia local a su posición en la evidencia privada; preservar precio unitario con escala suficiente para pesables y tratar bruto/neto impresos como importes autoritativos.
- Crear huella SHA-256 de los bytes fuente y rechazarla si aparece en cualquier mes; dos tickets distintos con igual fecha/total deben seguir siendo válidos.
- Versionar únicamente los registros MEP necesarios, con fecha nominal/efectiva, tasa, campo `venta`, commit SHA/digest de ArgentinaDatos y fecha de obtención.
- Validar ecuaciones de línea/ticket, totales declarados, namespaces, duplicados, privacidad y MEP. No escribir el JSON final si existe una línea ambigua.

**Aceptación:**
- Julio suma exactamente `26.739.016` centavos, agosto `33.204.628` y la diferencia es `6.465.612`.
- Sus equivalentes MEP son `17.446` y `21.822` centavos USD con las tasas versionadas.
- `pnpm validate` falla ante una diferencia mayor a un centavo y exige ajuste explícito para cualquier residuo permitido.
- Ejecutar dos veces el pipeline sobre la misma entrada produce JSON semánticamente idéntico y reporta el duplicado antes de modificar datos.
- Una revisión línea por línea confirma que no hay valores ficticios ni datos prohibidos.

### 3. Implementar comparación, reconciliación e historial con TDD

**Archivos:**
- Crear: `src/domain/comparison/aggregate.ts`, `src/domain/comparison/compare.ts`, `src/domain/comparison/reconcile.ts`, `src/domain/history.ts`, `src/domain/view-model.ts`.
- Crear pruebas: `tests/unit/aggregate.test.ts`, `tests/unit/compare.test.ts`, `tests/unit/reconcile.test.ts`, `tests/unit/history.test.ts`, `tests/integration/july-august-comparison.test.ts`.

**Acciones:**
- Agregar líneas repetidas por identidad y unidad conservando cantidad racional, bruto, descuento y neto; soportar múltiples tickets y precios mediante totales ponderados, no FIFO.
- Implementar categorías exactas: nuevos, ausentes, cantidad, precio, descuentos y ajustes. Aplicar descuento solo a coincidencias para evitar doble conteo.
- Exigir que la suma entera de factores iguale exactamente la diferencia mensual; ordenar causas por magnitud absoluta y luego por clave estable.
- Crear historial ARS/USD y de precios bruto/neto por producto; resolver “mes anterior” como último mes disponible y estados de cero/un solo mes.
- Generar sustituciones solo desde declaraciones manuales válidas y lenguaje histórico basado en evidencia.

**Aceptación:**
- Fixtures cubren mismo producto/misma cantidad, cantidad distinta, descuento distinto, nuevos, ausentes, múltiples líneas/precios, sin coincidencias y ajustes generales.
- Julio→agosto produce `6.465.612` centavos y `24,2 %`; los productos exactos repetidos no son la causa principal.
- Mes anterior cero muestra porcentaje no aplicable, nunca `NaN` o infinito.
- Cada fixture y el dataset real cumplen reconciliación exacta a nivel producto y mes.

### 4. Construir la interfaz estática responsive y accesible

**Archivos:**
- Crear: `src/layouts/BaseLayout.astro`, `src/pages/index.astro`, `src/pages/mes/[month].astro`.
- Crear: `src/components/MonthSelector.astro`, `MonthlySummary.astro`, `ChangeBridge.astro`, `CauseRanking.astro`, `ComparableProducts.astro`, `PresenceChanges.astro`, `SubstitutionInferences.astro`, `SpendingHistory.astro`, `ProductPriceHistory.astro`.
- Crear: `src/styles/global.css`, `src/scripts/month-controls.ts`.
- Crear pruebas: `tests/e2e/monthly-purchases.spec.ts`, `tests/integration/render-pages.test.ts`.

**Acciones:**
- Generar una ruta estática por mes y hacer que el selector navegue con enlaces reales; JavaScript solo mejora filtros/ordenamiento.
- Mostrar resumen ARS, USD MEP, fecha/tasa o desglose de múltiples tasas, diferencia, porcentaje y aviso permanente sobre descuentos.
- Renderizar puente, ranking, comparables, nuevos, ausentes, inferencias e historias con tablas y SVG/CSS liviano; proporcionar el mismo dato esencial en texto.
- Diseñar mobile-first, foco visible, controles con nombre accesible, encabezados/tablas semánticos y desplazamiento horizontal restringido al contenedor de tablas.
- Probar estados de uno/dos meses y JavaScript deshabilitado.

**Aceptación:**
- Playwright pasa en Chromium y Firefox a `390×844` y `1440×900`.
- Selector, filtros y enlaces funcionan con teclado; el contenido principal sigue visible sin JavaScript.
- No hay overflow horizontal de página, importes truncados ni activos rotos bajo la base de GitHub Pages.
- La interfaz usa español rioplatense y distingue claramente coincidencias exactas de inferencias.

### 5. Formalizar el proceso mensual, documentación y entrega continua

**Archivos:**
- Crear: `.agents/skills/update-monthly-purchases/SKILL.md` y, solo si aporta lógica determinística adicional, scripts bajo `.agents/skills/update-monthly-purchases/scripts/`.
- Crear: `.github/workflows/ci.yml`, `.github/workflows/deploy-pages.yml`, `README.md`.
- Eliminar: `readme.md.txt`.

**Acciones:**
- Durante la implementación del skill, cargar `writing-skills`; mantener `SKILL.md` breve, con descripción que active incorporación, análisis o comparación de tickets mensuales.
- Incluir los doce pasos solicitados, bloqueo por ambigüedad, deduplicación global, MEP, idempotencia, correcciones históricas explícitas y prohibición de push/merge/deploy no solicitado.
- Configurar CI para instalar con lockfile, validar datos, ejecutar tests/check/build y subir artifact solo si todo pasa. Configurar Pages para desplegar exclusivamente ese artifact validado.
- Escribir un README limitado a ejecutar, validar, actualizar y publicar; documentar `.private/tickets/` y la alternativa manual cuando una URL falle.
- Ejecutar revisión visual final de escritorio/móvil y una revisión manual de privacidad del artifact.

**Aceptación:**
- `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm validate`, `pnpm test`, `pnpm build` y `pnpm test:e2e` pasan desde un checkout limpio.
- El build completo funciona sin red y no contiene URLs de tickets ni patrones sensibles.
- CI bloquea despliegue ante datos, tests o build inválidos; Pages carga HTML, CSS, JS y rutas bajo el nombre real del repositorio.
- Una simulación exitosa y una bloqueada del skill demuestran idempotencia y ausencia de cambios parciales.
- El reporte final enumera arquitectura, archivos, pruebas, build, decisiones/ambigüedades y pasos de publicación.

## Criterios globales de éxito

- La aplicación explica y reconcilia el cambio mensual con centavos enteros.
- Los datos iniciales y equivalentes MEP coinciden con los valores de aceptación.
- La composición distinta, no los productos exactamente repetidos, aparece como explicación principal julio→agosto.
- Los datos ambiguos bloquean el proceso en lugar de completarse por inferencia.
- Sitio, validaciones, skill y workflows permanecen pequeños, auditables y reproducibles.
