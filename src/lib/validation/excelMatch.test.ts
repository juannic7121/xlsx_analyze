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

function loadText(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

describe("sample datasets vs Excel reference", () => {
  it("reproduces Resumen, Firmas Compartidas, Ranking and Exclusivas", () => {
    const gerText = loadText(gerPath);
    const raText = loadText(raPath);
    const analysis = analyzeDatasets({
      gerText,
      comparisonText: raText,
    });

    expect(analysis.ok).toBe(true);
    if (!analysis.ok) return;

    const { result } = analysis;
    const wb = XLSX.read(fs.readFileSync(excelPath), { type: "buffer" });

    // --- Resumen ---
    const resumen = XLSX.utils.sheet_to_json<(string | number)[]>(
      wb.Sheets["Resumen"],
      { header: 1 },
    );
    const resumenMap = new Map(
      resumen.slice(1).map((row) => [String(row[0]), row[1] as number]),
    );

    expect(result.summary.uniquePermutationsGer).toBe(
      resumenMap.get("Permutaciones únicas Ger"),
    );
    expect(result.summary.uniquePermutationsComparison).toBe(
      resumenMap.get("Permutaciones únicas Ra"),
    );
    expect(result.summary.firmasGer).toBe(resumenMap.get("Firmas Ger"));
    expect(result.summary.firmasComparison).toBe(resumenMap.get("Firmas Ra"));
    expect(result.summary.sharedFirmas).toBe(
      resumenMap.get("Firmas compartidas"),
    );
    expect(result.summary.exclusiveFirmasGer).toBe(
      resumenMap.get("Firmas exclusivas Ger"),
    );
    expect(result.summary.exclusiveFirmasComparison).toBe(
      resumenMap.get("Firmas exclusivas Ra"),
    );
    expect(result.summary.exactSharedPermutations).toBe(
      resumenMap.get("Permutaciones exactas compartidas"),
    );

    // --- Firmas Compartidas ---
    const sharedSheet = XLSX.utils.sheet_to_json<(string | number)[]>(
      wb.Sheets["Firmas Compartidas"],
      { header: 1 },
    );
    const excelShared = sharedSheet.slice(1);
    expect(result.sharedFirmas).toHaveLength(excelShared.length);

    for (let i = 0; i < excelShared.length; i++) {
      const excel = excelShared[i];
      const calc = result.sharedFirmas[i];
      expect(calc.firma, `shared firma row ${i + 2}`).toBe(String(excel[0]));
      expect(calc.permGer).toBe(excel[1]);
      expect(calc.permComparison).toBe(excel[2]);
      expect(calc.intersection).toBe(excel[3]);
      expect(calc.coverageGerPct).toBe(excel[4]);
      expect(calc.coverageComparisonPct).toBe(excel[5]);
      expect(calc.jaccardPct).toBe(excel[6]);
      expect(formatSharedPermutations(calc.sharedPermutations)).toBe(
        excel[7] ?? "",
      );
    }

    // --- Ranking ---
    const rankingSheet = XLSX.utils.sheet_to_json<(string | number)[]>(
      wb.Sheets["Ranking"],
      { header: 1 },
    );
    const excelRanking = rankingSheet.slice(1);
    expect(result.ranking).toHaveLength(excelRanking.length);

    for (let i = 0; i < excelRanking.length; i++) {
      const excel = excelRanking[i];
      const calc = result.ranking[i];
      expect(calc.position).toBe(excel[0]);
      expect(calc.firma).toBe(String(excel[1]));
      expect(calc.coincidences).toBe(excel[2]);
      expect(calc.jaccardPct).toBe(excel[3]);
      expect(calc.permGer).toBe(excel[4]);
      expect(calc.permComparison).toBe(excel[5]);
    }

    // --- Exclusivas Ger ---
    const exclGerSheet = XLSX.utils.sheet_to_json<(string | number)[]>(
      wb.Sheets["Exclusivas Ger"],
      { header: 1 },
    );
    const excelExGer = exclGerSheet.slice(1);
    expect(result.exclusiveGer).toHaveLength(excelExGer.length);
    for (let i = 0; i < excelExGer.length; i++) {
      expect(result.exclusiveGer[i].firma).toBe(String(excelExGer[i][0]));
      expect(result.exclusiveGer[i].count).toBe(excelExGer[i][1]);
    }

    // --- Exclusivas Ra ---
    const exclRaSheet = XLSX.utils.sheet_to_json<(string | number)[]>(
      wb.Sheets["Exclusivas Ra"],
      { header: 1 },
    );
    const excelExRa = exclRaSheet.slice(1);
    expect(result.exclusiveComparison).toHaveLength(excelExRa.length);
    for (let i = 0; i < excelExRa.length; i++) {
      expect(result.exclusiveComparison[i].firma).toBe(String(excelExRa[i][0]));
      expect(result.exclusiveComparison[i].count).toBe(excelExRa[i][1]);
    }
  });
});
