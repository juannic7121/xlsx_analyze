import type { Firma, FirmaGroup, Permutation } from "@/types/analysis";
import { computeFirma } from "@/lib/parser";

/**
 * Group unique permutations by their firma.
 */
export function groupByFirma(uniquePermutations: Permutation[]): Map<Firma, Set<Permutation>> {
  const groups = new Map<Firma, Set<Permutation>>();

  for (const code of uniquePermutations) {
    const firma = computeFirma(code);
    let set = groups.get(firma);
    if (!set) {
      set = new Set();
      groups.set(firma, set);
    }
    set.add(code);
  }

  return groups;
}

export function firmaGroupsToArray(
  groups: Map<Firma, Set<Permutation>>,
): FirmaGroup[] {
  return [...groups.entries()]
    .map(([firma, set]) => ({
      firma,
      permutations: [...set].sort(),
    }))
    .sort((a, b) => a.firma.localeCompare(b.firma));
}
