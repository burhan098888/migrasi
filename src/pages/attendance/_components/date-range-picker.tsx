import { Button } from "@/components/ui/button.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  startOfWeek,
  endOfWeek,
  subWeeks,
} from "date-fns";

type DateRange = {
  startDate: string;
  endDate: string;
  label: string;
};

type DateRangePickerProps = {
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
};

function getThisMonthRange(): DateRange {
  const now = new Date();
  return {
    startDate: format(startOfMonth(now), "yyyy-MM-dd"),
    endDate: format(endOfMonth(now), "yyyy-MM-dd"),
    label: format(now, "MMMM yyyy"),
  };
}

function getLastMonthRange(): DateRange {
  const last = subMonths(new Date(), 1);
  return {
    startDate: format(startOfMonth(last), "yyyy-MM-dd"),
    endDate: format(endOfMonth(last), "yyyy-MM-dd"),
    label: format(last, "MMMM yyyy"),
  };
}

function getThisWeekRange(): DateRange {
  const now = new Date();
  return {
    startDate: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    endDate: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    label: "This Week",
  };
}

function getLastWeekRange(): DateRange {
  const lastWeek = subWeeks(new Date(), 1);
  return {
    startDate: format(
      startOfWeek(lastWeek, { weekStartsOn: 1 }),
      "yyyy-MM-dd",
    ),
    endDate: format(endOfWeek(lastWeek, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    label: "Last Week",
  };
}

export type { DateRange };

export default function DateRangePicker({
  range,
  onRangeChange,
}: DateRangePickerProps) {
  const handlePreset = (preset: string) => {
    switch (preset) {
      case "this-month":
        onRangeChange(getThisMonthRange());
        break;
      case "last-month":
        onRangeChange(getLastMonthRange());
        break;
      case "this-week":
        onRangeChange(getThisWeekRange());
        break;
      case "last-week":
        onRangeChange(getLastWeekRange());
        break;
    }
  };

  // Navigate month: shift the current start date forward/backward by 1 month
  const handlePrevMonth = () => {
    const prev = subMonths(new Date(range.startDate + "T00:00:00"), 1);
    onRangeChange({
      startDate: format(startOfMonth(prev), "yyyy-MM-dd"),
      endDate: format(endOfMonth(prev), "yyyy-MM-dd"),
      label: format(prev, "MMMM yyyy"),
    });
  };

  const handleNextMonth = () => {
    const next = addMonths(new Date(range.startDate + "T00:00:00"), 1);
    const end = endOfMonth(next);
    // Don't go beyond current date
    const today = new Date();
    if (next > today) return;
    onRangeChange({
      startDate: format(startOfMonth(next), "yyyy-MM-dd"),
      endDate: format(end > today ? today : end, "yyyy-MM-dd"),
      label: format(next, "MMMM yyyy"),
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-muted-foreground" />
        <Select onValueChange={handlePreset}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-week">This Week</SelectItem>
            <SelectItem value="last-week">Last Week</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium min-w-[140px] text-center">
          {range.label}
        </span>
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <span className="text-xs text-muted-foreground hidden md:inline">
        {format(new Date(range.startDate + "T00:00:00"), "d MMM")} —{" "}
        {format(new Date(range.endDate + "T00:00:00"), "d MMM yyyy")}
      </span>
    </div>
  );
}

export { getThisMonthRange };
