import { cn } from "@/lib/utils.ts";
import { Crown, Medal, Award, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";

type LeaderboardEntry = {
  rank: number;
  name: string;
  role: string;
  score: number;
  totalTasks: number;
  completed: number;
  overdue: number;
  inProgress: number;
  completionRate: number;
  avgProgress: number;
};

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  staff: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  pkl: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

const PODIUM_CONFIG = [
  {
    // 2nd place (left)
    avatarSize: "w-14 h-14 text-lg",
    avatarBg: "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200",
    barHeight: "h-20",
    barBg: "bg-gradient-to-t from-slate-200/80 to-slate-100/40 dark:from-slate-700/60 dark:to-slate-800/30",
    scoreColor: "text-slate-600 dark:text-slate-300",
    icon: Medal,
    iconColor: "text-slate-400 dark:text-slate-500",
  },
  {
    // 1st place (center)
    avatarSize: "w-18 h-18 text-xl",
    avatarBg:
      "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200 ring-2 ring-amber-400/50",
    barHeight: "h-28",
    barBg: "bg-gradient-to-t from-amber-200/70 to-amber-100/30 dark:from-amber-900/40 dark:to-amber-900/10",
    scoreColor: "text-amber-600 dark:text-amber-400",
    icon: Crown,
    iconColor: "text-amber-500",
  },
  {
    // 3rd place (right)
    avatarSize: "w-12 h-12 text-base",
    avatarBg: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-200",
    barHeight: "h-14",
    barBg: "bg-gradient-to-t from-orange-200/60 to-orange-100/20 dark:from-orange-900/30 dark:to-orange-900/10",
    scoreColor: "text-orange-600 dark:text-orange-400",
    icon: Award,
    iconColor: "text-orange-500 dark:text-orange-600",
  },
];

function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length < 1) return null;

  // Display order: 2nd, 1st, 3rd
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
      {/* Decorative circles */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-end justify-center gap-3 sm:gap-6 relative">
        {displayOrder.map(({ entry, config }) => {
          const Icon = config.icon;
          return (
            <div
              key={entry.rank}
              className="flex flex-col items-center w-24 sm:w-32"
            >
              {/* Medal icon */}
              <Icon className={cn("w-6 h-6 mb-1.5", config.iconColor)} />

              {/* Avatar */}
              <div
                className={cn(
                  "rounded-full font-bold flex items-center justify-center shrink-0",
                  config.avatarSize,
                  config.avatarBg,
                )}
              >
                {entry.name.charAt(0).toUpperCase()}
              </div>

              {/* Name & score */}
              <p className="text-sm font-semibold mt-2 truncate w-full text-center text-foreground">
                {entry.name}
              </p>
              <p className={cn("text-xs font-medium", config.scoreColor)}>
                {entry.score} pts
              </p>
              <p className="text-[10px] text-muted-foreground">
                {entry.completionRate}% done
              </p>

              {/* Podium bar */}
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

function RankingsTable({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-10">
              #
            </th>
            <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Team Member
            </th>
            <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
              Score
            </th>
            <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Done
            </th>
            <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
              Rate
            </th>
            <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
              Overdue
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.rank}
              className="border-b border-border/50 last:border-0"
            >
              {/* Rank */}
              <td className="py-3 px-3">
                <span
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                    entry.rank === 1 &&
                      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
                    entry.rank === 2 &&
                      "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
                    entry.rank === 3 &&
                      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                    entry.rank > 3 && "bg-muted text-muted-foreground",
                  )}
                >
                  {entry.rank}
                </span>
              </td>

              {/* Name + role */}
              <td className="py-3 px-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {entry.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {entry.name}
                    </p>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[9px] capitalize",
                        ROLE_STYLES[entry.role] ?? "",
                      )}
                    >
                      {entry.role}
                    </Badge>
                  </div>
                </div>
              </td>

              {/* Score bar */}
              <td className="py-3 px-3 hidden sm:table-cell">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${entry.score}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-foreground w-8 text-right">
                    {entry.score}
                  </span>
                </div>
              </td>

              {/* Completed / Total */}
              <td className="py-3 px-3 text-right">
                <span className="tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                  {entry.completed}
                </span>
                <span className="text-muted-foreground">/{entry.totalTasks}</span>
              </td>

              {/* Completion rate */}
              <td className="py-3 px-3 text-right hidden md:table-cell">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {entry.completionRate}%
                </span>
              </td>

              {/* Overdue */}
              <td className="py-3 px-3 text-right hidden lg:table-cell">
                <span
                  className={cn(
                    "tabular-nums font-medium",
                    entry.overdue > 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-muted-foreground",
                  )}
                >
                  {entry.overdue}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Leaderboard({
  data,
}: {
  data: LeaderboardEntry[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 text-muted-foreground text-sm gap-2">
        <TrendingUp className="w-8 h-8 opacity-40" />
        <p>No leaderboard data yet</p>
      </div>
    );
  }

  const top3 = data.slice(0, 3);

  return (
    <div className="space-y-5">
      <Podium entries={top3} />
      <RankingsTable entries={data} />
    </div>
  );
}
