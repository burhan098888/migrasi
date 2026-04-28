import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { format, addDays, subDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

function formatNum(value: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Math.abs(value));
}

export default function AdProfitReportPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateStr = format(currentDate, "yyyy-MM-dd");

  const report = useQuery(api.adProfit.getDailyReport, { date: dateStr });

  // Period summary: 26th of previous month to 25th of current month
  const now = currentDate;
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const day = now.getDate();

  let periodStart: string;
  let periodEnd: string;
  let periodLabel: string;

  if (day >= 26) {
    // Period is 26th of current month to 25th of next month
    const startMonth = currentMonth;
    const endMonth = currentMonth + 1;
    const endYear = endMonth > 11 ? currentYear + 1 : currentYear;
    const endMonthAdjusted = endMonth > 11 ? 0 : endMonth;
    periodStart = `${currentYear}-${String(startMonth + 1).padStart(2, "0")}-26`;
    periodEnd = `${endYear}-${String(endMonthAdjusted + 1).padStart(2, "0")}-25`;
    const startLabel = format(new Date(currentYear, startMonth, 26), "d MMMM", { locale: localeId });
    const endLabel = format(new Date(endYear, endMonthAdjusted, 25), "d MMMM", { locale: localeId });
    periodLabel = `${startLabel} - ${endLabel}`;
  } else {
    // Period is 26th of previous month to 25th of current month
    const prevMonth = currentMonth - 1;
    const prevYear = prevMonth < 0 ? currentYear - 1 : currentYear;
    const prevMonthAdjusted = prevMonth < 0 ? 11 : prevMonth;
    periodStart = `${prevYear}-${String(prevMonthAdjusted + 1).padStart(2, "0")}-26`;
    periodEnd = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-25`;
    const startLabel = format(new Date(prevYear, prevMonthAdjusted, 26), "d MMMM", { locale: localeId });
    const endLabel = format(new Date(currentYear, currentMonth, 25), "d MMMM", { locale: localeId });
    periodLabel = `${startLabel} - ${endLabel}`;
  }

  const periodSummary = useQuery(api.adProfit.getPeriodSummary, {
    startDate: periodStart,
    endDate: periodEnd,
  });

  if (report === undefined) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const dateFormatted = format(currentDate, "EEEE, d MMMM yyyy", { locale: localeId });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/ad-profit")} className="cursor-pointer hover:opacity-70">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Laporan Profit</h1>
      </div>

      {/* Date picker */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => setCurrentDate(subDays(currentDate, 1))}
          className="p-2 rounded-lg bg-muted cursor-pointer hover:bg-muted/80"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold">{dateFormatted}</p>
        </div>
        <button
          onClick={() => setCurrentDate(addDays(currentDate, 1))}
          className="p-2 rounded-lg bg-muted cursor-pointer hover:bg-muted/80"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Campaign results - like the WhatsApp screenshot */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-6">
        <p className="text-sm font-bold italic">
          Laporan Profit Keseluruhan {dateFormatted}
        </p>

        {report.campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada data untuk tanggal ini</p>
        ) : (
          report.campaigns.map((c) => (
            <div key={c.campaignId} className="space-y-1">
              <p className="text-sm font-bold flex items-center gap-2">
                <span className="text-red-500">📍</span> {c.campaignName}
              </p>
              <p className="text-sm">Leads : {c.leads}</p>
              <p className="text-sm">Biaya + PPN: Rp {formatNum(c.biayaPpn)}</p>
              <p className="text-sm">Donasi : {formatNum(c.donation)}</p>
              <p className="text-sm">
                Profit/selisih : <span className={`font-bold ${c.profit >= 0 ? "" : "text-red-600"}`}>
                  {c.profit < 0 ? "-" : ""}
                  {formatNum(c.profit)}
                </span>
              </p>
            </div>
          ))
        )}

        {/* Daily total */}
        <div className="border-t border-border pt-4">
          <p className="text-sm font-bold flex items-center gap-2">
            <span>📌</span> Total Profit Hari Ini:
          </p>
          <p className={`text-lg font-bold mt-1 ${report.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
            {report.totalProfit < 0 ? "-" : ""}Rp {formatNum(report.totalProfit)}
          </p>
        </div>

        {/* Period max */}
        <div className="border-t border-border pt-4">
          <p className="text-sm font-bold flex items-center gap-2">
            <span>📌</span> MAKSIMAL | {periodLabel}
          </p>
          {periodSummary !== undefined ? (
            <p className={`text-lg font-bold mt-1 ${periodSummary.total >= 0 ? "text-green-600" : "text-red-600"}`}>
              {periodSummary.total < 0 ? "-" : ""}Rp {formatNum(periodSummary.total)}
            </p>
          ) : (
            <Skeleton className="h-6 w-32 mt-1" />
          )}
        </div>
      </div>
    </div>
  );
}
