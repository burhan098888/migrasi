import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }
    return await ctx.db
      .query("workLogs")
      .withIndex("by_date")
      .order("desc")
      .collect();
  },
});

export const getByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }
    return await ctx.db
      .query("workLogs")
      .withIndex("by_date", (q) =>
        q.gte("date", args.startDate).lte("date", args.endDate),
      )
      .order("desc")
      .collect();
  },
});

export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }
    const allLogs = await ctx.db.query("workLogs").collect();

    // Group by PIC name
    const byPic: Record<string, number> = {};
    // Group by category
    const byCategory: Record<string, number> = {};
    // Group by date
    const byDate: Record<string, number> = {};

    for (const log of allLogs) {
      byPic[log.picName] = (byPic[log.picName] ?? 0) + 1;
      byCategory[log.category] = (byCategory[log.category] ?? 0) + 1;
      byDate[log.date] = (byDate[log.date] ?? 0) + 1;
    }

    return {
      totalLogs: allLogs.length,
      byPic,
      byCategory,
      byDate,
    };
  },
});

export const create = mutation({
  args: {
    date: v.string(),
    picName: v.string(),
    category: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      throw new ConvexError({
        message: "Only admins and managers can create work logs",
        code: "FORBIDDEN",
      });
    }

    return await ctx.db.insert("workLogs", {
      date: args.date,
      picName: args.picName,
      category: args.category,
      description: args.description,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("workLogs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      throw new ConvexError({
        message: "Only admins and managers can delete work logs",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.delete(args.id);
  },
});

export const clearAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allLogs = await ctx.db.query("workLogs").collect();
    for (const log of allLogs) {
      await ctx.db.delete(log._id);
    }
    return { deleted: allLogs.length };
  },
});
