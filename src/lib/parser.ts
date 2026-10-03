import type { Firma, ParseIssue, ParsedDataset, Permutation } from "@/types/analysis";

const CODE_PATTERN = /^\d{4}$/;

/**
 * Normalize raw text into lines: strip BOM, unify newlines, trim each line.
 */
export function normalizeText(raw: string): string[] {
  const withoutBom = raw.replace(/^\uFEFF/, "");
  return withoutBom.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

/**
 * Compute the firma (canonical sorted digits) for a 4-digit permutation.
 */
export function computeFirma(permutation: Permutation): Firma {
  return permutation.split("").sort().join("");
}

/**
 * Parse a TXT dataset of 4-digit codes (one per line).
 * Blank lines are skipped. Invalid rows are collected as issues.
 */
export function parseDataset(raw: string): ParsedDataset {
  const lines = normalizeText(raw);
  const records: Permutation[] = [];
  const issues: ParseIssue[] = [];
  let blankLines = 0;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      blankLines += 1;
      return;
    }

    if (!CODE_PATTERN.test(trimmed)) {
      issues.push({
        lineNumber: index + 1,
        raw: trimmed,
        reason: "Se esperaba un código de exactamente 4 dígitos.",
      });
      return;
    }

    records.push(trimmed);
  });

  const unique = [...new Set(records)];

  return {
    records,
    unique,
    totalLines: lines.length,
    blankLines,
    issues,
  };
}

export function isValidPermutation(value: string): boolean {
  return CODE_PATTERN.test(value.trim());
}
