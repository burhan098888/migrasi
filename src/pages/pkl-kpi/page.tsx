import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { cn } from "@/lib/utils.ts";
import { formatRupiah } from "@/lib/currency.ts";
import {
  GraduationCap,
  CalendarCheck,
  Clock,
  Star,
  AlertOctagon,
  Trophy,
  TrendingUp,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import {
  getCurrentReportPeriod,
  type ReportPeriod,
} from "@/lib/report-period.ts";
import PeriodSelector from "../analytics/_components/period-selector.tsx";
import KpiCard from "../analytics/_components/kpi-card.tsx";
import { useDemoMode } from "@/hooks/use-demo-mode.tsx";

// ── Helpers ──

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-blue-600 dark:text-blue-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Average";
  return "Needs Improvement";
}

function scoreBadgeBg(score: number): string {
  if (score >= 80)
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (score >= 60)
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  if (score >= 40)
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}

// ── Score bar ──

function ScoreBar({
  label,
  score,
  detail,
}: {
  label: string;
  score: number;
  detail: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-mono font-medium", scoreColor(score))}>
          {score}
        </span>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", scoreBg(score))}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">{detail}</p>
    </div>
  );
}

// ── Intern card with expandable details ──

type InternKPI = {
  rank: number;
  userId: string;
  name: string;
  role: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  inProgressTasks: number;
  taskCompletionRate: number;
  onTimeRate: number;
  avgProgress: number;
  presentDays: number;
  avgWorkHours: number;
  rewards: number;
  punishments: number;
  rpNet: number;
  rewardCount: number;
  punishmentCount: number;
  taskScore: number;
  attendanceRate: number;
  attendanceScore: number;
  rpScore: number;
  overallScore: number;
};

function InternCard({ intern }: { intern: InternKPI }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 flex items-center gap-4 hover:bg-muted/30 transition-colors"
      >
        {/* Rank badge */}
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
            intern.rank === 1
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 ring-2 ring-amber-400/40"
              : intern.rank === 2
                ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                : intern.rank === 3
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  : "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
          )}
        >
          #{intern.rank}
        </div>

        {/* Name + role */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">
              {intern.name}
            </h3>
            <Badge
              variant="secondary"
              className="text-[9px] bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 shrink-0"
            >
              <GraduationCap className="w-3 h-3 mr-1" />
              PKL
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {intern.totalTasks} tasks | {intern.presentDays} days present |{" "}
            {intern.rewardCount + intern.punishmentCount} R&P records
          </p>
        </div>

        {/* Overall score */}
        <div className="text-right shrink-0">
          <p className={cn("text-3xl font-bold", scoreColor(intern.overallScore))}>
            {intern.overallScore}
          </p>
          <Badge
            variant="secondary"
            className={cn("text-[9px]", scoreBadgeBg(intern.overallScore))}
          >
            {scoreLabel(intern.overallScore)}
          </Badge>
        </div>

        {/* Expand icon */}
        <div className="shrink-0 text-muted-foreground">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
          {/* Score bars */}
          <div className="space-y-3">
            <ScoreBar
              label="Task Performance (40%)"
              score={intern.taskScore}
              detail={`${intern.completedTasks}/${intern.totalTasks} completed | ${intern.onTimeRate}% on-time | ${intern.avgProgress}% avg progress`}
            />
            <ScoreBar
              label="Attendance (30%)"
              score={intern.attendanceScore}
              detail={`${intern.presentDays} days present | ${intern.avgWorkHours}h avg/day | ${intern.attendanceRate}% attendance rate`}
            />
            <ScoreBar
              label="Reward & Punishment (30%)"
              score={intern.rpScore}
              detail={`${formatRupiah(intern.rewards)} reward | ${formatRupiah(intern.punishments)} punishment | Net: ${formatRupiah(intern.rpNet)}`}
            />
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-emerald-500/10 rounded-lg py-2 px-1">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {intern.completedTasks}
              </p>
              <p className="text-[10px] text-muted-foreground">Tasks Done</p>
            </div>
            <div className="bg-red-500/10 rounded-lg py-2 px-1">
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {intern.overdueTasks}
              </p>
              <p className="text-[10px] text-muted-foreground">Overdue</p>
            </div>
            <div className="bg-blue-500/10 rounded-lg py-2 px-1">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {intern.presentDays}
              </p>
              <p className="text-[10px] text-muted-foreground">Days Present</p>
            </div>
            <div className="bg-teal-500/10 rounded-lg py-2 px-1">
              <p className="text-lg font-bold text-teal-600 dark:text-teal-400">
                {intern.avgWorkHours}h
              </p>
              <p className="text-[10px] text-muted-foreground">Avg Hours/Day</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──

export default function PklKpiPage() {
  const { demoModeArg } = useDemoMode();

  // Period state
  const [periodMode, setPeriodMode] = useState<"all" | "period">("all");
  const [period, setPeriod] = useState<ReportPeriod>(getCurrentReportPeriod);

  const periodArgs =
    periodMode === "period"
      ? {
          periodStart: period.startDate,
          periodEnd: period.endDate,
          demoMode: demoModeArg,
          filterRole: "pkl",
        }
      : { demoMode: demoModeArg, filterRole: "pkl" };

  const kpiData = useQuery(api.analytics.getComprehensiveKPI, periodArgs);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              PKL Performance Review
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {periodMode === "period"
                ? `Intern evaluation for ${period.label} (25th-24th cycle)`
                : "Comprehensive intern team performance evaluation"}
            </p>
          </div>
        </div>

        <PeriodSelector
          mode={periodMode}
          period={period}
          onModeChange={setPeriodMode}
          onPeriodChange={setPeriod}
        />
      </div>

      {/* Loading skeleton */}
      {!kpiData && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}

      {kpiData && (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard
              icon={GraduationCap}
              title="Total Interns"
              value={kpiData.users.length}
            />
            <KpiCard
              icon={CalendarCheck}
              title="Attendance Rate"
              value={`${kpiData.summary.avgAttendanceRate}%`}
              accent={kpiData.summary.avgAttendanceRate >= 80 ? "success" : "warning"}
            />
            <KpiCard
              icon={ClipboardCheck}
              title="Present Days"
              value={kpiData.summary.totalPresentDays}
            />
            <KpiCard
              icon={Star}
              title="Total Rewards"
              value={formatRupiah(kpiData.summary.totalRewards)}
              accent="success"
            />
            <KpiCard
              icon={AlertOctagon}
              title="Punishments"
              value={formatRupiah(Math.abs(kpiData.summary.totalPunishments))}
              accent={kpiData.summary.totalPunishments < 0 ? "danger" : "default"}
            />
            <KpiCard
              icon={Trophy}
              title="Net Balance"
              value={formatRupiah(kpiData.summary.rpNet)}
              accent={kpiData.summary.rpNet >= 0 ? "success" : "danger"}
            />
          </div>

          {/* Average score banner */}
          {kpiData.users.length > 0 && (
            <div className="bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent border border-teal-500/20 rounded-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  Average Intern KPI Score
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Based on Tasks (40%) + Attendance (30%) + Reward {"&"} Punishment
                  (30%)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p
                  className={cn(
                    "text-4xl font-bold",
                    scoreColor(
                      Math.round(
                        kpiData.users.reduce((s, u) => s + u.overallScore, 0) /
                          kpiData.users.length,
                      ),
                    ),
                  )}
                >
                  {Math.round(
                    kpiData.users.reduce((s, u) => s + u.overallScore, 0) /
                      kpiData.users.length,
                  )}
                </p>
                <div className="text-xs text-muted-foreground">
                  <p>of 100</p>
                  <p className="font-medium">
                    {scoreLabel(
                      Math.round(
                        kpiData.users.reduce((s, u) => s + u.overallScore, 0) /
                          kpiData.users.length,
                      ),
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick overview table */}
          {kpiData.users.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-muted/30">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Ranking Overview
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground uppercase w-10">
                        #
                      </th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Intern
                      </th>
                      <th className="text-center py-2.5 px-4 text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">
                        Tasks
                      </th>
                      <th className="text-center py-2.5 px-4 text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">
                        Attendance
                      </th>
                      <th className="text-center py-2.5 px-4 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">
                        {"R&P"}
                      </th>
                      <th className="text-center py-2.5 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Overall
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpiData.users.map((user) => (
                      <tr
                        key={user.userId}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                              user.rank === 1
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                : user.rank === 2
                                  ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                  : user.rank === 3
                                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                    : "bg-muted text-muted-foreground",
                            )}
                          >
                            {user.rank}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 text-xs font-bold flex items-center justify-center shrink-0">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-foreground truncate">
                              {user.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-12 h-1.5 rounded-full bg-border overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  scoreBg(user.taskScore),
                                )}
                                style={{
                                  width: `${Math.min(100, user.taskScore)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-mono w-6 text-right">
                              {user.taskScore}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-12 h-1.5 rounded-full bg-border overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  scoreBg(user.attendanceScore),
                                )}
                                style={{
                                  width: `${Math.min(100, user.attendanceScore)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-mono w-6 text-right">
                              {user.attendanceScore}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-12 h-1.5 rounded-full bg-border overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  scoreBg(user.rpScore),
                                )}
                                style={{
                                  width: `${Math.min(100, user.rpScore)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-mono w-6 text-right">
                              {user.rpScore}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={cn(
                              "text-lg font-bold",
                              scoreColor(user.overallScore),
                            )}
                          >
                            {user.overallScore}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Individual intern cards */}
          {kpiData.users.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-lg font-bold text-foreground">
                  Detailed Intern Evaluation
                </h3>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Click on each intern to expand their detailed performance breakdown
              </p>
              <div className="space-y-3">
                {kpiData.users.map((user) => (
                  <InternCard key={user.userId} intern={user} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {kpiData.users.length === 0 && (
            <div className="flex flex-col items-center justify-center h-52 text-muted-foreground text-sm gap-3">
              <GraduationCap className="w-10 h-10 opacity-40" />
              <div className="text-center">
                <p className="font-medium">No PKL interns found</p>
                <p className="text-xs mt-1">
                  Assign the PKL role to users in the User Management page
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
