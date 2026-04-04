import { Authenticated, AuthLoading } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useUserRole } from "@/hooks/use-user-role.ts";
import { MapPin } from "lucide-react";
import { format } from "date-fns";
import CheckInOutCard from "./_components/check-in-out-card.tsx";
import TodayAttendanceList from "./_components/today-attendance-list.tsx";

function AttendanceContent() {
  const { isAdminOrManager } = useUserRole();
  const today = new Date();

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
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

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: personal check-in card */}
        <CheckInOutCard />

        {/* Right: today's team attendance (admin/manager only) */}
        {isAdminOrManager && <TodayAttendanceList />}
      </div>
    </div>
  );
}

export default function AttendancePage() {
  return (
    <>
      <Authenticated>
        <AttendanceContent />
      </Authenticated>
      <AuthLoading>
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </AuthLoading>
    </>
  );
}
