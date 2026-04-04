import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, filterDemo, resolveDemoMode } from "./helpers.ts";

/** Check in the current user with geolocation */
export const checkIn = mutation({
  args: {
    lat: v.number(),
    lng: v.number(),
    isDemo: v.optional(v.boolean()),
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
      isDemo: args.isDemo,
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
  args: {
    date: v.string(),
    demoMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const allRecords = await ctx.db
      .query("attendance")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();

    const effectiveDemoMode = await resolveDemoMode(ctx, args.demoMode);
    const records = filterDemo(allRecords, effectiveDemoMode);

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

/** Get the current user's attendance history */
export const getMyHistory = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    demoMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const effectiveDemoMode = user.role === "staff" ? true : args.demoMode;

    const allRecords = await ctx.db
      .query("attendance")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).gte("date", args.startDate).lte("date", args.endDate),
      )
      .order("desc")
      .collect();

    return filterDemo(allRecords, effectiveDemoMode);
  },
});

/** Get attendance summary stats for admin/manager dashboard */
export const getStats = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    demoMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    // Get all records in the date range
    const allRecords = await ctx.db
      .query("attendance")
      .withIndex("by_date", (q) =>
        q.gte("date", args.startDate).lte("date", args.endDate),
      )
      .collect();

    const effectiveDemoMode = await resolveDemoMode(ctx, args.demoMode);
    const records = filterDemo(allRecords, effectiveDemoMode);

    const totalRecords = records.length;
    const completedRecords = records.filter((r) => r.status === "checked_out");

    // Calculate average work hours for completed records
    let totalMinutes = 0;
    for (const record of completedRecords) {
      if (record.checkOutTime) {
        const checkIn = new Date(record.checkInTime).getTime();
        const checkOut = new Date(record.checkOutTime).getTime();
        totalMinutes += (checkOut - checkIn) / 60000;
      }
    }
    const avgMinutes =
      completedRecords.length > 0
        ? Math.round(totalMinutes / completedRecords.length)
        : 0;

    // Count unique users who checked in
    const uniqueUserIds = new Set(records.map((r) => r.userId));

    // Build per-user summary
    const allUsers = await ctx.db.query("users").collect();
    const userSummaries = await Promise.all(
      allUsers.map(async (user) => {
        const userRecords = records.filter(
          (r) => r.userId === user._id,
        );
        const userCompleted = userRecords.filter(
          (r) => r.status === "checked_out",
        );
        let userTotalMinutes = 0;
        for (const r of userCompleted) {
          if (r.checkOutTime) {
            const ci = new Date(r.checkInTime).getTime();
            const co = new Date(r.checkOutTime).getTime();
            userTotalMinutes += (co - ci) / 60000;
          }
        }
        return {
          userId: user._id,
          userName: user.name ?? "Unknown",
          totalDays: userRecords.length,
          completedDays: userCompleted.length,
          totalMinutes: Math.round(userTotalMinutes),
          avgMinutes:
            userCompleted.length > 0
              ? Math.round(userTotalMinutes / userCompleted.length)
              : 0,
        };
      }),
    );

    return {
      totalRecords,
      completedRecords: completedRecords.length,
      avgMinutes,
      uniqueUsers: uniqueUserIds.size,
      totalUsers: allUsers.length,
      userSummaries: userSummaries
        .filter((u) => u.totalDays > 0)
        .sort((a, b) => b.totalDays - a.totalDays),
    };
  },
});
