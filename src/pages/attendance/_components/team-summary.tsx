import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty.tsx";
import { Trophy, Users } from "lucide-react";
import { useDemoMode } from "@/hooks/use-demo-mode.tsx";

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

type TeamSummaryProps = {
  startDate: string;
  endDate: string;
};

export default function TeamSummary({ startDate, endDate }: TeamSummaryProps) {
  const { demoModeArg } = useDemoMode();
  const stats = useQuery(api.attendance.getStats, { startDate, endDate, demoMode: demoModeArg });

  const isLoading = stats === undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Team Attendance Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !stats.userSummaries || stats.userSummaries.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>No data for this period</EmptyTitle>
              <EmptyDescription>
                Team attendance data will appear here once members start checking
                in
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 pr-4 font-medium">#</th>
                  <th className="text-left py-2 pr-4 font-medium">Name</th>
                  <th className="text-center py-2 px-2 font-medium">Days</th>
                  <th className="text-center py-2 px-2 font-medium">
                    Completed
                  </th>
                  <th className="text-center py-2 px-2 font-medium">
                    Total Hours
                  </th>
                  <th className="text-center py-2 pl-2 font-medium">
                    Avg. Duration
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.userSummaries.map((user, idx) => (
                  <tr
                    key={user.userId}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                          {user.userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium truncate max-w-[150px]">
                          {user.userName}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {user.totalDays}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {user.completedDays}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {formatMinutes(user.totalMinutes)}
                    </td>
                    <td className="py-2.5 pl-2 text-center">
                      {formatMinutes(user.avgMinutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
