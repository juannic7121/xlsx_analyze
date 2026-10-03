import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { analyzeDatasets } from "@/lib/statistics";
import { formatSharedPermutations } from "@/lib/comparison";

const root = path.resolve(__dirname, "../../..");
const gerPath = path.join(root, "data/samples/Ger2909241.txt");
const raPath = path.join(root, "data/samples/Ra290924292024.txt");
const excelPath = path.join(root, "data/samples/Codigo_B_Analisis1.xlsx");
const reportJsonPath = path.join(root, "tmp-validation-results.json");

type Status = "PASS" | "FAIL";

interface CheckRow {
  sheet: string;
  statistic: string;
  expected: string | number;
  actual: string | number;
  status: Status;
}

function check(
  sheet: string,
  statistic: string,
  expected: string | number,
  actual: string | number,
): CheckRow {
  const status: Status =
    String(expected ?? "") === String(actual ?? "") ? "PASS" : "FAIL";
  return { sheet, statistic, expected, actual, status };
}

describe("excel validation report generation", () => {
  it("matches every Excel statistic and writes validation JSON", () => {
    const gerText = fs.readFileSync(gerPath, "utf8");
    const raText = fs.readFileSync(raPath, "utf8");
    const analysis = analyzeDatasets({
      gerText,
      comparisonText: raText,
    });

    expect(analysis.ok).toBe(true);
    if (!analysis.ok) return;

    const { result } = analysis;
    const wb = XLSX.read(fs.readFileSync(excelPath), { type: "buffer" });
    const rows: CheckRow[] = [];

    const resumen = XLSX.utils.sheet_to_json<(string | number)[]>(
      wb.Sheets["Resumen"],
      { header: 1 },
    );
    const resumenMap = new Map(
      resumen.slice(1).map((row) => [String(row[0]), row[1] as number]),
    );

    const summaryPairs: Array<[string, number]> = [
      ["Permutaciones únicas Ger", result.summary.uniquePermutationsGer],
      [
        "Permutaciones únicas Ra",
        result.summary.uniquePermutationsComparison,
      ],
      ["Firmas Ger", result.summary.firmasGer],
      ["Firmas Ra", result.summary.firmasComparison],
      ["Firmas compartidas", result.summary.sharedFirmas],
      ["Firmas exclusivas Ger", result.summary.exclusiveFirmasGer],
      [
        "Firmas exclusivas Ra",
        result.summary.exclusiveFirmasComparison,
      ],
      [
        "Permutaciones exactas compartidas",
        result.summary.exactSharedPermutations,
      ],
    ];

    for (const [label, actual] of summaryPairs) {
      rows.push(
        check("Resumen", label, resumenMap.get(label) as number, actual),
      );
    }

    const sharedSheet = XLSX.utils.sheet_to_json<(string | number)[]>(
      wb.Sheets["Firmas Compartidas"],
      { header: 1 },
    );
    const excelShared = sharedSheet.slice(1);
    rows.push(
      check(
        "Firmas Compartidas",
        "Row count",
        excelShared.length,
        result.sharedFirmas.length,
      ),
    );

    for (let i = 0; i < Math.max(excelShared.length, result.sharedFirmas.length); i++) {
      const excel = excelShared[i];
      const calc = result.sharedFirmas[i];
      const prefix = `Row ${i + 2} (${String(excel?.[0] ?? calc?.firma ?? "?")})`;
      if (!excel || !calc) {
        rows.push(
          check("Firmas Compartidas", `${prefix} present`, "yes", "missing"),
        );
        continue;
      }
      rows.push(check("Firmas Compartidas", `${prefix} Firma`, String(excel[0]), calc.firma));
      rows.push(check("Firmas Compartidas", `${prefix} Perm. Ger`, excel[1] as number, calc.permGer));
      rows.push(check("Firmas Compartidas", `${prefix} Perm. Ra`, excel[2] as number, calc.permComparison));
      rows.push(check("Firmas Compartidas", `${prefix} Intersección`, excel[3] as number, calc.intersection));
      rows.push(check("Firmas Compartidas", `${prefix} Cobertura Ger %`, excel[4] as number, calc.coverageGerPct));
      rows.push(check("Firmas Compartidas", `${prefix} Cobertura Ra %`, excel[5] as number, calc.coverageComparisonPct));
      rows.push(check("Firmas Compartidas", `${prefix} Jaccard %`, excel[6] as number, calc.jaccardPct));
      rows.push(
        check(
          "Firmas Compartidas",
          `${prefix} Permutaciones compartidas`,
          (excel[7] as string) ?? "",
          formatSharedPermutations(calc.sharedPermutations),
        ),
      );
    }

    const rankingSheet = XLSX.utils.sheet_to_json<(string | number)[]>(
      wb.Sheets["Ranking"],
      { header: 1 },
    );
    const excelRanking = rankingSheet.slice(1);
    rows.push(
      check("Ranking", "Row count", excelRanking.length, result.ranking.length),
    );
    for (let i = 0; i < Math.max(excelRanking.length, result.ranking.length); i++) {
      const excel = excelRanking[i];
      const calc = result.ranking[i];
      const prefix = `Row ${i + 2}`;
      if (!excel || !calc) {
        rows.push(check("Ranking", `${prefix} present`, "yes", "missing"));
        continue;
      }
      rows.push(check("Ranking", `${prefix} Pos`, excel[0] as number, calc.position));
      rows.push(check("Ranking", `${prefix} Firma`, String(excel[1]), calc.firma));
      rows.push(check("Ranking", `${prefix} Coincidencias`, excel[2] as number, calc.coincidences));
      rows.push(check("Ranking", `${prefix} Jaccard %`, excel[3] as number, calc.jaccardPct));
      rows.push(check("Ranking", `${prefix} Perm. Ger`, excel[4] as number, calc.permGer));
      rows.push(check("Ranking", `${prefix} Perm. Ra`, excel[5] as number, calc.permComparison));
    }

    const exclGerSheet = XLSX.utils.sheet_to_json<(string | number)[]>(
      wb.Sheets["Exclusivas Ger"],
      { header: 1 },
    );
    const excelExGer = exclGerSheet.slice(1);
    rows.push(
      check(
        "Exclusivas Ger",
        "Row count",
        excelExGer.length,
        result.exclusiveGer.length,
      ),
    );
    for (let i = 0; i < Math.max(excelExGer.length, result.exclusiveGer.length); i++) {
      const excel = excelExGer[i];
      const calc = result.exclusiveGer[i];
      const prefix = `Row ${i + 2}`;
      if (!excel || !calc) {
        rows.push(check("Exclusivas Ger", `${prefix} present`, "yes", "missing"));
        continue;
      }
      rows.push(check("Exclusivas Ger", `${prefix} Firma`, String(excel[0]), calc.firma));
      rows.push(check("Exclusivas Ger", `${prefix} Cantidad`, excel[1] as number, calc.count));
    }

    const exclRaSheet = XLSX.utils.sheet_to_json<(string | number)[]>(
      wb.Sheets["Exclusivas Ra"],
      { header: 1 },
    );
    const excelExRa = exclRaSheet.slice(1);
    rows.push(
      check(
        "Exclusivas Ra",
        "Row count",
        excelExRa.length,
        result.exclusiveComparison.length,
      ),
    );
    for (let i = 0; i < Math.max(excelExRa.length, result.exclusiveComparison.length); i++) {
      const excel = excelExRa[i];
      const calc = result.exclusiveComparison[i];
      const prefix = `Row ${i + 2}`;
      if (!excel || !calc) {
        rows.push(check("Exclusivas Ra", `${prefix} present`, "yes", "missing"));
        continue;
      }
      rows.push(check("Exclusivas Ra", `${prefix} Firma`, String(excel[0]), calc.firma));
      rows.push(check("Exclusivas Ra", `${prefix} Cantidad`, excel[1] as number, calc.count));
    }

    const passed = rows.filter((r) => r.status === "PASS").length;
    const failed = rows.filter((r) => r.status === "FAIL");

    fs.writeFileSync(
      reportJsonPath,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          sample: {
            ger: "Ger2909241.txt",
            comparison: "Ra290924292024.txt",
            excel: "Codigo_B_Analisis1.xlsx",
            gerRecords: analysis.ger.records.length,
            comparisonRecords: analysis.comparison.records.length,
          },
          summary: {
            totalChecks: rows.length,
            passed,
            failed: failed.length,
            allPassed: failed.length === 0,
          },
          resumenChecks: rows.filter((r) => r.sheet === "Resumen"),
          failures: failed,
          allChecks: rows,
        },
        null,
        2,
      ),
    );

    expect(failed, JSON.stringify(failed.slice(0, 10), null, 2)).toHaveLength(0);
    expect(passed).toBe(rows.length);
  });
});
