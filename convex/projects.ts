import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdminOrManager, getCurrentUser } from "./helpers.ts";

export const list = query({
  args: { demoMode: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity && !args.demoMode) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }
    const projects = await ctx.db.query("projects").collect();
    // Enrich with owner info
    return await Promise.all(
      projects.map(async (project) => {
        const owner = await ctx.db.get(project.ownerId);
        return { ...project, ownerName: owner?.name ?? "Unknown" };
      }),
    );
  },
});

export const getById = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }
    const project = await ctx.db.get(args.id);
    if (!project) return null;
    const owner = await ctx.db.get(project.ownerId);
    return { ...project, ownerName: owner?.name ?? "Unknown" };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdminOrManager(ctx);
    return await ctx.db.insert("projects", {
      name: args.name,
      startDate: args.startDate,
      endDate: args.endDate,
      ownerId: args.ownerId,
      overallProgress: 0,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await requireAdminOrManager(ctx);
    const { id, ...updates } = args;
    const cleanUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) cleanUpdates.name = updates.name;
    if (updates.startDate !== undefined) cleanUpdates.startDate = updates.startDate;
    if (updates.endDate !== undefined) cleanUpdates.endDate = updates.endDate;
    if (updates.ownerId !== undefined) cleanUpdates.ownerId = updates.ownerId;
    await ctx.db.patch(id, cleanUpdates);
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    await requireAdminOrManager(ctx);
    // Delete all tasks for this project
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }
    await ctx.db.delete(args.id);
  },
});

// Recalculate overall progress from task averages
export const recalculateProgress = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args): Promise<void> => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    if (tasks.length === 0) {
      await ctx.db.patch(args.projectId, { overallProgress: 0 });
      return;
    }
    const avg =
      tasks.reduce((sum, t) => sum + t.progressPercentage, 0) / tasks.length;
    await ctx.db.patch(args.projectId, {
      overallProgress: Math.round(avg),
    });
  },
});
