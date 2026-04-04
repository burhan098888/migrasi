import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.union(
      v.literal("admin"),
      v.literal("manager"),
      v.literal("staff"),
    ),
    divisionId: v.optional(v.id("divisions")),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_role", ["role"]),

  divisions: defineTable({
    name: v.string(),
  }),

  projects: defineTable({
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    ownerId: v.id("users"),
    overallProgress: v.number(),
  }).index("by_owner", ["ownerId"]),

  tasks: defineTable({
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
  })
    .index("by_project", ["projectId"])
    .index("by_assignee", ["assigneeId"])
    .index("by_division", ["divisionId"])
    .index("by_status", ["status"]),

  holidays: defineTable({
    date: v.string(),
    eventName: v.string(),
  }),

  workLogs: defineTable({
    date: v.string(),
    picName: v.string(),
    category: v.string(),
    description: v.string(),
  })
    .index("by_date", ["date"])
    .index("by_picName", ["picName"])
    .index("by_category", ["category"]),

  attendance: defineTable({
    userId: v.id("users"),
    date: v.string(),
    checkInTime: v.string(),
    checkOutTime: v.optional(v.string()),
    checkInLat: v.number(),
    checkInLng: v.number(),
    checkOutLat: v.optional(v.number()),
    checkOutLng: v.optional(v.number()),
    status: v.union(v.literal("checked_in"), v.literal("checked_out")),
  })
    .index("by_user_and_date", ["userId", "date"])
    .index("by_date", ["date"]),
});
