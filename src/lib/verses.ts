/**
 * Format a number as Quran verse count.
 * Positive = reward (tabungan akhirat), Negative = punishment.
 *
 * @example formatVerses(5)   → "5 ayat"
 * @example formatVerses(-3)  → "-3 ayat"
 * @example formatVerses(0)   → "0 ayat"
 */
export function formatVerses(count: number): string {
  return `${count} ayat`;
}
