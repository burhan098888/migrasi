import { ConvexError } from "convex/values";
import { query } from "./_generated/server";

export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const [tasks, projects, divisions, users] = await Promise.all([
      ctx.db.query("tasks").collect(),
      ctx.db.query("projects").collect(),
      ctx.db.query("divisions").collect(),
      ctx.db.query("users").collect(),
    ]);

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
