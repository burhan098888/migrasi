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
      v.literal("pkl"),
      v.literal("rp_manager"),
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
    isDemo: v.optional(v.boolean()),
  })
    .index("by_project", ["projectId"])
    .index("by_assignee", ["assigneeId"])
    .index("by_division", ["divisionId"])
    .index("by_status", ["status"]),

  holidays: defineTable({
    date: v.string(),
    eventName: v.string(),
    isDemo: v.optional(v.boolean()),
  }),

  workLogs: defineTable({
    date: v.string(),
    picName: v.string(),
    category: v.string(),
    description: v.string(),
    isDemo: v.optional(v.boolean()),
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
    isDemo: v.optional(v.boolean()),
  })
    .index("by_user_and_date", ["userId", "date"])
    .index("by_date", ["date"]),

  rewardPunishments: defineTable({
    userId: v.id("users"),
    amount: v.number(), // negative = punishment, positive = reward (tabungan akhirat)
    description: v.string(),
    date: v.string(), // ISO date string
    taskId: v.optional(v.id("tasks")),
    isDemo: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["date"]),

  adCalculations: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
    shareToken: v.string(),
    ppnRate: v.number(),
  })
    .index("by_creator", ["createdBy"])
    .index("by_share_token", ["shareToken"]),

  adIncomeEntries: defineTable({
    calculationId: v.id("adCalculations"),
    date: v.string(),
    amount: v.number(),
  }).index("by_calculation", ["calculationId"]),

  adExpenseEntries: defineTable({
    calculationId: v.id("adCalculations"),
    description: v.string(),
    amount: v.number(),
  }).index("by_calculation", ["calculationId"]),

  adResultEntries: defineTable({
    calculationId: v.id("adCalculations"),
    label: v.string(),
    value: v.number(),
    isMonetary: v.boolean(),
  }).index("by_calculation", ["calculationId"]),

  adRecurringBills: defineTable({
    calculationId: v.id("adCalculations"),
    description: v.string(),
    amount: v.number(),
    dayOfMonth: v.number(),
    isActive: v.boolean(),
  }).index("by_calculation", ["calculationId"]),
});
