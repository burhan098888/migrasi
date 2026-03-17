import { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from "date-fns";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import { cn } from "@/lib/utils.ts";

type TaskWithMeta = Doc<"tasks"> & {
  assigneeName: string;
  projectName: string;
};

type CalendarGridProps = {
  currentMonth: Date;
  tasks: TaskWithMeta[];
  holidays: Doc<"holidays">[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarGrid({
  currentMonth,
  tasks,
  holidays,
  selectedDate,
  onSelectDate,
}: CalendarGridProps) {
  // Build map of date string -> tasks
  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskWithMeta[]>();
    for (const t of tasks) {
      // Use the date portion of the deadline (YYYY-MM-DD)
      const dateKey = t.deadline.slice(0, 10);
      const existing = map.get(dateKey) ?? [];
      existing.push(t);
      map.set(dateKey, existing);
    }
    return map;
  }, [tasks]);

  // Build map of date string -> holidays
  const holidaysByDate = useMemo(() => {
    const map = new Map<string, Doc<"holidays">[]>();
    for (const h of holidays) {
      const dateKey = h.date.slice(0, 10);
      const existing = map.get(dateKey) ?? [];
      existing.push(h);
      map.set(dateKey, existing);
    }
    return map;
  }, [holidays]);

  // Generate calendar days (6 weeks grid)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const start = startOfWeek(monthStart);
    const end = endOfWeek(monthEnd);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDate.get(dateKey) ?? [];
          const dayHolidays = holidaysByDate.get(dateKey) ?? [];
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const selected = selectedDate !== null && isSameDay(day, selectedDate);
          const hasItems = dayTasks.length > 0 || dayHolidays.length > 0;

          // Count tasks by status for dot indicators
          const overdueCount = dayTasks.filter((t) => t.status === "overdue").length;
          const completeCount = dayTasks.filter((t) => t.status === "complete").length;
          const activeCount = dayTasks.length - overdueCount - completeCount;

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(day)}
              className={cn(
                "relative min-h-[4.5rem] md:min-h-[5.5rem] border-b border-r border-border/50 px-1.5 py-1 text-left transition-colors",
                "hover:bg-muted/40",
                !inMonth && "opacity-35",
                selected && "bg-primary/8 ring-1 ring-inset ring-primary/25",
                today && !selected && "bg-accent/8",
              )}
            >
              {/* Day number */}
              <span
                className={cn(
                  "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                  today
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-foreground",
                )}
              >
                {format(day, "d")}
              </span>

              {/* Indicators */}
              {hasItems && (
                <div className="mt-0.5 space-y-0.5">
                  {/* Holiday indicator */}
                  {dayHolidays.length > 0 && (
                    <div className="flex items-center gap-1 px-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-[9px] text-amber-600 dark:text-amber-400 truncate hidden md:block">
                        {dayHolidays[0].eventName}
                      </span>
                    </div>
                  )}

                  {/* Task dots */}
                  <div className="flex items-center gap-0.5 px-0.5 flex-wrap">
                    {overdueCount > 0 && (
                      <div className="flex items-center gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-[9px] text-red-500 hidden md:block">{overdueCount}</span>
                      </div>
                    )}
                    {activeCount > 0 && (
                      <div className="flex items-center gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-[9px] text-blue-500 hidden md:block">{activeCount}</span>
                      </div>
                    )}
                    {completeCount > 0 && (
                      <div className="flex items-center gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[9px] text-emerald-500 hidden md:block">{completeCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
