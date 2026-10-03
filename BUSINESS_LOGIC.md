# Lógica de negocio

Cálculo determinista usado por la aplicación. Ger es siempre la lista base.

## Parsing TXT

- Una línea = un código.
- Código válido: exactamente **4 dígitos** (`0`–`9`).
- Se normalizan BOM UTF-8, CRLF/LF y espacios al inicio/final.
- Líneas en blanco: se ignoran.
- Filas inválidas: se reportan y bloquean el análisis (no se ignoran en silencio).
- Duplicados: cuentan en el total de registros; el análisis usa el **conjunto único**.

## Permutación

El código de 4 dígitos tal como aparece (ejemplo: `8791`).

## Firma (signature)

Dígitos de la permutación ordenados de menor a mayor.

| Permutación | Firma |
|-------------|-------|
| `8791` | `1789` |
| `1987` | `1789` |
| `5321` | `1235` |

## Agrupación

Se agrupan las permutaciones **únicas** por firma en Ger y en el dataset de comparación.

## Resumen

| Métrica | Definición |
|---------|------------|
| Permutaciones únicas Ger | Tamaño del conjunto único Ger |
| Permutaciones únicas Comparación | Tamaño del conjunto único de comparación |
| Firmas Ger / Comparación | Número de firmas distintas en cada lado |
| Firmas compartidas | Firmas presentes en ambos (aunque la intersección exacta de códigos sea 0) |
| Firmas exclusivas Ger / Comparación | Firmas solo en un lado |
| Permutaciones exactas compartidas | Códigos idénticos presentes en ambos conjuntos |

## Firmas compartidas (detalle)

Para cada firma compartida `f`:

- `Perm. Ger` = permutaciones únicas de Ger con firma `f`
- `Perm. Comparación` = ídem en comparación
- `Intersección` = códigos exactos en ambos
- `Cobertura Ger %` = `intersección / Perm.Ger × 100` (2 decimales)
- `Cobertura Comparación %` = `intersección / Perm.Comparación × 100`
- `Jaccard %` = `intersección / unión × 100`

Orden: intersección ↓, Jaccard ↓, firma ↑.

## Ranking

Misma colección de firmas compartidas, con posición 1-based tras el mismo orden.

## Exclusivas

Firmas solo en Ger o solo en comparación, con **Cantidad** = número de permutaciones únicas de esa firma. Orden por firma ascendente.

## Valores de referencia (solo tests)

Con las muestras privadas de validación, el resumen esperado es:

1820, 1464, 294, 235, 126, 168, 109, 382

Esos números **no** están hardcodeados en el motor de cálculo; solo en tests de regresión.
