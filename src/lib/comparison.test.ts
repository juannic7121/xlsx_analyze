import { describe, expect, it } from "vitest";
import { groupByFirma } from "@/lib/normalization";
import {
  calculateStatistics,
  compareDatasets,
  formatSharedPermutations,
} from "@/lib/comparison";
import { analyzeDatasets } from "@/lib/statistics";
import { percentage, round2 } from "@/lib/math";

describe("math", () => {
  it("rounds percentages like Excel", () => {
    expect(percentage(22, 24)).toBe(91.67);
    expect(percentage(20, 24)).toBe(83.33);
    expect(percentage(18, 22)).toBe(81.82);
    expect(percentage(18, 20)).toBe(90);
    expect(percentage(16, 24)).toBe(66.67);
    expect(percentage(24, 24)).toBe(100);
    expect(percentage(0, 2)).toBe(0);
    expect(round2(66.666)).toBe(66.67);
  });
});

describe("groupByFirma", () => {
  it("groups permutations by sorted digits", () => {
    const groups = groupByFirma(["1235", "5321", "8791", "1987"]);
    expect(groups.get("1235")?.size).toBe(2);
    expect(groups.get("1789")?.size).toBe(2);
  });
});

describe("compareDatasets", () => {
  it("computes shared and exclusive firmas on a tiny fixture", () => {
    const ger = ["1235", "5321", "8791", "1112"];
    const ra = ["1235", "2153", "0001"];
    const result = compareDatasets(ger, ra);

    expect(result.summary.uniquePermutationsGer).toBe(4);
    expect(result.summary.uniquePermutationsComparison).toBe(3);
    expect(result.summary.exactSharedPermutations).toBe(1);
    expect(result.summary.sharedFirmas).toBe(1);
    expect(result.summary.exclusiveFirmasGer).toBe(2);
    expect(result.summary.exclusiveFirmasComparison).toBe(1);

    const shared = result.sharedFirmas[0];
    expect(shared.firma).toBe("1235");
    expect(shared.permGer).toBe(2);
    expect(shared.permComparison).toBe(2);
    expect(shared.intersection).toBe(1);
    expect(shared.coverageGerPct).toBe(50);
    expect(shared.coverageComparisonPct).toBe(50);
    expect(shared.jaccardPct).toBe(33.33);
    expect(formatSharedPermutations(shared.sharedPermutations)).toBe("1235");

    expect(result.ranking[0].position).toBe(1);
    expect(result.exclusiveGer.map((e) => e.firma).sort()).toEqual([
      "1112",
      "1789",
    ]);
    expect(result.exclusiveComparison[0].firma).toBe("0001");
  });

  it("includes shared firmas with zero exact intersection", () => {
    const ger = ["0012", "0021"];
    const ra = ["0102", "0201"];
    const result = calculateStatistics(ger, ra);
    expect(result.summary.sharedFirmas).toBe(1);
    expect(result.sharedFirmas[0].intersection).toBe(0);
    expect(result.sharedFirmas[0].jaccardPct).toBe(0);
    expect(result.summary.exactSharedPermutations).toBe(0);
  });

  it("deduplicates before grouping", () => {
    const ger = ["1235", "1235", "5321"];
    const ra = ["1235"];
    const result = compareDatasets([...new Set(ger)], [...new Set(ra)]);
    expect(result.sharedFirmas[0].permGer).toBe(2);
  });
});

describe("analyzeDatasets", () => {
  it("requires both datasets", () => {
    const out = analyzeDatasets({ gerText: "", comparisonText: "1235" });
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.error).toContain("Debe ingresar");
    }
  });

  it("rejects invalid rows", () => {
    const out = analyzeDatasets({
      gerText: "1235\nABCD",
      comparisonText: "1235",
    });
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.error).toMatch(/inválidos/i);
    }
  });

  it("succeeds on valid input", () => {
    const out = analyzeDatasets({
      gerText: "1235\n5321",
      comparisonText: "1235",
    });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.result.summary.exactSharedPermutations).toBe(1);
    }
  });
});
