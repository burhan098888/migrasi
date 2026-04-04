import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdminOrManager, filterDemo } from "./helpers.ts";

export const list = query({
  args: {
    demoMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }
    const allHolidays = await ctx.db.query("holidays").collect();
    return filterDemo(allHolidays, args.demoMode);
  },
});

export const create = mutation({
  args: {
    date: v.string(),
    eventName: v.string(),
    isDemo: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdminOrManager(ctx);
    return await ctx.db.insert("holidays", {
      date: args.date,
      eventName: args.eventName,
      isDemo: args.isDemo,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("holidays") },
  handler: async (ctx, args) => {
    await requireAdminOrManager(ctx);
    await ctx.db.delete(args.id);
  },
});
