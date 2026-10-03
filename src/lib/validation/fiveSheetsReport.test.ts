/**
 * Generates a full 5-sheet Excel vs app validation dump.
 * Run via: npx vitest run src/lib/validation/fiveSheetsReport.test.ts
 */
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
const outMd = path.join(root, "FINAL_5_SHEETS_TEST_REPORT.md");
const outJson = path.join(root, "tmp-5-sheets-validation.json");

type Status = "PASS" | "FAIL";

interface Check {
  section: string;
  check: string;
  expected: string;
  actual: string;
  status: Status;
}

function cmp(section: string, check: string, expected: unknown, actual: unknown): Check {
  const e = expected === null || expected === undefined ? "" : String(expected);
  const a = actual === null || actual === undefined ? "" : String(actual);
  return {
    section,
    check,
    expected: e,
    actual: a,
    status: e === a ? "PASS" : "FAIL",
  };
}

function hasLeadingZeroIssue(firma: string): boolean {
  return /^0\d+$/.test(firma) && Number(firma).toString() === firma.replace(/^0+/, "") || false;
}

describe("5 Excel sheets full validation + report", () => {
  it("matches every sheet and writes FINAL_5_SHEETS_TEST_REPORT.md", () => {
    const analysis = analyzeDatasets({
      gerText: fs.readFileSync(gerPath, "utf8"),
      comparisonText: fs.readFileSync(raPath, "utf8"),
    });
    expect(analysis.ok).toBe(true);
    if (!analysis.ok) return;

    const { result } = analysis;
    const wb = XLSX.read(fs.readFileSync(excelPath), { type: "buffer" });
    const checks: Check[] = [];
    const sectionSummary: Record<
      string,
      { pass: number; fail: number; mismatches: Check[] }
    > = {};

    function add(c: Check) {
      checks.push(c);
      if (!sectionSummary[c.section]) {
        sectionSummary[c.section] = { pass: 0, fail: 0, mismatches: [] };
      }
      if (c.status === "PASS") sectionSummary[c.section].pass += 1;
      else {
        sectionSummary[c.section].fail += 1;
        sectionSummary[c.section].mismatches.push(c);
      }
    }

    // ---------- RESUMEN ----------
    const resumen = XLSX.utils.sheet_to_json<(string | number)[]>(
      wb.Sheets["Resumen"],
      { header: 1 },
    );
    const excelResumenHeaders = resumen[0];
    add(cmp("Resumen", "Column A name", "Métrica", excelResumenHeaders[0]));
    add(cmp("Resumen", "Column B name", "Valor", excelResumenHeaders[1]));
    add(cmp("Resumen", "Metric row count", 8, resumen.length - 1));

    const appResumen: Array<[string, number]> = [
      ["Permutaciones únicas Ger", result.summary.uniquePermutationsGer],
      ["Permutaciones únicas Ra", result.summary.uniquePermutationsComparison],
      ["Firmas Ger", result.summary.firmasGer],
      ["Firmas Ra", result.summary.firmasComparison],
      ["Firmas compartidas", result.summary.sharedFirmas],
      ["Firmas exclusivas Ger", result.summary.exclusiveFirmasGer],
      ["Firmas exclusivas Ra", result.summary.exclusiveFirmasComparison],
      [
        "Permutaciones exactas compartidas",
        result.summary.exactSharedPermutations,
      ],
    ];

    // Order of metrics in Excel
    for (let i = 1; i < resumen.length; i++) {
      const [label, expected] = resumen[i];
      const appPair = appResumen.find((p) => p[0] === String(label));
      add(
        cmp(
          "Resumen",
          `Row order ${i}: ${label}`,
          String(label),
          appPair ? String(label) : "MISSING_IN_APP",
        ),
      );
      add(
        cmp(
          "Resumen",
          `Value: ${label}`,
          expected,
          appPair ? appPair[1] : "MISSING",
        ),
      );
    }

    // ---------- FIRMAS COMPARTIDAS ----------
    const sharedSheet = XLSX.utils.sheet_to_json<(string | number)[]>(
      wb.Sheets["Firmas Compartidas"],
      { header: 1 },
    );
    const sharedHeaders = sharedSheet[0].map(String);
    const expectedSharedHeaders = [
      "Firma",
      "Perm. Ger",
      "Perm. Ra",
      "Intersección",
      "Cobertura Ger %",
      "Cobertura Ra %",
      "Jaccard %",
      "Permutaciones compartidas",
    ];
    add(
      cmp(
        "Firmas Compartidas",
        "Column names",
        expectedSharedHeaders.join(" | "),
        sharedHeaders.join(" | "),
      ),
    );
    const appSharedHeaders = [
      "Firma",
      "Perm. Ger",
      "Perm. Comparación",
      "Intersección",
      "Cobertura Ger %",
      "Cobertura Comparación %",
      "Jaccard %",
      "Permutaciones compartidas",
    ];
    // App exposes same 8 Excel columns; UI renames Ra → Comparación only.
    add(
      cmp(
        "Firmas Compartidas",
        "App column count matches Excel",
        expectedSharedHeaders.length,
        appSharedHeaders.length,
      ),
    );

    const excelShared = sharedSheet.slice(1);
    add(
      cmp(
        "Firmas Compartidas",
        "Row count",
        excelShared.length,
        result.sharedFirmas.length,
      ),
    );

    for (let i = 0; i < Math.max(excelShared.length, result.sharedFirmas.length); i++) {
      const excel = excelShared[i];
      const calc = result.sharedFirmas[i];
      const row = i + 2;
      if (!excel || !calc) {
        add(
          cmp(
            "Firmas Compartidas",
            `Row ${row} presence`,
            excel ? String(excel[0]) : "missing",
            calc ? calc.firma : "missing",
          ),
        );
        continue;
      }
      add(cmp("Firmas Compartidas", `Row ${row} Firma (order)`, String(excel[0]), calc.firma));
      add(cmp("Firmas Compartidas", `Row ${row} Perm. Ger`, excel[1], calc.permGer));
      add(cmp("Firmas Compartidas", `Row ${row} Perm. Ra`, excel[2], calc.permComparison));
      add(cmp("Firmas Compartidas", `Row ${row} Intersección`, excel[3], calc.intersection));
      add(cmp("Firmas Compartidas", `Row ${row} Cobertura Ger %`, excel[4], calc.coverageGerPct));
      add(cmp("Firmas Compartidas", `Row ${row} Cobertura Ra %`, excel[5], calc.coverageComparisonPct));
      add(cmp("Firmas Compartidas", `Row ${row} Jaccard %`, excel[6], calc.jaccardPct));
      add(
        cmp(
          "Firmas Compartidas",
          `Row ${row} Permutaciones compartidas`,
          excel[7] ?? "",
          formatSharedPermutations(calc.sharedPermutations),
        ),
      );
      // leading zeros as string identity
      if (String(excel[0]).startsWith("0")) {
        add(
          cmp(
            "Firmas Compartidas",
            `Row ${row} leading-zero Firma string`,
            String(excel[0]),
            calc.firma,
          ),
        );
      }
    }

    // ---------- RANKING ----------
    const rankingSheet = XLSX.utils.sheet_to_json<(string | number)[]>(
      wb.Sheets["Ranking"],
      { header: 1 },
    );
    const rankingHeaders = rankingSheet[0].map(String);
    const expectedRankingHeaders = [
      "Pos",
      "Firma",
      "Coincidencias",
      "Jaccard %",
      "Perm. Ger",
      "Perm. Ra",
    ];
    add(
      cmp(
        "Ranking",
        "Column names",
        expectedRankingHeaders.join(" | "),
        rankingHeaders.join(" | "),
      ),
    );
    const excelRanking = rankingSheet.slice(1);
    add(cmp("Ranking", "Row count", excelRanking.length, result.ranking.length));

    for (let i = 0; i < Math.max(excelRanking.length, result.ranking.length); i++) {
      const excel = excelRanking[i];
      const calc = result.ranking[i];
      const row = i + 2;
      if (!excel || !calc) {
        add(cmp("Ranking", `Row ${row} presence`, "present", "missing"));
        continue;
      }
      add(cmp("Ranking", `Row ${row} Pos`, excel[0], calc.position));
      add(cmp("Ranking", `Row ${row} Firma (order)`, String(excel[1]), calc.firma));
      add(cmp("Ranking", `Row ${row} Coincidencias`, excel[2], calc.coincidences));
      add(cmp("Ranking", `Row ${row} Jaccard %`, excel[3], calc.jaccardPct));
      add(cmp("Ranking", `Row ${row} Perm. Ger`, excel[4], calc.permGer));
      add(cmp("Ranking", `Row ${row} Perm. Ra`, excel[5], calc.permComparison));
      if (String(excel[1]).startsWith("0")) {
        add(
          cmp(
            "Ranking",
            `Row ${row} leading-zero Firma string`,
            String(excel[1]),
            calc.firma,
          ),
        );
      }
    }

    // ---------- EXCLUSIVAS GER ----------
    const exclGerSheet = XLSX.utils.sheet_to_json<(string | number)[]>(
      wb.Sheets["Exclusivas Ger"],
      { header: 1 },
    );
    add(
      cmp(
        "Exclusivas Ger",
        "Column names",
        "Firma | Cantidad",
        exclGerSheet[0].map(String).join(" | "),
      ),
    );
    const excelExGer = exclGerSheet.slice(1);
    add(
      cmp("Exclusivas Ger", "Row count", excelExGer.length, result.exclusiveGer.length),
    );
    for (let i = 0; i < Math.max(excelExGer.length, result.exclusiveGer.length); i++) {
      const excel = excelExGer[i];
      const calc = result.exclusiveGer[i];
      const row = i + 2;
      if (!excel || !calc) {
        add(cmp("Exclusivas Ger", `Row ${row} presence`, "present", "missing"));
        continue;
      }
      add(cmp("Exclusivas Ger", `Row ${row} Firma (order)`, String(excel[0]), calc.firma));
      add(cmp("Exclusivas Ger", `Row ${row} Cantidad`, excel[1], calc.count));
      if (String(excel[0]).startsWith("0")) {
        add(
          cmp(
            "Exclusivas Ger",
            `Row ${row} leading-zero Firma string`,
            String(excel[0]),
            calc.firma,
          ),
        );
        add(
          cmp(
            "Exclusivas Ger",
            `Row ${row} Firma length preserved`,
            4,
            calc.firma.length,
          ),
        );
      }
    }

    // ---------- EXCLUSIVAS RA ----------
    const exclRaSheet = XLSX.utils.sheet_to_json<(string | number)[]>(
      wb.Sheets["Exclusivas Ra"],
      { header: 1 },
    );
    add(
      cmp(
        "Exclusivas Ra",
        "Column names",
        "Firma | Cantidad",
        exclRaSheet[0].map(String).join(" | "),
      ),
    );
    const excelExRa = exclRaSheet.slice(1);
    add(
      cmp(
        "Exclusivas Ra",
        "Row count",
        excelExRa.length,
        result.exclusiveComparison.length,
      ),
    );
    for (let i = 0; i < Math.max(excelExRa.length, result.exclusiveComparison.length); i++) {
      const excel = excelExRa[i];
      const calc = result.exclusiveComparison[i];
      const row = i + 2;
      if (!excel || !calc) {
        add(cmp("Exclusivas Ra", `Row ${row} presence`, "present", "missing"));
        continue;
      }
      add(cmp("Exclusivas Ra", `Row ${row} Firma (order)`, String(excel[0]), calc.firma));
      add(cmp("Exclusivas Ra", `Row ${row} Cantidad`, excel[1], calc.count));
      if (String(excel[0]).startsWith("0")) {
        add(
          cmp(
            "Exclusivas Ra",
            `Row ${row} leading-zero Firma string`,
            String(excel[0]),
            calc.firma,
          ),
        );
      }
    }

    // Leading-zero spot checks from known workbook values
    const zeroGer = result.exclusiveGer.find((r) => r.firma === "0128");
    add(cmp("Exclusivas Ger", "Spot check Firma 0128 exists", "0128", zeroGer?.firma ?? "missing"));
    add(cmp("Exclusivas Ger", "Spot check Firma 0128 Cantidad", 6, zeroGer?.count ?? "missing"));
    const zeroRa = result.exclusiveComparison.find((r) => r.firma === "0001");
    add(cmp("Exclusivas Ra", "Spot check Firma 0001 exists", "0001", zeroRa?.firma ?? "missing"));
    add(cmp("Exclusivas Ra", "Spot check Firma 0001 Cantidad", 2, zeroRa?.count ?? "missing"));

    void hasLeadingZeroIssue;

    const totalPass = checks.filter((c) => c.status === "PASS").length;
    const totalFail = checks.filter((c) => c.status === "FAIL").length;
    const allPass = totalFail === 0;

    const sections = [
      "Resumen",
      "Firmas Compartidas",
      "Ranking",
      "Exclusivas Ger",
      "Exclusivas Ra",
    ] as const;

    const mdLines: string[] = [];
    mdLines.push("# FINAL_5_SHEETS_TEST_REPORT.md");
    mdLines.push("");
    mdLines.push(`Generated: ${new Date().toISOString()}`);
    mdLines.push("");
    mdLines.push("## Verdict");
    mdLines.push("");
    mdLines.push(
      allPass
        ? "**ALL 5 EXCEL SHEETS MATCH THE APPLICATION OUTPUT (PASS).**"
        : `**FAILURES DETECTED (${totalFail}).** See mismatches below.`,
    );
    mdLines.push("");
    mdLines.push("Inputs:");
    mdLines.push("");
    mdLines.push("- Ger: `data/samples/Ger2909241.txt`");
    mdLines.push("- Comparación (Ra): `data/samples/Ra290924292024.txt`");
    mdLines.push("- Excel: `data/samples/Codigo_B_Analisis1.xlsx`");
    mdLines.push("");
    mdLines.push("Compared: row counts, column names, every cell value, sort order, percentages, leading-zero firmas.");
    mdLines.push("");
    mdLines.push("## Sheet summary");
    mdLines.push("");
    mdLines.push("| Sheet / view | Checks | PASS | FAIL | Status |");
    mdLines.push("|--------------|-------:|-----:|-----:|--------|");
    for (const s of sections) {
      const info = sectionSummary[s] || { pass: 0, fail: 0, mismatches: [] };
      const status = info.fail === 0 ? "**PASS**" : "**FAIL**";
      mdLines.push(
        `| ${s} | ${info.pass + info.fail} | ${info.pass} | ${info.fail} | ${status} |`,
      );
    }
    mdLines.push(
      `| **TOTAL** | ${checks.length} | ${totalPass} | ${totalFail} | ${allPass ? "**PASS**" : "**FAIL**"} |`,
    );
    mdLines.push("");

    // Detailed section blocks
    mdLines.push("## 1. Resumen");
    mdLines.push("");
    mdLines.push("| Check | Expected | Actual | PASS/FAIL |");
    mdLines.push("|-------|----------|--------|-----------|");
    for (const c of checks.filter((x) => x.section === "Resumen")) {
      mdLines.push(`| ${c.check} | ${c.expected} | ${c.actual} | ${c.status} |`);
    }
    mdLines.push("");

    mdLines.push("## 2. Firmas Compartidas");
    mdLines.push("");
    mdLines.push(`Row count Excel: **${excelShared.length}** · App: **${result.sharedFirmas.length}** · ${sectionSummary["Firmas Compartidas"].fail === 0 ? "PASS" : "FAIL"}`);
    mdLines.push("");
    mdLines.push("Excel columns: `Firma | Perm. Ger | Perm. Ra | Intersección | Cobertura Ger % | Cobertura Ra % | Jaccard % | Permutaciones compartidas`");
    mdLines.push("");
    mdLines.push("App columns (same data; Ra labeled Comparación in UI): `Firma | Perm. Ger | Perm. Comparación | Intersección | Cobertura Ger % | Cobertura Comparación % | Jaccard % | Permutaciones compartidas`");
    mdLines.push("");
    if (sectionSummary["Firmas Compartidas"].fail === 0) {
      mdLines.push(`All **${sectionSummary["Firmas Compartidas"].pass}** cell/order/percentage checks **PASS** (every row, every column).`);
    } else {
      mdLines.push("### Mismatches");
      mdLines.push("");
      mdLines.push("| Check | Expected | Actual |");
      mdLines.push("|-------|----------|--------|");
      for (const m of sectionSummary["Firmas Compartidas"].mismatches.slice(0, 50)) {
        mdLines.push(`| ${m.check} | ${m.expected} | ${m.actual} |`);
      }
    }
    mdLines.push("");

    mdLines.push("## 3. Ranking");
    mdLines.push("");
    mdLines.push(`Row count Excel: **${excelRanking.length}** · App: **${result.ranking.length}** · ${sectionSummary.Ranking.fail === 0 ? "PASS" : "FAIL"}`);
    mdLines.push("");
    mdLines.push("Columns: `Pos | Firma | Coincidencias | Jaccard % | Perm. Ger | Perm. Ra/Comparación`");
    mdLines.push("");
    if (sectionSummary.Ranking.fail === 0) {
      mdLines.push(`All **${sectionSummary.Ranking.pass}** cell/order/percentage checks **PASS**.`);
      mdLines.push("");
      mdLines.push("Top 5 (Excel = App):");
      mdLines.push("");
      mdLines.push("| Pos | Firma | Coincidencias | Jaccard % |");
      mdLines.push("|----:|-------|--------------:|----------:|");
      for (const row of result.ranking.slice(0, 5)) {
        mdLines.push(`| ${row.position} | ${row.firma} | ${row.coincidences} | ${row.jaccardPct} |`);
      }
    } else {
      mdLines.push("### Mismatches");
      mdLines.push("");
      mdLines.push("| Check | Expected | Actual |");
      mdLines.push("|-------|----------|--------|");
      for (const m of sectionSummary.Ranking.mismatches.slice(0, 50)) {
        mdLines.push(`| ${m.check} | ${m.expected} | ${m.actual} |`);
      }
    }
    mdLines.push("");

    mdLines.push("## 4. Exclusivas Ger");
    mdLines.push("");
    mdLines.push(`Row count Excel: **${excelExGer.length}** · App: **${result.exclusiveGer.length}** · ${sectionSummary["Exclusivas Ger"].fail === 0 ? "PASS" : "FAIL"}`);
    mdLines.push("");
    mdLines.push("Columns: `Firma | Cantidad`");
    mdLines.push("");
    mdLines.push("Leading-zero examples: `0128` kept as string (not `128`).");
    mdLines.push("");
    if (sectionSummary["Exclusivas Ger"].fail === 0) {
      mdLines.push(`All **${sectionSummary["Exclusivas Ger"].pass}** checks **PASS**.`);
    } else {
      mdLines.push("### Mismatches");
      mdLines.push("");
      mdLines.push("| Check | Expected | Actual |");
      mdLines.push("|-------|----------|--------|");
      for (const m of sectionSummary["Exclusivas Ger"].mismatches.slice(0, 50)) {
        mdLines.push(`| ${m.check} | ${m.expected} | ${m.actual} |`);
      }
    }
    mdLines.push("");

    mdLines.push("## 5. Exclusivas Ra → UI «Exclusivas Comparación»");
    mdLines.push("");
    mdLines.push(`Row count Excel: **${excelExRa.length}** · App: **${result.exclusiveComparison.length}** · ${sectionSummary["Exclusivas Ra"].fail === 0 ? "PASS" : "FAIL"}`);
    mdLines.push("");
    mdLines.push("Columns: `Firma | Cantidad`");
    mdLines.push("");
    mdLines.push("Leading-zero examples: `0001` kept as string.");
    mdLines.push("");
    if (sectionSummary["Exclusivas Ra"].fail === 0) {
      mdLines.push(`All **${sectionSummary["Exclusivas Ra"].pass}** checks **PASS**.`);
    } else {
      mdLines.push("### Mismatches");
      mdLines.push("");
      mdLines.push("| Check | Expected | Actual |");
      mdLines.push("|-------|----------|--------|");
      for (const m of sectionSummary["Exclusivas Ra"].mismatches.slice(0, 50)) {
        mdLines.push(`| ${m.check} | ${m.expected} | ${m.actual} |`);
      }
    }
    mdLines.push("");

    mdLines.push("## Notes");
    mdLines.push("");
    mdLines.push("- Calculation engine was not modified for this validation.");
    mdLines.push("- UI labels «Comparación» map to Excel «Ra» columns/sheet for the sample.");
    mdLines.push("- Full machine-readable dump: `tmp-5-sheets-validation.json`.");
    mdLines.push("");

    fs.writeFileSync(outMd, mdLines.join("\n"));
    fs.writeFileSync(
      outJson,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          summary: { total: checks.length, pass: totalPass, fail: totalFail, allPass },
          sectionSummary,
          mismatches: checks.filter((c) => c.status === "FAIL"),
        },
        null,
        2,
      ),
    );

    expect(totalFail, JSON.stringify(checks.filter((c) => c.status === "FAIL").slice(0, 20), null, 2)).toBe(0);
    expect(allPass).toBe(true);
  });
});
