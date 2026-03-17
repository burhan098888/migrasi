import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useUserRole } from "@/hooks/use-user-role.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import { format, addMonths, subMonths, isSameDay } from "date-fns";
import CalendarGrid from "./_components/calendar-grid.tsx";
import DayDetailPanel from "./_components/day-detail-panel.tsx";
import HolidayDialog from "./_components/holiday-dialog.tsx";

export default function CalendarPage() {
  const { isAdminOrManager } = useUserRole();
  const tasks = useQuery(api.tasks.list, {});
  const holidays = useQuery(api.holidays.list, {});

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);

  const goToPrev = () => setCurrentMonth((m) => subMonths(m, 1));
  const goToNext = () => setCurrentMonth((m) => addMonths(m, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Tasks and holidays for the selected day
  const selectedDayTasks = useMemo(() => {
    if (!selectedDate || !tasks) return [];
    return tasks.filter((t) => {
      const taskDate = t.deadline.slice(0, 10);
      const selDate = format(selectedDate, "yyyy-MM-dd");
      return taskDate === selDate;
    });
  }, [selectedDate, tasks]);

  const selectedDayHolidays = useMemo(() => {
    if (!selectedDate || !holidays) return [];
    return holidays.filter((h) => {
      const hDate = h.date.slice(0, 10);
      const selDate = format(selectedDate, "yyyy-MM-dd");
      return hDate === selDate;
    });
  }, [selectedDate, holidays]);

  // Legend items
  const legendItems = [
    { color: "bg-amber-500", label: "Holiday" },
    { color: "bg-blue-500", label: "Active" },
    { color: "bg-emerald-500", label: "Complete" },
    { color: "bg-red-500", label: "Overdue" },
  ];

  if (!tasks || !holidays) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary" />
            Calendar
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track deadlines, holidays, and project milestones
          </p>
        </div>
        {isAdminOrManager && (
          <Button size="sm" onClick={() => setHolidayDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Holiday
          </Button>
        )}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goToPrev} className="h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-bold text-foreground min-w-[180px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button variant="ghost" size="icon" onClick={goToNext} className="h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-3">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
      </div>

      {/* Calendar + detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar grid (takes 2/3 on desktop) */}
        <div className="lg:col-span-2">
          <CalendarGrid
            currentMonth={currentMonth}
            tasks={tasks}
            holidays={holidays}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        {/* Detail panel (takes 1/3 on desktop) */}
        <div>
          {selectedDate ? (
            <DayDetailPanel
              date={selectedDate}
              tasks={selectedDayTasks}
              holidays={selectedDayHolidays}
              isAdminOrManager={isAdminOrManager}
              onClose={() => setSelectedDate(null)}
            />
          ) : (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Click on a day to see tasks and events
              </p>
            </div>
          )}

          {/* Mobile legend */}
          <div className="flex md:hidden items-center justify-center gap-3 mt-4">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-[10px] text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holiday dialog */}
      <HolidayDialog
        open={holidayDialogOpen}
        onClose={() => setHolidayDialogOpen(false)}
        defaultDate={selectedDate ?? undefined}
      />
    </div>
  );
}
