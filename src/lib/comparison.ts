import type {
  AnalysisResult,
  ExclusiveFirmaStats,
  Firma,
  Permutation,
  RankingEntry,
  SharedFirmaStats,
  SummaryMetrics,
} from "@/types/analysis";
import { groupByFirma } from "@/lib/normalization";
import { percentage } from "@/lib/math";

function setIntersection<T>(a: Set<T>, b: Set<T>): T[] {
  const result: T[] = [];
  for (const item of a) {
    if (b.has(item)) result.push(item);
  }
  return result;
}

function compareShared(a: SharedFirmaStats, b: SharedFirmaStats): number {
  if (b.intersection !== a.intersection) return b.intersection - a.intersection;
  if (b.jaccardPct !== a.jaccardPct) return b.jaccardPct - a.jaccardPct;
  return a.firma.localeCompare(b.firma);
}

function buildSharedFirmaStats(
  firma: Firma,
  gerSet: Set<Permutation>,
  comparisonSet: Set<Permutation>,
): SharedFirmaStats {
  const shared = setIntersection(gerSet, comparisonSet).sort();
  const unionSize = new Set([...gerSet, ...comparisonSet]).size;

  return {
    firma,
    permGer: gerSet.size,
    permComparison: comparisonSet.size,
    intersection: shared.length,
    coverageGerPct: percentage(shared.length, gerSet.size),
    coverageComparisonPct: percentage(shared.length, comparisonSet.size),
    jaccardPct: percentage(shared.length, unionSize),
    sharedPermutations: shared,
  };
}

/**
 * Compare Ger (base) against a comparison dataset and produce Excel-equivalent statistics.
 */
export function compareDatasets(
  gerUnique: Permutation[],
  comparisonUnique: Permutation[],
): AnalysisResult {
  const gerSet = new Set(gerUnique);
  const comparisonSet = new Set(comparisonUnique);

  const gerFirmas = groupByFirma(gerUnique);
  const comparisonFirmas = groupByFirma(comparisonUnique);

  const sharedFirmaKeys = [...gerFirmas.keys()]
    .filter((f) => comparisonFirmas.has(f));

  const exclusiveGerKeys = [...gerFirmas.keys()]
    .filter((f) => !comparisonFirmas.has(f))
    .sort((a, b) => a.localeCompare(b));

  const exclusiveComparisonKeys = [...comparisonFirmas.keys()]
    .filter((f) => !gerFirmas.has(f))
    .sort((a, b) => a.localeCompare(b));

  const sharedFirmas: SharedFirmaStats[] = sharedFirmaKeys
    .map((firma) =>
      buildSharedFirmaStats(
        firma,
        gerFirmas.get(firma)!,
        comparisonFirmas.get(firma)!,
      ),
    )
    .sort(compareShared);

  const ranking: RankingEntry[] = sharedFirmas.map((row, index) => ({
    position: index + 1,
    firma: row.firma,
    coincidences: row.intersection,
    jaccardPct: row.jaccardPct,
    permGer: row.permGer,
    permComparison: row.permComparison,
  }));

  const exclusiveGer: ExclusiveFirmaStats[] = exclusiveGerKeys.map((firma) => ({
    firma,
    count: gerFirmas.get(firma)!.size,
  }));

  const exclusiveComparison: ExclusiveFirmaStats[] = exclusiveComparisonKeys.map(
    (firma) => ({
      firma,
      count: comparisonFirmas.get(firma)!.size,
    }),
  );

  let exactShared = 0;
  for (const code of gerSet) {
    if (comparisonSet.has(code)) exactShared += 1;
  }

  const summary: SummaryMetrics = {
    uniquePermutationsGer: gerSet.size,
    uniquePermutationsComparison: comparisonSet.size,
    firmasGer: gerFirmas.size,
    firmasComparison: comparisonFirmas.size,
    sharedFirmas: sharedFirmas.length,
    exclusiveFirmasGer: exclusiveGer.length,
    exclusiveFirmasComparison: exclusiveComparison.length,
    exactSharedPermutations: exactShared,
  };

  return {
    summary,
    sharedFirmas,
    ranking,
    exclusiveGer,
    exclusiveComparison,
    gerRecordCount: gerUnique.length,
    comparisonRecordCount: comparisonUnique.length,
    gerUniqueCount: gerSet.size,
    comparisonUniqueCount: comparisonSet.size,
  };
}

/**
 * Full analysis pipeline from unique permutation lists.
 */
export function calculateStatistics(
  gerUnique: Permutation[],
  comparisonUnique: Permutation[],
): AnalysisResult {
  return compareDatasets(gerUnique, comparisonUnique);
}

/**
 * Format shared permutations the same way as the Excel column.
 */
export function formatSharedPermutations(perms: Permutation[]): string {
  return perms.join(", ");
}
