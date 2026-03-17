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
    return await ctx.db.query("divisions").collect();
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await requireAdminOrManager(ctx);
    return await ctx.db.insert("divisions", { name: args.name });
  },
});

export const update = mutation({
  args: { id: v.id("divisions"), name: v.string() },
  handler: async (ctx, args) => {
    await requireAdminOrManager(ctx);
    await ctx.db.patch(args.id, { name: args.name });
  },
});

export const remove = mutation({
  args: { id: v.id("divisions") },
  handler: async (ctx, args) => {
    await requireAdminOrManager(ctx);
    await ctx.db.delete(args.id);
  },
});
