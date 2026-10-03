/** A 4-digit numeric code as it appears in the source text. */
export type Permutation = string;

/** Canonical digit multiset: digits sorted ascending, e.g. "8791" → "1789". */
export type Firma = string;

export interface ParseIssue {
  lineNumber: number;
  raw: string;
  reason: string;
}

export interface ParsedDataset {
  /** All valid codes in file order (may include duplicates). */
  records: Permutation[];
  /** Unique codes. */
  unique: Permutation[];
  totalLines: number;
  blankLines: number;
  issues: ParseIssue[];
}

export interface FirmaGroup {
  firma: Firma;
  permutations: Permutation[];
}

export interface SharedFirmaStats {
  firma: Firma;
  permGer: number;
  permComparison: number;
  intersection: number;
  coverageGerPct: number;
  coverageComparisonPct: number;
  jaccardPct: number;
  sharedPermutations: Permutation[];
}

export interface ExclusiveFirmaStats {
  firma: Firma;
  count: number;
}

export interface RankingEntry {
  position: number;
  firma: Firma;
  coincidences: number;
  jaccardPct: number;
  permGer: number;
  permComparison: number;
}

export interface SummaryMetrics {
  uniquePermutationsGer: number;
  uniquePermutationsComparison: number;
  firmasGer: number;
  firmasComparison: number;
  sharedFirmas: number;
  exclusiveFirmasGer: number;
  exclusiveFirmasComparison: number;
  exactSharedPermutations: number;
}

export interface AnalysisResult {
  summary: SummaryMetrics;
  sharedFirmas: SharedFirmaStats[];
  ranking: RankingEntry[];
  exclusiveGer: ExclusiveFirmaStats[];
  exclusiveComparison: ExclusiveFirmaStats[];
  gerRecordCount: number;
  comparisonRecordCount: number;
  gerUniqueCount: number;
  comparisonUniqueCount: number;
}
