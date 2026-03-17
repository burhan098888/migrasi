import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdminOrManager } from "./helpers.ts";

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
    return await ctx.db.query("holidays").collect();
  },
});

export const create = mutation({
  args: { date: v.string(), eventName: v.string() },
  handler: async (ctx, args) => {
    await requireAdminOrManager(ctx);
    return await ctx.db.insert("holidays", {
      date: args.date,
      eventName: args.eventName,
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
