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
import { Users, Clock, CheckCircle2, MapPin } from "lucide-react";
import { format } from "date-fns";
import { useDemoMode } from "@/hooks/use-demo-mode.tsx";

export default function TodayAttendanceList() {
  const { demoModeArg } = useDemoMode();
  const todayDate = new Date().toISOString().split("T")[0];
  const records = useQuery(api.attendance.getByDate, { date: todayDate, demoMode: demoModeArg });

  const isLoading = records === undefined;

  const checkedInCount = records?.filter((r) => r.status === "checked_in").length ?? 0;
  const checkedOutCount = records?.filter((r) => r.status === "checked_out").length ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Today{"'"}s Attendance
          </CardTitle>
          {!isLoading && records && records.length > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                {checkedInCount} in
              </span>
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {checkedOutCount} done
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>No attendance recorded yet</EmptyTitle>
              <EmptyDescription>
                Attendance records will appear here as team members check in
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-2">
            {records.map((record) => (
              <div
                key={record._id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold shrink-0">
                    {record.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {record.userName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        In: {format(new Date(record.checkInTime), "hh:mm a")}
                      </span>
                      {record.checkOutTime && (
                        <span>
                          Out:{" "}
                          {format(new Date(record.checkOutTime), "hh:mm a")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                    title={`Check-in: ${record.checkInLat.toFixed(4)}, ${record.checkInLng.toFixed(4)}`}
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
