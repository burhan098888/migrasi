import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./helpers.ts";

/** Check in the current user with geolocation */
export const checkIn = mutation({
  args: {
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const now = new Date();
    const todayDate = now.toISOString().split("T")[0];

    // Check if already checked in today
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).eq("date", todayDate),
      )
      .first();

    if (existing && existing.status === "checked_in") {
      throw new ConvexError({
        message: "You are already checked in today",
        code: "CONFLICT",
      });
    }

    if (existing && existing.status === "checked_out") {
      throw new ConvexError({
        message: "You have already completed attendance for today",
        code: "CONFLICT",
      });
    }

    await ctx.db.insert("attendance", {
      userId: user._id,
      date: todayDate,
      checkInTime: now.toISOString(),
      checkInLat: args.lat,
      checkInLng: args.lng,
      status: "checked_in",
    });
  },
});

/** Check out the current user with geolocation */
export const checkOut = mutation({
  args: {
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const now = new Date();
    const todayDate = now.toISOString().split("T")[0];

    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).eq("date", todayDate),
      )
      .first();

    if (!existing) {
      throw new ConvexError({
        message: "You have not checked in today",
        code: "BAD_REQUEST",
      });
    }

    if (existing.status === "checked_out") {
      throw new ConvexError({
        message: "You have already checked out today",
        code: "CONFLICT",
      });
    }

    await ctx.db.patch(existing._id, {
      checkOutTime: now.toISOString(),
      checkOutLat: args.lat,
      checkOutLng: args.lng,
      status: "checked_out",
    });
  },
});

/** Get the current user's attendance for today */
export const getTodayStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const todayDate = new Date().toISOString().split("T")[0];

    const record = await ctx.db
      .query("attendance")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).eq("date", todayDate),
      )
      .first();

    return record;
  },
});

/** Get all attendance records for a specific date (admin/manager view) */
export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const records = await ctx.db
      .query("attendance")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();

    // Enrich with user data
    const enriched = await Promise.all(
      records.map(async (record) => {
        const user = await ctx.db.get(record.userId);
        return {
          ...record,
          userName: user?.name ?? "Unknown",
          userEmail: user?.email ?? "",
        };
      }),
    );

    return enriched;
  },
});
