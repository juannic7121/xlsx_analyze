import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeDatasets } from "@/lib/statistics";

/**
 * Regression lock for the client-verified Excel summary totals.
 * These expectations exist ONLY in tests — never in production logic.
 */
const EXPECTED = {
  uniquePermutationsGer: 1820,
  uniquePermutationsComparison: 1464,
  firmasGer: 294,
  firmasComparison: 235,
  sharedFirmas: 126,
  exclusiveFirmasGer: 168,
  exclusiveFirmasComparison: 109,
  exactSharedPermutations: 382,
} as const;

const root = path.resolve(__dirname, "../../..");
const gerPath = path.join(root, "data/samples/Ger2909241.txt");
const comparisonPath = path.join(root, "data/samples/Ra290924292024.txt");

describe("reference sample summary regression", () => {
  it("produces the verified Excel summary totals", () => {
    const analysis = analyzeDatasets({
      gerText: fs.readFileSync(gerPath, "utf8"),
      comparisonText: fs.readFileSync(comparisonPath, "utf8"),
    });

    expect(analysis.ok).toBe(true);
    if (!analysis.ok) return;

    const { summary } = analysis.result;
    expect(summary.uniquePermutationsGer).toBe(EXPECTED.uniquePermutationsGer);
    expect(summary.uniquePermutationsComparison).toBe(
      EXPECTED.uniquePermutationsComparison,
    );
    expect(summary.firmasGer).toBe(EXPECTED.firmasGer);
    expect(summary.firmasComparison).toBe(EXPECTED.firmasComparison);
    expect(summary.sharedFirmas).toBe(EXPECTED.sharedFirmas);
    expect(summary.exclusiveFirmasGer).toBe(EXPECTED.exclusiveFirmasGer);
    expect(summary.exclusiveFirmasComparison).toBe(
      EXPECTED.exclusiveFirmasComparison,
    );
    expect(summary.exactSharedPermutations).toBe(
      EXPECTED.exactSharedPermutations,
    );
  });
});
