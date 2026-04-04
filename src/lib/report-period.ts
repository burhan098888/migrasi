/**
 * Custom monthly report cycle utilities.
 *
 * Period: 25th of previous month → 24th of current month
 * Example: "April 2026" period = 25 Mar 2026 00:00 UTC → 24 Apr 2026 23:59:59 UTC
 */

export type ReportPeriod = {
  /** Label like "April 2026" */
  label: string;
  /** Short label like "Apr 2026" */
  shortLabel: string;
  /** ISO string for the start of the period (25th prev month, 00:00:00 UTC) */
  startDate: string;
  /** ISO string for the end of the period (24th this month, 23:59:59 UTC) */
  endDate: string;
  /** The month number (1-12) this period is labelled after */
  month: number;
  /** The year this period is labelled after */
  year: number;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Get the report period for a given month and year.
 * The period labelled "April 2026" runs from 25 Mar 2026 to 24 Apr 2026.
 */
export function getReportPeriod(month: number, year: number): ReportPeriod {
  // Start: 25th of previous month
  let startMonth = month - 1;
  let startYear = year;
  if (startMonth < 1) {
    startMonth = 12;
    startYear = year - 1;
  }

  const startDate = new Date(Date.UTC(startYear, startMonth - 1, 25, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month - 1, 24, 23, 59, 59, 999));

  return {
    label: `${MONTH_NAMES[month - 1]} ${year}`,
    shortLabel: `${MONTH_SHORT[month - 1]} ${year}`,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    month,
    year,
  };
}

/**
 * Get the current report period based on today's date.
 * If today is before the 25th, we're in the current month's period.
 * If today is on or after the 25th, we're in next month's period.
 */
export function getCurrentReportPeriod(): ReportPeriod {
  const now = new Date();
  let month = now.getMonth() + 1; // 1-based
  let year = now.getFullYear();

  if (now.getDate() >= 25) {
    // We're in the next month's period
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return getReportPeriod(month, year);
}

/**
 * Navigate to the previous period.
 */
export function getPreviousPeriod(period: ReportPeriod): ReportPeriod {
  let prevMonth = period.month - 1;
  let prevYear = period.year;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }
  return getReportPeriod(prevMonth, prevYear);
}

/**
 * Navigate to the next period.
 */
export function getNextPeriod(period: ReportPeriod): ReportPeriod {
  let nextMonth = period.month + 1;
  let nextYear = period.year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  return getReportPeriod(nextMonth, nextYear);
}

/**
 * Generate a list of available report periods (past 12 months + current).
 */
export function getAvailablePeriods(count: number = 13): ReportPeriod[] {
  const current = getCurrentReportPeriod();
  const periods: ReportPeriod[] = [current];

  let p = current;
  for (let i = 1; i < count; i++) {
    p = getPreviousPeriod(p);
    periods.push(p);
  }

  return periods;
}

/**
 * Format date range for display: "25 Mar – 24 Apr 2026"
 */
export function formatPeriodRange(period: ReportPeriod): string {
  const start = new Date(period.startDate);
  const end = new Date(period.endDate);

  const startDay = start.getUTCDate();
  const startMonthName = MONTH_SHORT[start.getUTCMonth()];
  const endDay = end.getUTCDate();
  const endMonthName = MONTH_SHORT[end.getUTCMonth()];
  const endYear = end.getUTCFullYear();

  // If same year for start and end
  if (start.getUTCFullYear() === endYear) {
    return `${startDay} ${startMonthName} – ${endDay} ${endMonthName} ${endYear}`;
  }

  return `${startDay} ${startMonthName} ${start.getUTCFullYear()} – ${endDay} ${endMonthName} ${endYear}`;
}
