import { Badge } from "@/components/ui/badge.tsx";

type UserStat = {
  name: string;
  role: string;
  totalTasks: number;
  completed: number;
  inProgress: number;
  overdue: number;
  notStarted: number;
  completionRate: number;
  avgProgress: number;
  budgetAllocated: number;
  budgetRealized: number;
  projectBreakdown: Array<{ name: string; total: number; completed: number }>;
};

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  staff: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

type UserAnalyticsCardsProps = {
  data: UserStat[];
  onViewOverdue?: (userName: string) => void;
};

export default function UserAnalyticsCards({ data, onViewOverdue }: UserAnalyticsCardsProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">
        No user data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {data.map((user) => (
        <div
          key={user.name}
          className="bg-card border border-border rounded-xl p-5 space-y-4"
        >
          {/* User header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground truncate">
                  {user.name}
                </h4>
                <Badge
                  variant="secondary"
                  className={`text-[10px] capitalize shrink-0 ${ROLE_STYLES[user.role] ?? ""}`}
                >
                  {user.role}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {user.totalTasks} tasks assigned
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-foreground">
                {user.completionRate}%
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Done
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Average progress</span>
              <span className="font-mono">{user.avgProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${user.avgProgress}%` }}
              />
            </div>
          </div>

          {/* Status breakdown */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-emerald-500/10 rounded-lg py-2 px-1">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {user.completed}
              </p>
              <p className="text-[10px] text-muted-foreground">Complete</p>
            </div>
            <div className="bg-blue-500/10 rounded-lg py-2 px-1">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {user.inProgress}
              </p>
              <p className="text-[10px] text-muted-foreground">In Progress</p>
            </div>
            {/* Overdue - clickable if there are overdue tasks */}
            {user.overdue > 0 && onViewOverdue ? (
              <button
                onClick={() => onViewOverdue(user.name)}
                className="bg-red-500/10 rounded-lg py-2 px-1 hover:bg-red-500/20 transition-colors cursor-pointer"
                title={`View ${user.overdue} overdue tasks for ${user.name}`}
              >
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {user.overdue}
                </p>
                <p className="text-[10px] text-red-600 dark:text-red-400 font-medium underline underline-offset-2">
                  Overdue
                </p>
              </button>
            ) : (
              <div className="bg-red-500/10 rounded-lg py-2 px-1">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {user.overdue}
                </p>
                <p className="text-[10px] text-muted-foreground">Overdue</p>
              </div>
            )}
            <div className="bg-muted rounded-lg py-2 px-1">
              <p className="text-lg font-bold text-muted-foreground">
                {user.notStarted}
              </p>
              <p className="text-[10px] text-muted-foreground">Not Started</p>
            </div>
          </div>

          {/* Project breakdown */}
          {user.projectBreakdown.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Projects
              </p>
              <div className="space-y-1.5">
                {user.projectBreakdown.map((proj) => {
                  const rate =
                    proj.total > 0
                      ? Math.round((proj.completed / proj.total) * 100)
                      : 0;
                  return (
                    <div
                      key={proj.name}
                      className="flex items-center justify-between text-sm py-1"
                    >
                      <span className="text-foreground truncate mr-2">
                        {proj.name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground font-mono">
                          {proj.completed}/{proj.total}
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
