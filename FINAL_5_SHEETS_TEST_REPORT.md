# FINAL_5_SHEETS_TEST_REPORT.md

Generated: 2026-10-02T17:09:01.189Z

## Verdict

**ALL 5 EXCEL SHEETS MATCH THE APPLICATION OUTPUT (PASS).**

Inputs:

- Ger: `data/samples/Ger2909241.txt`
- Comparación (Ra): `data/samples/Ra290924292024.txt`
- Excel: `data/samples/Codigo_B_Analisis1.xlsx`

Compared: row counts, column names, every cell value, sort order, percentages, leading-zero firmas.

## Sheet summary

| Sheet / view | Checks | PASS | FAIL | Status |
|--------------|-------:|-----:|-----:|--------|
| Resumen | 19 | 19 | 0 | **PASS** |
| Firmas Compartidas | 1042 | 1042 | 0 | **PASS** |
| Ranking | 789 | 789 | 0 | **PASS** |
| Exclusivas Ger | 392 | 392 | 0 | **PASS** |
| Exclusivas Ra | 283 | 283 | 0 | **PASS** |
| **TOTAL** | 2525 | 2525 | 0 | **PASS** |

## 1. Resumen

| Check | Expected | Actual | PASS/FAIL |
|-------|----------|--------|-----------|
| Column A name | Métrica | Métrica | PASS |
| Column B name | Valor | Valor | PASS |
| Metric row count | 8 | 8 | PASS |
| Row order 1: Permutaciones únicas Ger | Permutaciones únicas Ger | Permutaciones únicas Ger | PASS |
| Value: Permutaciones únicas Ger | 1820 | 1820 | PASS |
| Row order 2: Permutaciones únicas Ra | Permutaciones únicas Ra | Permutaciones únicas Ra | PASS |
| Value: Permutaciones únicas Ra | 1464 | 1464 | PASS |
| Row order 3: Firmas Ger | Firmas Ger | Firmas Ger | PASS |
| Value: Firmas Ger | 294 | 294 | PASS |
| Row order 4: Firmas Ra | Firmas Ra | Firmas Ra | PASS |
| Value: Firmas Ra | 235 | 235 | PASS |
| Row order 5: Firmas compartidas | Firmas compartidas | Firmas compartidas | PASS |
| Value: Firmas compartidas | 126 | 126 | PASS |
| Row order 6: Firmas exclusivas Ger | Firmas exclusivas Ger | Firmas exclusivas Ger | PASS |
| Value: Firmas exclusivas Ger | 168 | 168 | PASS |
| Row order 7: Firmas exclusivas Ra | Firmas exclusivas Ra | Firmas exclusivas Ra | PASS |
| Value: Firmas exclusivas Ra | 109 | 109 | PASS |
| Row order 8: Permutaciones exactas compartidas | Permutaciones exactas compartidas | Permutaciones exactas compartidas | PASS |
| Value: Permutaciones exactas compartidas | 382 | 382 | PASS |

## 2. Firmas Compartidas

Row count Excel: **126** · App: **126** · PASS

Excel columns: `Firma | Perm. Ger | Perm. Ra | Intersección | Cobertura Ger % | Cobertura Ra % | Jaccard % | Permutaciones compartidas`

App columns (same data; Ra labeled Comparación in UI): `Firma | Perm. Ger | Perm. Comparación | Intersección | Cobertura Ger % | Cobertura Comparación % | Jaccard % | Permutaciones compartidas`

All **1042** cell/order/percentage checks **PASS** (every row, every column).

## 3. Ranking

Row count Excel: **126** · App: **126** · PASS

Columns: `Pos | Firma | Coincidencias | Jaccard % | Perm. Ger | Perm. Ra/Comparación`

All **789** cell/order/percentage checks **PASS**.

Top 5 (Excel = App):

| Pos | Firma | Coincidencias | Jaccard % |
|----:|-------|--------------:|----------:|
| 1 | 1235 | 24 | 100 |
| 2 | 1259 | 22 | 91.67 |
| 3 | 1257 | 20 | 83.33 |
| 4 | 1269 | 18 | 75 |
| 5 | 1279 | 16 | 66.67 |

## 4. Exclusivas Ger

Row count Excel: **168** · App: **168** · PASS

Columns: `Firma | Cantidad`

Leading-zero examples: `0128` kept as string (not `128`).

All **392** checks **PASS**.

## 5. Exclusivas Ra → UI «Exclusivas Comparación»

Row count Excel: **109** · App: **109** · PASS

Columns: `Firma | Cantidad`

Leading-zero examples: `0001` kept as string.

All **283** checks **PASS**.

## Notes

- Calculation engine was not modified for this validation.
- UI labels «Comparación» map to Excel «Ra» columns/sheet for the sample.
- Full machine-readable dump: `tmp-5-sheets-validation.json`.
