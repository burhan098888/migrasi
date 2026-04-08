import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getCurrentUser } from "./helpers";

// ─── Queries ─────────────────────────────────────

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const calcs =
      user.role === "admin" || user.role === "manager"
        ? await ctx.db.query("adCalculations").collect()
        : await ctx.db
            .query("adCalculations")
            .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
            .collect();

    return Promise.all(
      calcs.map(async (calc) => {
        const [income, expenses] = await Promise.all([
          ctx.db
            .query("adIncomeEntries")
            .withIndex("by_calculation", (q) =>
              q.eq("calculationId", calc._id),
            )
            .collect(),
          ctx.db
            .query("adExpenseEntries")
            .withIndex("by_calculation", (q) =>
              q.eq("calculationId", calc._id),
            )
            .collect(),
        ]);

        const totalIncome = income.reduce((s, e) => s + e.amount, 0);
        const totalAdCost = expenses.reduce((s, e) => s + e.amount, 0);
        const totalPPN = Math.round(totalAdCost * (calc.ppnRate / 100));
        const totalPengeluaran = totalAdCost + totalPPN;

        return {
          ...calc,
          totalIncome,
          totalPengeluaran,
          balance: totalIncome - totalPengeluaran,
        };
      }),
    );
  },
});

export const getById = query({
  args: { id: v.id("adCalculations") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const calc = await ctx.db.get(args.id);
    if (!calc) {
      throw new ConvexError({
        message: "Calculation not found",
        code: "NOT_FOUND",
      });
    }

    const [incomeEntries, expenseEntries, resultEntries, recurringBills] =
      await Promise.all([
        ctx.db
          .query("adIncomeEntries")
          .withIndex("by_calculation", (q) =>
            q.eq("calculationId", args.id),
          )
          .collect(),
        ctx.db
          .query("adExpenseEntries")
          .withIndex("by_calculation", (q) =>
            q.eq("calculationId", args.id),
          )
          .collect(),
        ctx.db
          .query("adResultEntries")
          .withIndex("by_calculation", (q) =>
            q.eq("calculationId", args.id),
          )
          .collect(),
        ctx.db
          .query("adRecurringBills")
          .withIndex("by_calculation", (q) =>
            q.eq("calculationId", args.id),
          )
          .collect(),
      ]);

    return {
      ...calc,
      incomeEntries,
      expenseEntries,
      resultEntries,
      recurringBills,
    };
  },
});

/** Public query — no auth required so anyone with the link can view */
export const getByShareToken = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    const calc = await ctx.db
      .query("adCalculations")
      .withIndex("by_share_token", (q) =>
        q.eq("shareToken", args.shareToken),
      )
      .unique();

    if (!calc) {
      throw new ConvexError({
        message: "Calculation not found",
        code: "NOT_FOUND",
      });
    }

    const [incomeEntries, expenseEntries, resultEntries, recurringBills] =
      await Promise.all([
        ctx.db
          .query("adIncomeEntries")
          .withIndex("by_calculation", (q) =>
            q.eq("calculationId", calc._id),
          )
          .collect(),
        ctx.db
          .query("adExpenseEntries")
          .withIndex("by_calculation", (q) =>
            q.eq("calculationId", calc._id),
          )
          .collect(),
        ctx.db
          .query("adResultEntries")
          .withIndex("by_calculation", (q) =>
            q.eq("calculationId", calc._id),
          )
          .collect(),
        ctx.db
          .query("adRecurringBills")
          .withIndex("by_calculation", (q) =>
            q.eq("calculationId", calc._id),
          )
          .collect(),
      ]);

    return {
      ...calc,
      incomeEntries,
      expenseEntries,
      resultEntries,
      recurringBills,
    };
  },
});

// ─── Calculation CRUD ────────────────────────────

export const create = mutation({
  args: { name: v.string(), ppnRate: v.number() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const shareToken = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    return await ctx.db.insert("adCalculations", {
      name: args.name,
      createdBy: user._id,
      shareToken,
      ppnRate: args.ppnRate,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("adCalculations"),
    name: v.string(),
    ppnRate: v.number(),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    await ctx.db.patch(args.id, {
      name: args.name,
      ppnRate: args.ppnRate,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("adCalculations") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const [incomeEntries, expenseEntries, resultEntries, recurringBills] =
      await Promise.all([
        ctx.db
          .query("adIncomeEntries")
          .withIndex("by_calculation", (q) =>
            q.eq("calculationId", args.id),
          )
          .collect(),
        ctx.db
          .query("adExpenseEntries")
          .withIndex("by_calculation", (q) =>
            q.eq("calculationId", args.id),
          )
          .collect(),
        ctx.db
          .query("adResultEntries")
          .withIndex("by_calculation", (q) =>
            q.eq("calculationId", args.id),
          )
          .collect(),
        ctx.db
          .query("adRecurringBills")
          .withIndex("by_calculation", (q) =>
            q.eq("calculationId", args.id),
          )
          .collect(),
      ]);

    for (const entry of [
      ...incomeEntries,
      ...expenseEntries,
      ...resultEntries,
      ...recurringBills,
    ]) {
      await ctx.db.delete(entry._id);
    }
    await ctx.db.delete(args.id);
  },
});

// ─── Income Entry CRUD ───────────────────────────

export const addIncome = mutation({
  args: {
    calculationId: v.id("adCalculations"),
    date: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    return await ctx.db.insert("adIncomeEntries", {
      calculationId: args.calculationId,
      date: args.date,
      amount: args.amount,
    });
  },
});

export const updateIncome = mutation({
  args: {
    id: v.id("adIncomeEntries"),
    date: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    await ctx.db.patch(args.id, { date: args.date, amount: args.amount });
  },
});

export const removeIncome = mutation({
  args: { id: v.id("adIncomeEntries") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    await ctx.db.delete(args.id);
  },
});

// ─── Expense Entry CRUD ──────────────────────────

export const addExpense = mutation({
  args: {
    calculationId: v.id("adCalculations"),
    description: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    return await ctx.db.insert("adExpenseEntries", {
      calculationId: args.calculationId,
      description: args.description,
      amount: args.amount,
    });
  },
});

export const updateExpense = mutation({
  args: {
    id: v.id("adExpenseEntries"),
    description: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    await ctx.db.patch(args.id, {
      description: args.description,
      amount: args.amount,
    });
  },
});

export const removeExpense = mutation({
  args: { id: v.id("adExpenseEntries") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    await ctx.db.delete(args.id);
  },
});

// ─── Result Entry CRUD ───────────────────────────

export const addResult = mutation({
  args: {
    calculationId: v.id("adCalculations"),
    label: v.string(),
    value: v.number(),
    isMonetary: v.boolean(),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    return await ctx.db.insert("adResultEntries", {
      calculationId: args.calculationId,
      label: args.label,
      value: args.value,
      isMonetary: args.isMonetary,
    });
  },
});

export const updateResult = mutation({
  args: {
    id: v.id("adResultEntries"),
    label: v.string(),
    value: v.number(),
    isMonetary: v.boolean(),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    await ctx.db.patch(args.id, {
      label: args.label,
      value: args.value,
      isMonetary: args.isMonetary,
    });
  },
});

export const removeResult = mutation({
  args: { id: v.id("adResultEntries") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    await ctx.db.delete(args.id);
  },
});
