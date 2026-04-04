import { Button } from "@/components/ui/button.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { ChevronLeft, ChevronRight, CalendarRange } from "lucide-react";
import {
  type ReportPeriod,
  getCurrentReportPeriod,
  getPreviousPeriod,
  getNextPeriod,
  getAvailablePeriods,
  formatPeriodRange,
} from "@/lib/report-period.ts";

type PeriodSelectorProps = {
  /** Current mode: "all" for all-time, "period" for monthly cycle */
  mode: "all" | "period";
  /** Currently selected period (only used when mode is "period") */
  period: ReportPeriod;
  onModeChange: (mode: "all" | "period") => void;
  onPeriodChange: (period: ReportPeriod) => void;
};

export default function PeriodSelector({
  mode,
  period,
  onModeChange,
  onPeriodChange,
}: PeriodSelectorProps) {
  const availablePeriods = getAvailablePeriods(13);
  const currentPeriod = getCurrentReportPeriod();

  // Check if we can go forward (don't go beyond current period)
  const isAtCurrentPeriod =
    period.month === currentPeriod.month && period.year === currentPeriod.year;

  const handlePrev = () => {
    onPeriodChange(getPreviousPeriod(period));
  };

  const handleNext = () => {
    if (!isAtCurrentPeriod) {
      onPeriodChange(getNextPeriod(period));
    }
  };

  const handlePeriodSelect = (value: string) => {
    const found = availablePeriods.find(
      (p) => `${p.month}-${p.year}` === value,
    );
    if (found) {
      onPeriodChange(found);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Mode toggle */}
      <div className="flex items-center bg-muted rounded-lg p-0.5">
        <button
          onClick={() => onModeChange("all")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === "all"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All Time
        </button>
        <button
          onClick={() => onModeChange("period")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
            mode === "period"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarRange className="w-3.5 h-3.5" />
          Monthly Cycle
        </button>
      </div>

      {/* Period navigation — only shown in period mode */}
      {mode === "period" && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            className="h-8 w-8 p-0"
            title="Previous period"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Select
            value={`${period.month}-${period.year}`}
            onValueChange={handlePeriodSelect}
          >
            <SelectTrigger className="w-44 h-8 text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availablePeriods.map((p) => (
                <SelectItem
                  key={`${p.month}-${p.year}`}
                  value={`${p.month}-${p.year}`}
                >
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={isAtCurrentPeriod}
            className="h-8 w-8 p-0"
            title="Next period"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Date range label */}
          <span className="text-xs text-muted-foreground hidden md:inline-flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
            <CalendarRange className="w-3 h-3" />
            {formatPeriodRange(period)}
          </span>
        </div>
      )}
    </div>
  );
}
