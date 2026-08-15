# Diseño: historial y comparación de compras mensuales

Fecha: 2026-08-15
Estado: aprobado durante la consulta; pendiente de revisión del documento

## Contexto

El repositorio no contiene aplicación, stack, despliegue ni convenciones previas. La solución se construirá desde cero como un sitio estático público para GitHub Pages. Los JSON versionados en Git serán la fuente de verdad; no habrá backend, autenticación, base de datos ni servicios consultados durante el uso del sitio.

Los datos iniciales serán los tickets de julio y agosto de 2026. Deben reproducir $267.390,16 y $332.046,28, respectivamente, con una diferencia de $64.656,12 (aproximadamente 24,2 %). No se inventará ningún dato que no pueda verificarse.

## Arquitectura

- Astro y TypeScript para generar archivos completamente estáticos.
- `data/purchases/YYYY-MM.json` para los datos públicos normalizados.
- `src/domain/` para esquema, dinero, cantidades, agregación, comparación, conversión MEP y reconciliación, sin dependencias de interfaz.
- `src/pages/` y `src/components/` para presentación e interacción progresiva.
- `scripts/` para validaciones y transformaciones determinísticas.
- `tests/` para pruebas unitarias, integración y navegación esencial.
- `.agents/skills/update-monthly-purchases/` para el procedimiento mensual.
- `.github/workflows/` para validar, construir y publicar en GitHub Pages.

El build leerá y validará todos los meses antes de generar el sitio. Un error de esquema, duplicado, total o reconciliación bloqueará la publicación.

## Modelo de datos

Cada archivo mensual tendrá versión de esquema, mes, moneda y uno o más tickets. Cada ticket conservará fecha, comercio, sucursal útil y una huella no reversible de deduplicación, pero no números de factura, identificadores de cliente, medios de pago ni URL original.

Cada línea conservará códigos estables disponibles (código de barras, SKU o PLU), nombre original, nombre normalizado, categoría, cantidad exacta, unidad, precio unitario de lista, bruto, descuentos desglosados, neto y promociones. Los ajustes generales y los totales bruto, descontado y pagado se representarán por ticket.

Todos los importes se almacenarán como centavos enteros. Las cantidades decimales se representarán como entero, escala y unidad, evitando cálculos binarios de coma flotante.

## Dólar MEP

Cada ticket almacenará la cotización `mepVentaFinDeDia` como centavos de ARS por USD, su fecha nominal y efectiva, si se utilizó el último día hábil anterior, la fuente, el campo utilizado, una referencia versionada y la fecha de obtención.

La fuente inicial será el snapshot versionado de ArgentinaDatos, usando el campo vendedor de dólar Bolsa/MEP. En la interfaz se denominará “MEP vendedor al cierre de la jornada según ArgentinaDatos”, sin presentarlo como un cierre bursátil oficial.

Si no hubo cotización el día de compra se usará el cierre del último día hábil anterior. La conversión se hará con aritmética entera:

`USD centavos = redondear(ARS centavos × 100 / cotización MEP)`

Si existen varios tickets mensuales, cada uno se convertirá con la cotización correspondiente a su fecha y luego se sumarán sus centavos de USD. La reconciliación explicativa continuará en ARS para no mezclar variación cambiaria y variación de la compra.

## Comparación y reconciliación

Las coincidencias exactas se establecerán primero por código estable. Una similitud de nombres o categoría nunca convertirá dos productos distintos en una coincidencia exacta.

La diferencia mensual se descompondrá en:

1. neto completo de productos presentes solo en el mes nuevo;
2. negativo del neto de productos presentes solo en el mes anterior;
3. variación de cantidad de productos idénticos valuada al precio anterior;
4. resto de la variación bruta atribuible al precio;
5. cambio exacto de promociones y descuentos;
6. ajustes generales y residuo explícito de redondeo.

La suma de esos factores deberá igualar la diferencia de totales mensuales. La tolerancia máxima será de un centavo por ticket. Los totales declarados por el ticket serán autoritativos, pero líneas, descuentos y ajustes deberán reproducirlos.

Las posibles sustituciones se mostrarán en una sección separada, claramente marcadas como inferencias y excluidas de la reconciliación contable. Las compras inusuales se describirán utilizando todo el historial disponible: “no aparece en el historial anterior” o “compra poco frecuente”, nunca “nunca lo comprás” basándose en un único mes.

## Interfaz

La aplicación tendrá una página responsive en español rioplatense con:

- selector de mes y comparación;
- total ARS, equivalente USD MEP, cotización y fecha aplicadas;
- diferencia mensual en pesos y porcentaje;
- aviso visible de que los valores consideran descuentos del ticket;
- puente explicativo y ranking de causas principales;
- compras puntuales o poco frecuentes;
- tabla de productos idénticos;
- secciones de nuevos, ausentes y sustituciones inferidas;
- evolución histórica en ARS y USD MEP;
- historial de precio bruto y neto por producto habitual.

Se priorizarán texto, tablas, CSS y SVG sobre bibliotecas pesadas. Los gráficos tendrán alternativa textual. En móvil, las tablas se presentarán como tarjetas o con desplazamiento horizontal indicado. Todos los controles tendrán etiquetas, foco visible y navegación por teclado.

## Actualización mensual

El skill `.agents/skills/update-monthly-purchases/SKILL.md` se activará al incorporar, analizar o comparar tickets mensuales. Ordenará al agente leer cada ticket por completo; extraer líneas, cantidades, precios, descuentos y totales; eliminar datos sensibles; evitar duplicados; normalizar por códigos estables; obtener la cotización MEP; generar el JSON mensual; validar aritmética y esquema; comparar con el mes anterior y todo el historial; actualizar solo derivados necesarios; ejecutar pruebas y build; revisar escritorio y móvil; e informar cambios y ambigüedades.

Una línea ilegible bloqueará su incorporación hasta recibir confirmación. El skill no hará push, merge ni despliegue salvo solicitud expresa. Los scripts auxiliares contendrán únicamente tareas determinísticas y repetibles; la lectura de URL, imagen o PDF seguirá a cargo del agente.

## Calidad y aceptación

- Pruebas unitarias para dinero, cantidades, MEP, agrupación y descomposición.
- Pruebas de esquema, duplicados y ausencia de datos sensibles.
- Pruebas de consistencia para totales y diferencia de julio/agosto.
- Pruebas de reconciliación para nuevos, ausentes, cantidad, precio y descuentos.
- Prueba de integración que cargue todos los JSON y genere el sitio.
- Pruebas E2E mínimas para selector, teclado y vistas móvil/escritorio.
- Build Astro estático configurado para la ruta base de GitHub Pages.
- Workflow de GitHub Actions que valide antes de publicar.
- README limitado a instalación, ejecución, validación, actualización y publicación.

## Riesgos conocidos

- El ticket de agosto devolvió un error HTTP 500 durante la consulta y deberá recuperarse nuevamente; si no puede verificarse, los datos iniciales quedarán bloqueados.
- ArgentinaDatos ofrece una captura reproducible de fin de jornada, no un cierre bursátil oficial certificado; esa limitación se mostrará explícitamente.
- Promociones generales no atribuibles a líneas deberán conservarse como ajustes del ticket para no falsear la explicación por producto.
