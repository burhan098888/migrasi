import { ConvexError } from "convex/values";
import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel.d.ts";

/**
 * Filter tasks by deadline within a period (inclusive).
 * If no period args, returns all tasks.
 */
function filterByPeriod(
  tasks: Doc<"tasks">[],
  periodStart?: string,
  periodEnd?: string,
): Doc<"tasks">[] {
  if (!periodStart || !periodEnd) return tasks;
  return tasks.filter((t) => t.deadline >= periodStart && t.deadline <= periodEnd);
}

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Compute report periods for trend data (25th–24th cycle).
 * Mirrors frontend report-period.ts logic.
 */
function getReportPeriodsForTrend(count: number) {
  const now = new Date();
  let month = now.getMonth() + 1;
  let year = now.getFullYear();

  if (now.getDate() >= 25) {
    month++;
    if (month > 12) { month = 1; year++; }
  }

  const periods: Array<{
    label: string;
    shortLabel: string;
    startDate: string;
    endDate: string;
  }> = [];

  for (let i = 0; i < count; i++) {
    let startMonth = month - 1;
    let startYear = year;
    if (startMonth < 1) { startMonth = 12; startYear--; }

    const startDate = new Date(Date.UTC(startYear, startMonth - 1, 25, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month - 1, 24, 23, 59, 59, 999));

    periods.unshift({
      label: `${MONTH_SHORT[month - 1]} ${year}`,
      shortLabel: MONTH_SHORT[month - 1],
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    month--;
    if (month < 1) { month = 12; year--; }
  }

  return periods;
}

export const getSummary = query({
  args: {
    periodStart: v.optional(v.string()),
    periodEnd: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const [allTasks, projects, divisions, users] = await Promise.all([
      ctx.db.query("tasks").collect(),
      ctx.db.query("projects").collect(),
      ctx.db.query("divisions").collect(),
      ctx.db.query("users").collect(),
    ]);

    // Filter tasks by period if provided
    const tasks = filterByPeriod(allTasks, args.periodStart, args.periodEnd);

    // --- Task stats by status ---
    const statusCounts = { not_started: 0, in_progress: 0, complete: 0, overdue: 0 };
    for (const t of tasks) {
      statusCounts[t.status] += 1;
    }
    const tasksByStatus = [
      { name: "Not Started", value: statusCounts.not_started, fill: "var(--color-chart-1)" },
      { name: "In Progress", value: statusCounts.in_progress, fill: "var(--color-chart-2)" },
      { name: "Complete", value: statusCounts.complete, fill: "var(--color-chart-3)" },
      { name: "Overdue", value: statusCounts.overdue, fill: "var(--color-chart-4)" },
    ];

    // --- Task stats by priority ---
    const priorityCounts = { low: 0, medium: 0, high: 0 };
    for (const t of tasks) {
      priorityCounts[t.priority] += 1;
    }
    const tasksByPriority = [
      { name: "Low", value: priorityCounts.low },
      { name: "Medium", value: priorityCounts.medium },
      { name: "High", value: priorityCounts.high },
    ];

    // --- Project progress ---
    const projectProgress = projects.map((p) => ({
      name: p.name.length > 18 ? p.name.slice(0, 18) + "..." : p.name,
      progress: p.overallProgress,
    }));

    // --- Budget: allocated vs realized per project ---
    const budgetByProject: Record<string, { allocated: number; realized: number; name: string }> = {};
    for (const t of tasks) {
      const pId = t.projectId as string;
      if (!budgetByProject[pId]) {
        const project = projects.find((p) => p._id === t.projectId);
        budgetByProject[pId] = {
          allocated: 0,
          realized: 0,
          name: project
            ? project.name.length > 18
              ? project.name.slice(0, 18) + "..."
              : project.name
            : "Unknown",
        };
      }
      budgetByProject[pId].allocated += t.budgetAllocated;
      budgetByProject[pId].realized += t.budgetRealized;
    }
    const budgetData = Object.values(budgetByProject);

    // --- Division workload (tasks per division) ---
    const divisionMap = new Map(divisions.map((d) => [d._id as string, d.name]));
    const divisionTaskCounts: Record<string, number> = {};
    for (const t of tasks) {
      const divName = t.divisionId ? divisionMap.get(t.divisionId as string) ?? "Unassigned" : "Unassigned";
      divisionTaskCounts[divName] = (divisionTaskCounts[divName] ?? 0) + 1;
    }
    const divisionWorkload = Object.entries(divisionTaskCounts).map(
      ([name, count]) => ({ name, tasks: count }),
    );

    // --- Top performers (users with most complete tasks) ---
    const userCompleteCount: Record<string, number> = {};
    for (const t of tasks) {
      if (t.status === "complete") {
        const key = t.assigneeId as string;
        userCompleteCount[key] = (userCompleteCount[key] ?? 0) + 1;
      }
    }
    const topPerformers = Object.entries(userCompleteCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([userId, completed]) => {
        const u = users.find((usr) => (usr._id as string) === userId);
        return {
          name: u?.name ?? "Unknown",
          completed,
          total: tasks.filter((t) => (t.assigneeId as string) === userId).length,
        };
      });

    // --- High level KPIs ---
    const totalBudgetAllocated = tasks.reduce((s, t) => s + t.budgetAllocated, 0);
    const totalBudgetRealized = tasks.reduce((s, t) => s + t.budgetRealized, 0);
    const completionRate =
      tasks.length > 0
        ? Math.round((statusCounts.complete / tasks.length) * 100)
        : 0;
    const avgProgress =
      tasks.length > 0
        ? Math.round(tasks.reduce((s, t) => s + t.progressPercentage, 0) / tasks.length)
        : 0;

    // On-time delivery rate: completed / (completed + overdue)
    const onTimeDeliveryRate =
      (statusCounts.complete + statusCounts.overdue) > 0
        ? Math.round(
            (statusCounts.complete / (statusCounts.complete + statusCounts.overdue)) * 100,
          )
        : 100;

    // High priority count
    const highPriorityCount = tasks.filter(
      (t) => t.priority === "high" && t.status !== "complete",
    ).length;

    return {
      kpis: {
        totalProjects: projects.length,
        totalTasks: tasks.length,
        completionRate,
        avgProgress,
        overdueCount: statusCounts.overdue,
        totalBudgetAllocated,
        totalBudgetRealized,
        totalUsers: users.length,
        onTimeDeliveryRate,
        highPriorityCount,
      },
      tasksByStatus,
      tasksByPriority,
      projectProgress,
      budgetData,
      divisionWorkload,
      topPerformers,
    };
  },
});

export const getUserAnalytics = query({
  args: {
    periodStart: v.optional(v.string()),
    periodEnd: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const [allTasks, projects, users] = await Promise.all([
      ctx.db.query("tasks").collect(),
      ctx.db.query("projects").collect(),
      ctx.db.query("users").collect(),
    ]);

    // Filter tasks by period if provided
    const tasks = filterByPeriod(allTasks, args.periodStart, args.periodEnd);

    const projectMap = new Map(projects.map((p) => [p._id as string, p.name]));

    // Build per-user analytics
    const userStats: Record<
      string,
      {
        name: string;
        role: string;
        totalTasks: number;
        completed: number;
        inProgress: number;
        overdue: number;
        notStarted: number;
        avgProgress: number;
        totalProgressSum: number;
        budgetAllocated: number;
        budgetRealized: number;
        projectBreakdown: Record<string, { name: string; total: number; completed: number }>;
      }
    > = {};

    for (const u of users) {
      const uid = u._id as string;
      userStats[uid] = {
        name: u.name ?? "Unknown",
        role: u.role,
        totalTasks: 0,
        completed: 0,
        inProgress: 0,
        overdue: 0,
        notStarted: 0,
        avgProgress: 0,
        totalProgressSum: 0,
        budgetAllocated: 0,
        budgetRealized: 0,
        projectBreakdown: {},
      };
    }

    for (const t of tasks) {
      const uid = t.assigneeId as string;
      const stat = userStats[uid];
      if (!stat) continue;

      stat.totalTasks += 1;
      stat.totalProgressSum += t.progressPercentage;
      stat.budgetAllocated += t.budgetAllocated;
      stat.budgetRealized += t.budgetRealized;

      if (t.status === "complete") stat.completed += 1;
      else if (t.status === "in_progress") stat.inProgress += 1;
      else if (t.status === "overdue") stat.overdue += 1;
      else stat.notStarted += 1;

      // Project breakdown
      const pid = t.projectId as string;
      if (!stat.projectBreakdown[pid]) {
        stat.projectBreakdown[pid] = {
          name: projectMap.get(pid) ?? "Unknown",
          total: 0,
          completed: 0,
        };
      }
      stat.projectBreakdown[pid].total += 1;
      if (t.status === "complete") stat.projectBreakdown[pid].completed += 1;
    }

    // Convert to array and compute avg
    const userAnalytics = Object.values(userStats)
      .filter((u) => u.totalTasks > 0)
      .map((u) => ({
        name: u.name,
        role: u.role,
        totalTasks: u.totalTasks,
        completed: u.completed,
        inProgress: u.inProgress,
        overdue: u.overdue,
        notStarted: u.notStarted,
        completionRate:
          u.totalTasks > 0 ? Math.round((u.completed / u.totalTasks) * 100) : 0,
        avgProgress:
          u.totalTasks > 0 ? Math.round(u.totalProgressSum / u.totalTasks) : 0,
        budgetAllocated: u.budgetAllocated,
        budgetRealized: u.budgetRealized,
        projectBreakdown: Object.values(u.projectBreakdown).sort(
          (a, b) => b.total - a.total,
        ),
      }))
      .sort((a, b) => b.totalTasks - a.totalTasks);

    return userAnalytics;
  },
});

// ────────────────────────────────────────────────
// Leaderboard with composite scoring
// ────────────────────────────────────────────────

export const getLeaderboard = query({
  args: {
    periodStart: v.optional(v.string()),
    periodEnd: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ code: "UNAUTHENTICATED", message: "User not logged in" });
    }

    const [allTasks, users] = await Promise.all([
      ctx.db.query("tasks").collect(),
      ctx.db.query("users").collect(),
    ]);

    const tasks = filterByPeriod(allTasks, args.periodStart, args.periodEnd);

    const stats: Record<
      string,
      {
        name: string;
        role: string;
        totalTasks: number;
        completed: number;
        overdue: number;
        inProgress: number;
        notStarted: number;
        progressSum: number;
      }
    > = {};

    for (const u of users) {
      const uid = u._id as string;
      stats[uid] = {
        name: u.name ?? "Unknown",
        role: u.role,
        totalTasks: 0,
        completed: 0,
        overdue: 0,
        inProgress: 0,
        notStarted: 0,
        progressSum: 0,
      };
    }

    for (const t of tasks) {
      const uid = t.assigneeId as string;
      const stat = stats[uid];
      if (!stat) continue;
      stat.totalTasks++;
      stat.progressSum += t.progressPercentage;
      if (t.status === "complete") stat.completed++;
      else if (t.status === "overdue") stat.overdue++;
      else if (t.status === "in_progress") stat.inProgress++;
      else stat.notStarted++;
    }

    // Normalize completed count against the team maximum
    const maxCompleted = Math.max(
      ...Object.values(stats).map((s) => s.completed),
      1,
    );

    const ranked = Object.values(stats)
      .filter((s) => s.totalTasks > 0)
      .map((s) => {
        const completionRate =
          s.totalTasks > 0 ? (s.completed / s.totalTasks) * 100 : 0;
        const overdueRate =
          s.totalTasks > 0 ? (s.overdue / s.totalTasks) * 100 : 0;
        const avgProgress =
          s.totalTasks > 0 ? Math.round(s.progressSum / s.totalTasks) : 0;

        // Composite score (0-100):
        //   40% completion rate  +  35% normalized volume  +  25% low-overdue bonus
        const score = Math.min(
          100,
          Math.round(
            completionRate * 0.4 +
              (s.completed / maxCompleted) * 100 * 0.35 +
              (100 - overdueRate) * 0.25,
          ),
        );

        return {
          name: s.name,
          role: s.role,
          score,
          totalTasks: s.totalTasks,
          completed: s.completed,
          overdue: s.overdue,
          inProgress: s.inProgress,
          completionRate: Math.round(completionRate),
          avgProgress,
        };
      })
      .sort((a, b) => b.score - a.score);

    return ranked.map((r, i) => ({ ...r, rank: i + 1 }));
  },
});

// ────────────────────────────────────────────────
// Task completion trend over the last 6 report periods
// ────────────────────────────────────────────────

export const getCompletionTrend = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ code: "UNAUTHENTICATED", message: "User not logged in" });
    }

    const tasks = await ctx.db.query("tasks").collect();
    const periods = getReportPeriodsForTrend(6);

    return periods.map((p) => {
      const periodTasks = tasks.filter(
        (t) => t.deadline >= p.startDate && t.deadline <= p.endDate,
      );
      return {
        label: p.shortLabel,
        fullLabel: p.label,
        total: periodTasks.length,
        completed: periodTasks.filter((t) => t.status === "complete").length,
        overdue: periodTasks.filter((t) => t.status === "overdue").length,
        inProgress: periodTasks.filter((t) => t.status === "in_progress").length,
      };
    });
  },
});
