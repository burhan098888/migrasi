import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getCurrentUser } from "./helpers";

// ── Wallets ──

export const listWallets = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db
      .query("financeWallets")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .collect();
  },
});

export const createWallet = mutation({
  args: { name: v.string(), initialBalance: v.number() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db.insert("financeWallets", {
      name: args.name,
      initialBalance: args.initialBalance,
      createdBy: user._id,
    });
  },
});

export const updateWallet = mutation({
  args: { id: v.id("financeWallets"), name: v.string(), initialBalance: v.number() },
  handler: async (ctx, args) => {
    const wallet = await ctx.db.get(args.id);
    if (!wallet) throw new ConvexError({ message: "Wallet not found", code: "NOT_FOUND" });
    await ctx.db.patch(args.id, { name: args.name, initialBalance: args.initialBalance });
  },
});

export const deleteWallet = mutation({
  args: { id: v.id("financeWallets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ── Categories ──

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db
      .query("financeCategories")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .collect();
  },
});

export const createCategory = mutation({
  args: { name: v.string(), type: v.union(v.literal("income"), v.literal("expense")) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db.insert("financeCategories", {
      name: args.name,
      type: args.type,
      createdBy: user._id,
    });
  },
});

export const updateCategory = mutation({
  args: { id: v.id("financeCategories"), name: v.string(), type: v.union(v.literal("income"), v.literal("expense")) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { name: args.name, type: args.type });
  },
});

export const deleteCategory = mutation({
  args: { id: v.id("financeCategories") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ── Transactions ──

export const listTransactions = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db
      .query("financeTransactions")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .order("desc")
      .collect();
  },
});

export const createTransaction = mutation({
  args: {
    type: v.union(v.literal("income"), v.literal("expense"), v.literal("transfer")),
    amount: v.number(),
    date: v.string(),
    description: v.optional(v.string()),
    walletId: v.id("financeWallets"),
    toWalletId: v.optional(v.id("financeWallets")),
    categoryId: v.optional(v.id("financeCategories")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db.insert("financeTransactions", {
      ...args,
      createdBy: user._id,
    });
  },
});

export const updateTransaction = mutation({
  args: {
    id: v.id("financeTransactions"),
    type: v.union(v.literal("income"), v.literal("expense"), v.literal("transfer")),
    amount: v.number(),
    date: v.string(),
    description: v.optional(v.string()),
    walletId: v.id("financeWallets"),
    toWalletId: v.optional(v.id("financeWallets")),
    categoryId: v.optional(v.id("financeCategories")),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const deleteTransaction = mutation({
  args: { id: v.id("financeTransactions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ── Dashboard summary ──

export const getDashboardSummary = query({
  args: { month: v.string() }, // "2026-04" format
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const transactions = await ctx.db
      .query("financeTransactions")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .collect();

    const wallets = await ctx.db
      .query("financeWallets")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .collect();

    // Filter by month
    const monthTxns = transactions.filter((t) => t.date.startsWith(args.month));
    const totalIncome = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    // Calculate wallet balances (all-time)
    const walletBalances = wallets.map((w) => {
      const txns = transactions.filter((t) => t.walletId === w._id);
      let balance = w.initialBalance;
      for (const t of txns) {
        if (t.type === "income") balance += t.amount;
        else if (t.type === "expense") balance -= t.amount;
        else if (t.type === "transfer") balance -= t.amount;
      }
      // Incoming transfers
      const incomingTransfers = transactions.filter((t) => t.type === "transfer" && t.toWalletId === w._id);
      for (const t of incomingTransfers) {
        balance += t.amount;
      }
      return { walletId: w._id, walletName: w.name, balance };
    });

    const totalBalance = walletBalances.reduce((s, w) => s + w.balance, 0);

    // Recent transactions (last 5)
    const recent = transactions
      .sort((a, b) => b.date.localeCompare(a.date) || b._creationTime - a._creationTime)
      .slice(0, 5);

    return {
      totalBalance,
      totalIncome,
      totalExpense,
      walletBalances,
      recentTransactions: recent,
    };
  },
});
