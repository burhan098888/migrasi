import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Users, Clock, CalendarCheck, Timer } from "lucide-react";
import { useDemoMode } from "@/hooks/use-demo-mode.tsx";

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

type AttendanceStatsProps = {
  startDate: string;
  endDate: string;
};

export default function AttendanceStats({
  startDate,
  endDate,
}: AttendanceStatsProps) {
  const { demoModeArg } = useDemoMode();
  const stats = useQuery(api.attendance.getStats, { startDate, endDate, demoMode: demoModeArg });

  const isLoading = stats === undefined;

  const cards = [
    {
      label: "Total Check-ins",
      value: stats?.totalRecords ?? 0,
      icon: CalendarCheck,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Completed",
      value: stats?.completedRecords ?? 0,
      icon: Users,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Unique Users",
      value: `${stats?.uniqueUsers ?? 0} / ${stats?.totalUsers ?? 0}`,
      icon: Users,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Avg. Work Duration",
      value: stats ? formatMinutes(stats.avgMinutes) : "0m",
      icon: Timer,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center shrink-0`}
              >
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-lg font-bold truncate">{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
