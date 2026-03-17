import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdminOrManager, getCurrentUser } from "./helpers.ts";
import { api } from "./_generated/api.js";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }
    const tasks = await ctx.db.query("tasks").collect();
    return await Promise.all(
      tasks.map(async (task) => {
        const assignee = await ctx.db.get(task.assigneeId);
        const project = await ctx.db.get(task.projectId);
        const division = task.divisionId
          ? await ctx.db.get(task.divisionId)
          : null;
        return {
          ...task,
          assigneeName: assignee?.name ?? "Unknown",
          projectName: project?.name ?? "Unknown",
          divisionName: division?.name ?? null,
        };
      }),
    );
  },
});

export const listByAssignee = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", user._id))
      .collect();
    return await Promise.all(
      tasks.map(async (task) => {
        const project = await ctx.db.get(task.projectId);
        const division = task.divisionId
          ? await ctx.db.get(task.divisionId)
          : null;
        return {
          ...task,
          projectName: project?.name ?? "Unknown",
          divisionName: division?.name ?? null,
        };
      }),
    );
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    projectId: v.id("projects"),
    divisionId: v.optional(v.id("divisions")),
    assigneeId: v.id("users"),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
    ),
    deadline: v.string(),
    budgetAllocated: v.number(),
    budgetRealized: v.number(),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("complete"),
      v.literal("overdue"),
    ),
    progressPercentage: v.number(),
    notes: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    await requireAdminOrManager(ctx);
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      projectId: args.projectId,
      divisionId: args.divisionId,
      assigneeId: args.assigneeId,
      priority: args.priority,
      deadline: args.deadline,
      budgetAllocated: args.budgetAllocated,
      budgetRealized: args.budgetRealized,
      status: args.status,
      progressPercentage: args.progressPercentage,
      notes: args.notes,
    });
    // Recalculate project progress
    await ctx.runMutation(api.projects.recalculateProgress, {
      projectId: args.projectId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    divisionId: v.optional(v.id("divisions")),
    assigneeId: v.optional(v.id("users")),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ),
    deadline: v.optional(v.string()),
    budgetAllocated: v.optional(v.number()),
    budgetRealized: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("not_started"),
        v.literal("in_progress"),
        v.literal("complete"),
        v.literal("overdue"),
      ),
    ),
    progressPercentage: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<void> => {
    await requireAdminOrManager(ctx);
    const { id, ...updates } = args;
    const task = await ctx.db.get(id);
    if (!task) {
      throw new ConvexError({ message: "Task not found", code: "NOT_FOUND" });
    }
    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) cleanUpdates[key] = value;
    }
    await ctx.db.patch(id, cleanUpdates);

    // Recalculate project progress
    const projectId = updates.projectId ?? task.projectId;
    await ctx.runMutation(api.projects.recalculateProgress, { projectId });

    // If the project changed, also recalculate the old project
    if (updates.projectId && updates.projectId !== task.projectId) {
      await ctx.runMutation(api.projects.recalculateProgress, {
        projectId: task.projectId,
      });
    }
  },
});

// Staff can only update progress and notes (status is admin/manager only)
export const updateMyTask = mutation({
  args: {
    id: v.id("tasks"),
    progressPercentage: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<void> => {
    const user = await getCurrentUser(ctx);
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new ConvexError({ message: "Task not found", code: "NOT_FOUND" });
    }
    if (task.assigneeId !== user._id) {
      throw new ConvexError({
        message: "You can only update your own tasks",
        code: "FORBIDDEN",
      });
    }
    const cleanUpdates: Record<string, unknown> = {};
    if (args.progressPercentage !== undefined)
      cleanUpdates.progressPercentage = args.progressPercentage;
    if (args.notes !== undefined) cleanUpdates.notes = args.notes;

    await ctx.db.patch(args.id, cleanUpdates);

    // Recalculate project progress
    await ctx.runMutation(api.projects.recalculateProgress, {
      projectId: task.projectId,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args): Promise<void> => {
    await requireAdminOrManager(ctx);
    const task = await ctx.db.get(args.id);
    if (!task) return;
    await ctx.db.delete(args.id);
    // Recalculate project progress
    await ctx.runMutation(api.projects.recalculateProgress, {
      projectId: task.projectId,
    });
  },
});

// Auto-update overdue tasks — called from frontend periodically
export const markOverdueTasks = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const now = new Date().toISOString();
    const tasks = await ctx.db.query("tasks").collect();

    const projectsToRecalc = new Set<string>();
    for (const task of tasks) {
      if (
        task.deadline < now &&
        task.progressPercentage < 100 &&
        task.status !== "overdue" &&
        task.status !== "complete"
      ) {
        await ctx.db.patch(task._id, { status: "overdue" });
        projectsToRecalc.add(task.projectId);
      }
    }
  },
});
