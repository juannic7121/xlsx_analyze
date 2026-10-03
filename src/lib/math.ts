/**
 * Round to 2 decimal places (Excel-compatible half-up via Math.round).
 */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function percentage(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return round2((numerator / denominator) * 100);
}
