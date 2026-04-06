import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { useUserRole } from "@/hooks/use-user-role.ts";
import { useDemoMode } from "@/hooks/use-demo-mode.tsx";
import { MapPin } from "lucide-react";
import { format } from "date-fns";
import CheckInOutCard from "./_components/check-in-out-card.tsx";
import TodayAttendanceList from "./_components/today-attendance-list.tsx";
import AttendanceStats from "./_components/attendance-stats.tsx";
import MyHistory from "./_components/my-history.tsx";
import TeamSummary from "./_components/team-summary.tsx";
import LocationReport from "./_components/location-report.tsx";
import DateRangePicker, {
  getThisMonthRange,
} from "./_components/date-range-picker.tsx";
import type { DateRange } from "./_components/date-range-picker.tsx";

export default function AttendancePage() {
  const { isAdminOrManager } = useUserRole();
  const { isDemoGuest } = useDemoMode();
  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange>(getThisMonthRange());

  // Demo guests see all tabs (showcase mode)
  const showAdminTabs = isAdminOrManager || isDemoGuest;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="w-6 h-6 text-primary" />
          Attendance
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {format(today, "EEEE, d MMMM yyyy")}
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="today" className="space-y-6">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          {showAdminTabs && (
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          )}
          {showAdminTabs && (
            <TabsTrigger value="location">Location</TabsTrigger>
          )}
        </TabsList>

        {/* Today tab */}
        <TabsContent value="today" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CheckInOutCard />
            {showAdminTabs && <TodayAttendanceList />}
          </div>
        </TabsContent>

        {/* History tab */}
        <TabsContent value="history" className="space-y-6">
          <DateRangePicker range={dateRange} onRangeChange={setDateRange} />
          <MyHistory
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
          />
        </TabsContent>

        {/* Dashboard tab */}
        {showAdminTabs && (
          <TabsContent value="dashboard" className="space-y-6">
            <DateRangePicker range={dateRange} onRangeChange={setDateRange} />
            <AttendanceStats
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
            <TeamSummary
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          </TabsContent>
        )}

        {/* Location tab */}
        {showAdminTabs && (
          <TabsContent value="location" className="space-y-6">
            <DateRangePicker range={dateRange} onRangeChange={setDateRange} />
            <LocationReport
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
