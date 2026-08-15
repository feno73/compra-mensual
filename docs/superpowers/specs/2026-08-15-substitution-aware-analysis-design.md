# Diseño: análisis con sustituciones confirmadas

Fecha: 2026-08-15
Estado: aprobado durante la consulta

## Problema

La comparación actual trata todo SKU distinto como producto nuevo o ausente. Esto conserva la contabilidad, pero describe incorrectamente reemplazos funcionales. Por ejemplo, las seis leches proteicas La Serenísima de julio fueron reemplazadas por seis Las Tres Niñas en agosto y costaron $540,02 menos.

## Modelo

Cada sustitución pertenece al mes nuevo y declara:

- `id` estable;
- `previousProductIds`, con uno o más códigos del mes anterior;
- `currentProductIds`, con uno o más códigos del mes actual;
- `kind`: `equivalent` o `group-replacement`;
- `reason` y `comparisonBasis` legibles;
- `confidence: confirmed`.

La validación exige que todos los códigos existan en el período correspondiente, que sean productos nuevos/ausentes antes de reclasificarlos y que ningún código participe en dos sustituciones. Una similitud de nombre o categoría nunca crea una sustitución silenciosa.

## Reconciliación

Para cada sustitución:

`substitutionCents = neto actual del grupo - neto anterior del grupo`

Los productos del grupo dejan de participar en los factores `newProductsCents` y `absentProductsCents`. El puente queda:

`nuevos restantes + ausentes restantes + reemplazos + cantidad + precio + descuentos + ajustes = diferencia mensual`

Cada grupo expone bruto, descuentos y neto de ambos meses. Solo `equivalent` con cantidades comparables habilita conclusiones unitarias. Los grupos o cantidades diferentes se describen por totales y se explicita el cambio de composición o volumen.

## Sustituciones confirmadas julio-agosto

1. `gtin:07790742358608` → `gtin:07798338291803`: leche proteica 1 L, 6 unidades en ambos meses; equivalente.
2. `gtin:07790580567903` → `gtin:07798132920848`: tomate en lata 400 g, 4 unidades; equivalente.
3. `gtin:07791120021558` → `gtin:07790503199082`: arroz 1 kg; equivalente.
4. `gtin:07891150095618` → `gtin:07891150095700`: jabón Dove, 3 unidades de 90 g; equivalente.
5. `gtin:07798136870545` → `gtin:07798136871856`: yogur Dahi natural 190 g; equivalente.
6. `gtin:00724373569895` + `gtin:00786071065956` → `gtin:07793750000668`: reposición de yerba, 750 g anteriores frente a 500 g actuales; grupo.
7. `gtin:07798338291643` → `gtin:07798338291056`: chocolatada Tres Niñas, 500 ml anteriores frente a 400 ml actuales; equivalente con volumen diferente.
8. `gtin:07794640170386` → `gtin:07794640170720` + `gtin:05054563204387`: reposición de crema dental; grupo.
9. `gtin:07891040028931` → `gtin:07809635701107` + `gtin:07798008381575`: reposición de esponjas; grupo.
10. `gtin:02514565002563` + `gtin:02543740004948` + `gtin:07798403210128` + `gtin:07896183206031` → `gtin:03073781206289` + `gtin:07790080013610` + `gtin:07798096213611` + `gtin:02800005903720` + `gtin:07798338291735`: renovación del surtido de quesos; grupo.
11. `gtin:07798332216116` + `gtin:07798332216338` → `gtin:08906038785440`: alternativa de aromatización; grupo.

El usuario rechazó como sustituciones: cepillos dentales, snacks, legumbres, artículos de cocina y barras de cereal/proteína.

## Resultado esperado

El nuevo puente julio-agosto debe reconciliar exactamente $64.656,12:

| Factor | Importe |
|---|---:|
| Productos nuevos restantes | $191.877,21 |
| Productos ausentes restantes | -$114.082,95 |
| Reemplazos confirmados | -$12.105,49 |
| Cambio de cantidad en SKU idénticos | -$2.400,00 |
| Cambio de precio en SKU idénticos | $825,99 |
| Cambio de descuentos en SKU idénticos | $541,36 |
| Ajustes | $0,00 |

La composición sigue explicando el aumento principal, pero ahora distingue $12.105,49 de ahorro neto por reemplazos. En particular, la leche proteica muestra $13.432,52 antes, $12.892,50 ahora y $540,02 de ahorro total, aproximadamente $90,00 por unidad.

## Interfaz

- Agregar `Reemplazos` al puente y ranking de causas.
- Mostrar una sección `Reemplazos confirmados`, no `Posibles sustituciones`.
- Exponer ahorro/gasto, bruto, descuentos, neto, base comparable y tipo por grupo.
- Retirar los miembros confirmados de las listas de nuevos y ausentes.
- Continuar el historial de precio entre marcas solo para equivalencias comparables, sin afirmar que comparten SKU.
- Para grupos, mostrar totales agregados sin precio unitario común.

## Skill mensual

Después del matching exacto, el agente debe enumerar nuevos y ausentes, proponer equivalencias estrictas por función/formato/cantidad y consultar toda duda antes de guardar. Debe registrar solo sustituciones evidentes o confirmadas, validar referencias y solapamientos, recalcular el puente y resumir el impacto. Compartir categoría por sí solo nunca alcanza.

## Pruebas

- Uno a uno con igual y distinta cantidad.
- Uno a varios y varios a varios.
- Códigos inexistentes y solapamientos rechazados.
- Reclasificación de nuevos/ausentes y reconciliación exacta.
- Historial continuo solo para equivalentes comparables.
- Ahorro real de leche proteica de $540,02.
- Puente real con reemplazos de -$12.105,49 y diferencia total de $64.656,12.
- Render accesible y lenguaje confirmado/no inferido.
