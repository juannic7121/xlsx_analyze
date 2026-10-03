import type { AnalysisResult, ParsedDataset } from "@/types/analysis";
import { parseDataset } from "@/lib/parser";
import { calculateStatistics } from "@/lib/comparison";

export interface AnalyzeInput {
  gerText: string;
  comparisonText: string;
}

export interface AnalyzeSuccess {
  ok: true;
  ger: ParsedDataset;
  comparison: ParsedDataset;
  result: AnalysisResult;
}

export interface AnalyzeFailure {
  ok: false;
  error: string;
  ger?: ParsedDataset;
  comparison?: ParsedDataset;
}

export type AnalyzeOutput = AnalyzeSuccess | AnalyzeFailure;

/**
 * End-to-end analysis: parse both texts and compute statistics.
 * Pure function — safe to call from UI or tests.
 */
export function analyzeDatasets(input: AnalyzeInput): AnalyzeOutput {
  const gerText = input.gerText?.trim() ? input.gerText : "";
  const comparisonText = input.comparisonText?.trim()
    ? input.comparisonText
    : "";

  if (!gerText.trim() || !comparisonText.trim()) {
    return {
      ok: false,
      error: "Debe ingresar los datos Ger y los datos a comparar.",
    };
  }

  const ger = parseDataset(gerText);
  const comparison = parseDataset(comparisonText);

  if (ger.records.length === 0 && comparison.records.length === 0) {
    return {
      ok: false,
      error: "No se encontraron datos válidos.",
      ger,
      comparison,
    };
  }

  if (ger.records.length === 0) {
    return {
      ok: false,
      error:
        ger.issues.length > 0
          ? "El formato del archivo Ger no coincide con el formato esperado."
          : "No se encontraron datos válidos en los datos Ger.",
      ger,
      comparison,
    };
  }

  if (comparison.records.length === 0) {
    return {
      ok: false,
      error:
        comparison.issues.length > 0
          ? "El formato del archivo a comparar no coincide con el formato esperado."
          : "No se encontraron datos válidos en los datos a comparar.",
      ger,
      comparison,
    };
  }

  if (ger.issues.length > 0 || comparison.issues.length > 0) {
    const samples = [...ger.issues, ...comparison.issues]
      .slice(0, 3)
      .map((issue) => `línea ${issue.lineNumber}: «${issue.raw}»`)
      .join("; ");
    const total = ger.issues.length + comparison.issues.length;
    return {
      ok: false,
      error: `Se encontraron registros inválidos (${total}). Cada línea debe contener exactamente 4 dígitos. Ejemplos: ${samples}`,
      ger,
      comparison,
    };
  }

  const result = calculateStatistics(ger.unique, comparison.unique);

  return {
    ok: true,
    ger,
    comparison,
    result,
  };
}
