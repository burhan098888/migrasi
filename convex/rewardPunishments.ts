import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdminOrManager, filterDemo, resolveDemoAccess } from "./helpers.ts";

export const list = query({
  args: {
    demoMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { effectiveDemoMode } = await resolveDemoAccess(ctx, args.demoMode);
    const all = await ctx.db.query("rewardPunishments").collect();
    const records = filterDemo(all, effectiveDemoMode);

    return await Promise.all(
      records.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        const task = r.taskId ? await ctx.db.get(r.taskId) : null;
        return {
          ...r,
          userName: user?.name ?? "Unknown",
          taskTitle: task?.title ?? null,
        };
      }),
    );
  },
});

/** Per-user summary: total rewards, total punishments, net balance */
export const summary = query({
  args: {
    demoMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { effectiveDemoMode } = await resolveDemoAccess(ctx, args.demoMode);
    const all = await ctx.db.query("rewardPunishments").collect();
    const records = filterDemo(all, effectiveDemoMode);

    // Group by userId
    const byUser: Record<string, { rewards: number; punishments: number; count: number }> = {};
    for (const r of records) {
      if (!byUser[r.userId]) {
        byUser[r.userId] = { rewards: 0, punishments: 0, count: 0 };
      }
      byUser[r.userId].count += 1;
      if (r.amount < 0) {
        byUser[r.userId].punishments += r.amount;
      } else {
        byUser[r.userId].rewards += r.amount;
      }
    }

    // Resolve user names
    const summaries = await Promise.all(
      Object.entries(byUser).map(async ([userId, data]) => {
        const user = await ctx.db.get(userId as typeof records[number]["userId"]);
        return {
          userId,
          userName: user?.name ?? "Unknown",
          rewards: data.rewards,
          punishments: data.punishments,
          net: data.rewards + data.punishments,
          count: data.count,
        };
      }),
    );

    // Sort by net balance descending
    return summaries.sort((a, b) => b.net - a.net);
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    description: v.string(),
    date: v.string(),
    taskId: v.optional(v.id("tasks")),
    isDemo: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<void> => {
    await requireAdminOrManager(ctx);
    await ctx.db.insert("rewardPunishments", {
      userId: args.userId,
      amount: args.amount,
      description: args.description,
      date: args.date,
      taskId: args.taskId,
      isDemo: args.isDemo,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("rewardPunishments"),
    amount: v.optional(v.number()),
    description: v.optional(v.string()),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<void> => {
    await requireAdminOrManager(ctx);
    const record = await ctx.db.get(args.id);
    if (!record) {
      throw new ConvexError({ message: "Record not found", code: "NOT_FOUND" });
    }
    const updates: Record<string, unknown> = {};
    if (args.amount !== undefined) updates.amount = args.amount;
    if (args.description !== undefined) updates.description = args.description;
    if (args.date !== undefined) updates.date = args.date;
    await ctx.db.patch(args.id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("rewardPunishments") },
  handler: async (ctx, args): Promise<void> => {
    await requireAdminOrManager(ctx);
    await ctx.db.delete(args.id);
  },
});
