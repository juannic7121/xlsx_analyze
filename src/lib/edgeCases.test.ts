import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeDatasets } from "@/lib/statistics";
import { parseDataset } from "@/lib/parser";
import { calculateStatistics } from "@/lib/comparison";

const root = path.resolve(__dirname, "../..");
const gerPath = path.join(root, "data/samples/Ger2909241.txt");
const raPath = path.join(root, "data/samples/Ra290924292024.txt");

function loadSample(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

function pad4(n: number): string {
  return String(n).padStart(4, "0").slice(-4);
}

describe("input modes and edge cases", () => {
  it("treats file-loaded text and pasted text identically", () => {
    const gerFile = loadSample(gerPath);
    const raFile = loadSample(raPath);

    const fromFiles = analyzeDatasets({
      gerText: gerFile,
      comparisonText: raFile,
    });
    const fromPaste = analyzeDatasets({
      gerText: gerFile.replace(/\r\n/g, "\n"),
      comparisonText: raFile.replace(/\r\n/g, "\n"),
    });

    expect(fromFiles.ok).toBe(true);
    expect(fromPaste.ok).toBe(true);
    if (fromFiles.ok && fromPaste.ok) {
      expect(fromPaste.result.summary).toEqual(fromFiles.result.summary);
      expect(fromPaste.result.ranking).toEqual(fromFiles.result.ranking);
    }
  });

  it("rejects empty Ger input with Spanish message", () => {
    const out = analyzeDatasets({ gerText: "", comparisonText: "1235\n" });
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.error).toBe(
        "Debe ingresar los datos Ger y los datos a comparar.",
      );
    }
  });

  it("rejects empty comparison input with Spanish message", () => {
    const out = analyzeDatasets({ gerText: "1235\n", comparisonText: "   " });
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.error).toContain("Debe ingresar");
    }
  });

  it("ignores blank lines while counting valid records", () => {
    const parsed = parseDataset("1235\n\n\n5321\n\n");
    expect(parsed.records).toEqual(["1235", "5321"]);
    expect(parsed.blankLines).toBeGreaterThanOrEqual(3);
    expect(parsed.issues).toHaveLength(0);
  });

  it("handles duplicate records via unique permutations", () => {
    const out = analyzeDatasets({
      gerText: "1235\n1235\n1235\n5321\n",
      comparisonText: "1235\n1235\n",
    });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.ger.records).toHaveLength(4);
      expect(out.ger.unique).toHaveLength(2);
      expect(out.comparison.records).toHaveLength(2);
      expect(out.comparison.unique).toHaveLength(1);
      expect(out.result.summary.uniquePermutationsGer).toBe(2);
      expect(out.result.summary.exactSharedPermutations).toBe(1);
    }
  });

  it("rejects malformed rows with Spanish validation", () => {
    const out = analyzeDatasets({
      gerText: "1235\n12A4\n999\n",
      comparisonText: "1235\n",
    });
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.error).toMatch(/inválidos/i);
      expect(out.error).toMatch(/4 dígitos/);
      expect(out.ger?.issues.length).toBe(2);
    }
  });

  it("parses CRLF and LF the same way", () => {
    const crlf = parseDataset("1235\r\n5321\r\n8791\r\n");
    const lf = parseDataset("1235\n5321\n8791\n");
    expect(crlf.records).toEqual(lf.records);
    expect(crlf.unique).toEqual(lf.unique);
  });

  it("strips UTF-8 BOM", () => {
    const withBom = parseDataset("\uFEFF1235\n5321\n");
    expect(withBom.records).toEqual(["1235", "5321"]);
    expect(withBom.issues).toHaveLength(0);
  });

  it("trims leading and trailing whitespace", () => {
    const parsed = parseDataset("  1235  \n\t5321\t\n   8791\r\n");
    expect(parsed.records).toEqual(["1235", "5321", "8791"]);
  });

  it("processes ~8,000 records per dataset efficiently and deterministically", () => {
    const gerLines: string[] = [];
    const raLines: string[] = [];
    for (let i = 0; i < 8000; i++) {
      gerLines.push(pad4(i));
      raLines.push(pad4(i + 4000));
    }
    // Overlap block
    for (let i = 4000; i < 5000; i++) {
      gerLines.push(pad4(i));
    }

    const gerText = gerLines.join("\n");
    const raText = raLines.join("\n");

    const started = Date.now();
    const first = analyzeDatasets({ gerText, comparisonText: raText });
    const elapsed = Date.now() - started;
    const second = analyzeDatasets({ gerText, comparisonText: raText });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.ger.records.length).toBeGreaterThanOrEqual(8000);
      expect(first.comparison.records.length).toBe(8000);
      expect(first.result.summary).toEqual(second.result.summary);
      expect(first.result.ranking).toEqual(second.result.ranking);
      expect(elapsed).toBeLessThan(5000);
    }
  });

  it("supports repeated analyses in the same session without stale state", () => {
    const a = analyzeDatasets({
      gerText: "1235\n5321\n",
      comparisonText: "1235\n",
    });
    const b = analyzeDatasets({
      gerText: "0001\n0002\n",
      comparisonText: "0003\n",
    });
    const c = analyzeDatasets({
      gerText: "1235\n5321\n",
      comparisonText: "1235\n",
    });

    expect(a.ok && b.ok && c.ok).toBe(true);
    if (a.ok && b.ok && c.ok) {
      expect(a.result.summary.exactSharedPermutations).toBe(1);
      expect(b.result.summary.exactSharedPermutations).toBe(0);
      expect(c.result.summary).toEqual(a.result.summary);
      expect(b.result.summary).not.toEqual(a.result.summary);
    }
  });

  it("clearing datasets maps to empty re-analysis failure (new session)", () => {
    const first = analyzeDatasets({
      gerText: "1235\n",
      comparisonText: "1235\n",
    });
    expect(first.ok).toBe(true);

    const cleared = analyzeDatasets({ gerText: "", comparisonText: "" });
    expect(cleared.ok).toBe(false);
    if (!cleared.ok) {
      expect(cleared.error).toContain("Debe ingresar");
    }

    const restarted = analyzeDatasets({
      gerText: "8791\n1987\n",
      comparisonText: "0001\n",
    });
    expect(restarted.ok).toBe(true);
    if (first.ok && restarted.ok) {
      expect(restarted.result.summary).not.toEqual(first.result.summary);
      expect(restarted.result.summary.sharedFirmas).toBe(0);
    }
  });

  it("treats Ger-only blank content as missing Ger input", () => {
    const out = analyzeDatasets({
      gerText: "\n\n\n",
      comparisonText: "1235\n",
    });
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.error).toContain("Debe ingresar");
    }
  });
});

describe("sample file record counts", () => {
  it("matches known sample sizes", () => {
    const ger = parseDataset(loadSample(gerPath));
    const ra = parseDataset(loadSample(raPath));
    expect(ger.records.length).toBe(4016);
    expect(ger.unique.length).toBe(1820);
    expect(ra.records.length).toBe(3112);
    expect(ra.unique.length).toBe(1464);

    const stats = calculateStatistics(ger.unique, ra.unique);
    expect(stats.summary.exactSharedPermutations).toBe(382);
  });
});
