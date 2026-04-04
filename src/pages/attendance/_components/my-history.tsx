import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty.tsx";
import { CalendarDays, Clock, CheckCircle2, MapPin } from "lucide-react";
import { format } from "date-fns";
import { useDemoMode } from "@/hooks/use-demo-mode.tsx";

function formatDuration(checkIn: string, checkOut: string): string {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

type MyHistoryProps = {
  startDate: string;
  endDate: string;
};

export default function MyHistory({ startDate, endDate }: MyHistoryProps) {
  const { demoModeArg } = useDemoMode();
  const records = useQuery(api.attendance.getMyHistory, { startDate, endDate, demoMode: demoModeArg });

  const isLoading = records === undefined;

  // Compute personal stats
  const totalDays = records?.length ?? 0;
  const completedDays =
    records?.filter((r) => r.status === "checked_out").length ?? 0;
  let totalMinutes = 0;
  for (const r of records ?? []) {
    if (r.checkOutTime) {
      totalMinutes +=
        (new Date(r.checkOutTime).getTime() -
          new Date(r.checkInTime).getTime()) /
        60000;
    }
  }
  const avgMinutes = completedDays > 0 ? Math.round(totalMinutes / completedDays) : 0;
  const avgHours = Math.floor(avgMinutes / 60);
  const avgMins = avgMinutes % 60;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          My Attendance History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Personal summary */}
        {!isLoading && records.length > 0 && (
          <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/50">
            <div className="text-center">
              <p className="text-2xl font-bold">{totalDays}</p>
              <p className="text-xs text-muted-foreground">Days Present</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{completedDays}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {avgHours}h {avgMins}m
              </p>
              <p className="text-xs text-muted-foreground">Avg. Duration</p>
            </div>
          </div>
        )}

        {/* Records list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarDays />
              </EmptyMedia>
              <EmptyTitle>No attendance records</EmptyTitle>
              <EmptyDescription>
                Your attendance history for this period will appear here
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {records.map((record) => (
              <div
                key={record._id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm">
                    {format(new Date(record.date + "T00:00:00"), "EEE, d MMM yyyy")}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(record.checkInTime), "hh:mm a")}
                    </span>
                    {record.checkOutTime && (
                      <>
                        <span>—</span>
                        <span>
                          {format(new Date(record.checkOutTime), "hh:mm a")}
                        </span>
                        <span className="text-foreground/70 font-medium">
                          ({formatDuration(record.checkInTime, record.checkOutTime)})
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={
                      record.status === "checked_out" ? "default" : "secondary"
                    }
                    className={
                      record.status === "checked_out"
                        ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    }
                  >
                    {record.status === "checked_out" ? (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    ) : (
                      <Clock className="w-3 h-3 mr-1" />
                    )}
                    {record.status === "checked_out" ? "Done" : "Active"}
                  </Badge>
                  <button
                    title={`Location: ${record.checkInLat.toFixed(4)}, ${record.checkInLng.toFixed(4)}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
