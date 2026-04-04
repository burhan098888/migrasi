/**
 * Format a number as Indonesian Rupiah (Rp).
 * Uses dot as thousands separator per Indonesian convention.
 *
 * Examples:
 *   formatRupiah(1500000)    → "Rp 1.500.000"
 *   formatRupiah(250000)     → "Rp 250.000"
 *   formatRupiah(0)          → "Rp 0"
 */
export function formatRupiah(value: number): string {
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(value);
  return `Rp ${formatted}`;
}

/**
 * Compact Rupiah for KPI cards and chart axes.
 *
 * Examples:
 *   formatRupiahCompact(1_500_000_000)  → "Rp 1,5M"
 *   formatRupiahCompact(250_000_000)    → "Rp 250Jt"
 *   formatRupiahCompact(1_500_000)      → "Rp 1,5Jt"
 *   formatRupiahCompact(500_000)        → "Rp 500Rb"
 *   formatRupiahCompact(50_000)         → "Rp 50.000"
 */
export function formatRupiahCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })}M`;
  }
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })}Jt`;
  }
  if (value >= 100_000) {
    return `Rp ${(value / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 0 })}Rb`;
  }
  return formatRupiah(value);
}
