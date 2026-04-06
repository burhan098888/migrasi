import { ConvexError } from "convex/values";
import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel.d.ts";
import { filterDemo, resolveDemoAccess } from "./helpers.ts";

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
 * Compute report periods for trend data (25th-24th cycle).
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
    demoMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { effectiveDemoMode } = await resolveDemoAccess(ctx, args.demoMode);

    const [rawTasks, projects, divisions, users] = await Promise.all([
      ctx.db.query("tasks").collect(),
      ctx.db.query("projects").collect(),
      ctx.db.query("divisions").collect(),
      ctx.db.query("users").collect(),
    ]);

    // Filter by demo access, then by period
    const allTasks = filterDemo(rawTasks, effectiveDemoMode);
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
    };
  },
});

export const getUserAnalytics = query({
  args: {
    periodStart: v.optional(v.string()),
    periodEnd: v.optional(v.string()),
    demoMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { effectiveDemoMode } = await resolveDemoAccess(ctx, args.demoMode);

    const [rawTasks, projects, users] = await Promise.all([
      ctx.db.query("tasks").collect(),
      ctx.db.query("projects").collect(),
      ctx.db.query("users").collect(),
    ]);

    // Filter by demo access, then by period
    const allTasks = filterDemo(rawTasks, effectiveDemoMode);
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
    demoMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { effectiveDemoMode } = await resolveDemoAccess(ctx, args.demoMode);

    const [rawTasks, users] = await Promise.all([
      ctx.db.query("tasks").collect(),
      ctx.db.query("users").collect(),
    ]);

    const allTasks = filterDemo(rawTasks, effectiveDemoMode);
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
// Comprehensive KPI: Tasks + Attendance + Reward/Punishment
// ────────────────────────────────────────────────

export const getComprehensiveKPI = query({
  args: {
    periodStart: v.optional(v.string()),
    periodEnd: v.optional(v.string()),
    demoMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { effectiveDemoMode } = await resolveDemoAccess(ctx, args.demoMode);

    const [rawTasks, rawAttendance, rawRP, users, rawHolidays] = await Promise.all([
      ctx.db.query("tasks").collect(),
      ctx.db.query("attendance").collect(),
      ctx.db.query("rewardPunishments").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("holidays").collect(),
    ]);

    const allTasks = filterDemo(rawTasks, effectiveDemoMode);
    const allAttendance = filterDemo(rawAttendance, effectiveDemoMode);
    const allRP = filterDemo(rawRP, effectiveDemoMode);
    const holidays = filterDemo(rawHolidays, effectiveDemoMode);

    // Filter tasks by period
    const tasks = filterByPeriod(allTasks, args.periodStart, args.periodEnd);

    // Extract YYYY-MM-DD boundaries for attendance & R&P
    const pStart = args.periodStart?.split("T")[0];
    const pEnd = args.periodEnd?.split("T")[0];

    const attendance =
      pStart && pEnd
        ? allAttendance.filter((a) => a.date >= pStart && a.date <= pEnd)
        : allAttendance;

    const rp =
      pStart && pEnd
        ? allRP.filter((r) => {
            const d = r.date.length > 10 ? r.date.split("T")[0] : r.date;
            return d >= pStart && d <= pEnd;
          })
        : allRP;

    // Calculate working days in period (weekdays minus holidays)
    let workingDays = 0;
    if (pStart && pEnd) {
      const holidayDates = new Set(holidays.map((h) => h.date));
      const current = new Date(pStart + "T00:00:00Z");
      const end = new Date(pEnd + "T00:00:00Z");
      while (current <= end) {
        const day = current.getUTCDay();
        if (day !== 0 && day !== 6) {
          const dateStr = current.toISOString().split("T")[0];
          if (!holidayDates.has(dateStr)) workingDays++;
        }
        current.setUTCDate(current.getUTCDate() + 1);
      }
    }

    // ── Per-user calculations ──
    const userKPIs = users.map((user) => {
      const uid = user._id;

      // Task metrics
      const uTasks = tasks.filter((t) => t.assigneeId === uid);
      const completed = uTasks.filter((t) => t.status === "complete").length;
      const overdue = uTasks.filter((t) => t.status === "overdue").length;
      const inProgress = uTasks.filter((t) => t.status === "in_progress").length;
      const taskCompletionRate =
        uTasks.length > 0 ? (completed / uTasks.length) * 100 : 0;
      const onTimeRate =
        completed + overdue > 0
          ? (completed / (completed + overdue)) * 100
          : 100;
      const avgProgress =
        uTasks.length > 0
          ? uTasks.reduce((s, t) => s + t.progressPercentage, 0) / uTasks.length
          : 0;

      // Attendance metrics
      const uAttendance = attendance.filter((a) => a.userId === uid);
      const presentDays = uAttendance.length;
      const completedAtt = uAttendance.filter((a) => a.status === "checked_out");
      let totalWorkMin = 0;
      for (const a of completedAtt) {
        if (a.checkOutTime) {
          totalWorkMin +=
            (new Date(a.checkOutTime).getTime() -
              new Date(a.checkInTime).getTime()) /
            60000;
        }
      }
      const avgWorkHours =
        completedAtt.length > 0 ? totalWorkMin / completedAtt.length / 60 : 0;

      // R&P metrics
      const uRP = rp.filter((r) => r.userId === uid);
      const rewards = uRP
        .filter((r) => r.amount > 0)
        .reduce((s, r) => s + r.amount, 0);
      const punishments = uRP
        .filter((r) => r.amount < 0)
        .reduce((s, r) => s + r.amount, 0);
      const rpNet = rewards + punishments;
      const rewardCount = uRP.filter((r) => r.amount > 0).length;
      const punishmentCount = uRP.filter((r) => r.amount < 0).length;

      return {
        userId: uid as string,
        name: user.name ?? "Unknown",
        role: user.role,
        totalTasks: uTasks.length,
        completedTasks: completed,
        overdueTasks: overdue,
        inProgressTasks: inProgress,
        taskCompletionRate: Math.round(taskCompletionRate),
        onTimeRate: Math.round(onTimeRate),
        avgProgress: Math.round(avgProgress),
        presentDays,
        avgWorkHours: Math.round(avgWorkHours * 10) / 10,
        rewards,
        punishments,
        rpNet,
        rewardCount,
        punishmentCount,
      };
    }).filter(
      (u) =>
        u.totalTasks > 0 || u.presentDays > 0 || u.rewardCount > 0 || u.punishmentCount > 0,
    );

    // ── Scoring ──
    const maxCompleted = Math.max(...userKPIs.map((u) => u.completedTasks), 1);
    const allNets = userKPIs.map((u) => u.rpNet);
    const minNet = Math.min(...allNets, 0);
    const maxNet = Math.max(...allNets, 0);
    const netRange = maxNet - minNet || 1;

    const scored = userKPIs
      .map((u) => {
        // Task score (0-100): 40% completion rate + 30% on-time + 30% volume
        const volumeScore = (u.completedTasks / maxCompleted) * 100;
        const taskScore =
          u.taskCompletionRate * 0.4 + u.onTimeRate * 0.3 + volumeScore * 0.3;

        // Attendance score (0-100): 60% attendance rate + 40% work hours
        const attendanceRate =
          workingDays > 0
            ? Math.min(100, (u.presentDays / workingDays) * 100)
            : u.presentDays > 0
              ? 100
              : 0;
        const workHoursScore = Math.min(100, (u.avgWorkHours / 8) * 100);
        const attendanceScore =
          workingDays > 0 || u.presentDays > 0
            ? attendanceRate * 0.6 + workHoursScore * 0.4
            : 0;

        // R&P score (0-100): normalized net balance
        const rpScore = ((u.rpNet - minNet) / netRange) * 100;

        // Overall: 40% tasks + 30% attendance + 30% R&P
        const overallScore = Math.round(
          taskScore * 0.4 + attendanceScore * 0.3 + rpScore * 0.3,
        );

        return {
          ...u,
          taskScore: Math.round(taskScore),
          attendanceRate: Math.round(attendanceRate),
          attendanceScore: Math.round(attendanceScore),
          rpScore: Math.round(rpScore),
          overallScore: Math.min(100, Math.max(0, overallScore)),
        };
      })
      .sort((a, b) => b.overallScore - a.overallScore);

    // Summary totals
    const totalRewards = rp
      .filter((r) => r.amount > 0)
      .reduce((s, r) => s + r.amount, 0);
    const totalPunishments = rp
      .filter((r) => r.amount < 0)
      .reduce((s, r) => s + r.amount, 0);
    const avgAttendanceRate =
      scored.length > 0
        ? Math.round(
            scored.reduce((s, u) => s + u.attendanceRate, 0) / scored.length,
          )
        : 0;

    return {
      users: scored.map((u, i) => ({ ...u, rank: i + 1 })),
      summary: {
        totalPresentDays: attendance.length,
        totalRewards,
        totalPunishments,
        rpNet: totalRewards + totalPunishments,
        workingDays,
        avgAttendanceRate,
      },
    };
  },
});

// ────────────────────────────────────────────────
// Task completion trend over the last 6 report periods
// ────────────────────────────────────────────────

export const getCompletionTrend = query({
  args: {
    demoMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { effectiveDemoMode } = await resolveDemoAccess(ctx, args.demoMode);

    const rawTasks = await ctx.db.query("tasks").collect();
    const tasks = filterDemo(rawTasks, effectiveDemoMode);
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
