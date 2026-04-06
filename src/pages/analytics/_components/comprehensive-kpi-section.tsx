import { cn } from "@/lib/utils.ts";
import { formatRupiah } from "@/lib/currency.ts";
import { Badge } from "@/components/ui/badge.tsx";
import {
  CalendarCheck,
  Award,
  AlertOctagon,
  Trophy,
  Crown,
  Medal,
  TrendingUp,
  ClipboardCheck,
  Clock,
  Star,
} from "lucide-react";
import KpiCard from "./kpi-card.tsx";

// ── Types ──

type KPIUser = {
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

type KPISummary = {
  totalPresentDays: number;
  totalRewards: number;
  totalPunishments: number;
  rpNet: number;
  workingDays: number;
  avgAttendanceRate: number;
};

type Props = {
  users: KPIUser[];
  summary: KPISummary;
};

// ── Helpers ──

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  staff: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  pkl: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

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

// ── Score bar component ──

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
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", scoreBg(score))}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">{detail}</p>
    </div>
  );
}

// ── Podium ──

const PODIUM_CONFIG = [
  {
    icon: Medal,
    iconColor: "text-slate-400 dark:text-slate-500",
    avatarBg:
      "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200",
    avatarSize: "w-14 h-14 text-lg",
    barHeight: "h-20",
    barBg:
      "bg-gradient-to-t from-slate-200/80 to-slate-100/40 dark:from-slate-700/60 dark:to-slate-800/30",
    scoreColor: "text-slate-600 dark:text-slate-300",
  },
  {
    icon: Crown,
    iconColor: "text-amber-500",
    avatarBg:
      "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200 ring-2 ring-amber-400/50",
    avatarSize: "w-18 h-18 text-xl",
    barHeight: "h-28",
    barBg:
      "bg-gradient-to-t from-amber-200/70 to-amber-100/30 dark:from-amber-900/40 dark:to-amber-900/10",
    scoreColor: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: Award,
    iconColor: "text-orange-500 dark:text-orange-600",
    avatarBg:
      "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-200",
    avatarSize: "w-12 h-12 text-base",
    barHeight: "h-14",
    barBg:
      "bg-gradient-to-t from-orange-200/60 to-orange-100/20 dark:from-orange-900/30 dark:to-orange-900/10",
    scoreColor: "text-orange-600 dark:text-orange-400",
  },
];

function KPIPodium({ entries }: { entries: KPIUser[] }) {
  if (entries.length < 1) return null;

  // Display: 2nd, 1st, 3rd
  const displayOrder =
    entries.length >= 3
      ? [
          { entry: entries[1], config: PODIUM_CONFIG[0] },
          { entry: entries[0], config: PODIUM_CONFIG[1] },
          { entry: entries[2], config: PODIUM_CONFIG[2] },
        ]
      : entries.length === 2
        ? [
            { entry: entries[1], config: PODIUM_CONFIG[0] },
            { entry: entries[0], config: PODIUM_CONFIG[1] },
          ]
        : [{ entry: entries[0], config: PODIUM_CONFIG[1] }];

  return (
    <div className="relative bg-gradient-to-b from-primary/5 via-primary/3 to-transparent rounded-2xl px-4 py-6 pt-4 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="flex items-end justify-center gap-3 sm:gap-6 relative">
        {displayOrder.map(({ entry, config }) => {
          const Icon = config.icon;
          return (
            <div
              key={entry.rank}
              className="flex flex-col items-center w-24 sm:w-32"
            >
              <Icon className={cn("w-6 h-6 mb-1.5", config.iconColor)} />
              <div
                className={cn(
                  "rounded-full font-bold flex items-center justify-center shrink-0",
                  config.avatarSize,
                  config.avatarBg,
                )}
              >
                {entry.name.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-semibold mt-2 truncate w-full text-center text-foreground">
                {entry.name}
              </p>
              <p className={cn("text-lg font-bold", config.scoreColor)}>
                {entry.overallScore}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {scoreLabel(entry.overallScore)}
              </p>
              <div
                className={cn(
                  "w-full rounded-t-lg mt-2",
                  config.barHeight,
                  config.barBg,
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Per-user KPI Card ──

function UserKPICard({ user }: { user: KPIUser }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
            user.rank === 1
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
              : user.rank === 2
                ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                : user.rank === 3
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  : "bg-muted text-muted-foreground",
          )}
        >
          #{user.rank}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground truncate">
              {user.name}
            </h4>
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] capitalize shrink-0",
                ROLE_STYLES[user.role] ?? "",
              )}
            >
              {user.role}
            </Badge>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={cn("text-2xl font-bold", scoreColor(user.overallScore))}>
            {user.overallScore}
          </p>
          <Badge
            variant="secondary"
            className={cn("text-[9px]", scoreBadgeBg(user.overallScore))}
          >
            {scoreLabel(user.overallScore)}
          </Badge>
        </div>
      </div>

      {/* Score Bars */}
      <div className="space-y-3">
        <ScoreBar
          label="Task Performance"
          score={user.taskScore}
          detail={`${user.completedTasks}/${user.totalTasks} done | ${user.onTimeRate}% on-time | ${user.avgProgress}% avg progress`}
        />
        <ScoreBar
          label="Attendance"
          score={user.attendanceScore}
          detail={`${user.presentDays} days present | ${user.avgWorkHours}h avg/day | ${user.attendanceRate}% rate`}
        />
        <ScoreBar
          label="Reward & Punishment"
          score={user.rpScore}
          detail={`${formatRupiah(user.rewards)} reward | ${formatRupiah(user.punishments)} punishment | Net: ${formatRupiah(user.rpNet)}`}
        />
      </div>

      {/* Mini stats grid */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-emerald-500/10 rounded-lg py-1.5 px-1">
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {user.completedTasks}
          </p>
          <p className="text-[9px] text-muted-foreground">Complete</p>
        </div>
        <div className="bg-red-500/10 rounded-lg py-1.5 px-1">
          <p className="text-sm font-bold text-red-600 dark:text-red-400">
            {user.overdueTasks}
          </p>
          <p className="text-[9px] text-muted-foreground">Overdue</p>
        </div>
        <div className="bg-blue-500/10 rounded-lg py-1.5 px-1">
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {user.presentDays}
          </p>
          <p className="text-[9px] text-muted-foreground">Present</p>
        </div>
        <div className="bg-amber-500/10 rounded-lg py-1.5 px-1">
          <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
            {user.rewardCount}
          </p>
          <p className="text-[9px] text-muted-foreground">Rewards</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Section ──

export default function ComprehensiveKPISection({ users, summary }: Props) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 text-muted-foreground text-sm gap-2">
        <TrendingUp className="w-8 h-8 opacity-40" />
        <p>No KPI data available for this period</p>
      </div>
    );
  }

  const top3 = users.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          icon={CalendarCheck}
          title="Attendance Rate"
          value={`${summary.avgAttendanceRate}%`}
          accent={summary.avgAttendanceRate >= 80 ? "success" : "warning"}
        />
        <KpiCard
          icon={Clock}
          title="Working Days"
          value={summary.workingDays > 0 ? summary.workingDays : "N/A"}
        />
        <KpiCard
          icon={ClipboardCheck}
          title="Total Present"
          value={summary.totalPresentDays}
          subtitle="check-in records"
        />
        <KpiCard
          icon={Star}
          title="Total Rewards"
          value={formatRupiah(summary.totalRewards)}
          accent="success"
        />
        <KpiCard
          icon={AlertOctagon}
          title="Punishments"
          value={formatRupiah(Math.abs(summary.totalPunishments))}
          accent={summary.totalPunishments < 0 ? "danger" : "default"}
        />
        <KpiCard
          icon={Trophy}
          title="Net Balance"
          value={formatRupiah(summary.rpNet)}
          accent={summary.rpNet >= 0 ? "success" : "danger"}
        />
      </div>

      {/* Podium */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Overall KPI Rankings
        </h3>
        <KPIPodium entries={top3} />
      </div>

      {/* Scoring breakdown info */}
      <div className="bg-muted/50 border border-border rounded-xl px-5 py-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">KPI Scoring:</span>{" "}
          Task Performance (40%) + Attendance (30%) + Reward {"&"} Punishment (30%)
          = Overall Score. Scores range from 0-100.
        </p>
      </div>

      {/* Per-user cards */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">
          Individual Performance Review
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          Detailed breakdown of each team member{"'"}s KPI across all dimensions
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {users.map((user) => (
            <UserKPICard key={user.userId} user={user} />
          ))}
        </div>
      </div>
    </div>
  );
}
