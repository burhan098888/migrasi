import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireRole } from "./helpers";

// Helper: require admin or admin_iklan
async function requireAdProfit(ctx: Parameters<typeof requireRole>[0]) {
  return requireRole(ctx, ["admin", "admin_iklan"]);
}

// ── Campaigns ──

export const listCampaigns = query({
  args: {},
  handler: async (ctx) => {
    await requireAdProfit(ctx);
    return await ctx.db.query("adProfitCampaigns").order("desc").collect();
  },
});

export const getCampaign = query({
  args: { id: v.id("adProfitCampaigns") },
  handler: async (ctx, args) => {
    await requireAdProfit(ctx);
    return await ctx.db.get(args.id);
  },
});

export const createCampaign = mutation({
  args: { name: v.string(), ppnRate: v.number() },
  handler: async (ctx, args) => {
    const user = await requireAdProfit(ctx);
    return await ctx.db.insert("adProfitCampaigns", {
      name: args.name,
      ppnRate: args.ppnRate,
      createdBy: user._id,
    });
  },
});

export const updateCampaign = mutation({
  args: { id: v.id("adProfitCampaigns"), name: v.string(), ppnRate: v.number() },
  handler: async (ctx, args) => {
    await requireAdProfit(ctx);
    await ctx.db.patch(args.id, { name: args.name, ppnRate: args.ppnRate });
  },
});

export const deleteCampaign = mutation({
  args: { id: v.id("adProfitCampaigns") },
  handler: async (ctx, args) => {
    await requireAdProfit(ctx);
    // Delete all entries for this campaign
    const entries = await ctx.db
      .query("adProfitEntries")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.id))
      .collect();
    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }
    await ctx.db.delete(args.id);
  },
});

// ── Entries ──

export const listEntries = query({
  args: { campaignId: v.id("adProfitCampaigns") },
  handler: async (ctx, args) => {
    await requireAdProfit(ctx);
    return await ctx.db
      .query("adProfitEntries")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .order("desc")
      .collect();
  },
});

export const createEntry = mutation({
  args: {
    campaignId: v.id("adProfitCampaigns"),
    date: v.string(),
    adSpend: v.number(),
    leads: v.number(),
    donation: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdProfit(ctx);
    return await ctx.db.insert("adProfitEntries", args);
  },
});

export const updateEntry = mutation({
  args: {
    id: v.id("adProfitEntries"),
    date: v.string(),
    adSpend: v.number(),
    leads: v.number(),
    donation: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdProfit(ctx);
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const deleteEntry = mutation({
  args: { id: v.id("adProfitEntries") },
  handler: async (ctx, args) => {
    await requireAdProfit(ctx);
    await ctx.db.delete(args.id);
  },
});

// ── Daily profit report ──

export const getDailyReport = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    await requireAdProfit(ctx);
    const campaigns = await ctx.db.query("adProfitCampaigns").collect();

    const results = [];
    let totalProfit = 0;

    for (const campaign of campaigns) {
      const entries = await ctx.db
        .query("adProfitEntries")
        .withIndex("by_campaign_and_date", (q) =>
          q.eq("campaignId", campaign._id).eq("date", args.date),
        )
        .collect();

      const totalAdSpend = entries.reduce((s, e) => s + e.adSpend, 0);
      const totalLeads = entries.reduce((s, e) => s + e.leads, 0);
      const totalDonation = entries.reduce((s, e) => s + e.donation, 0);
      const biayaPpn = totalAdSpend * (1 + campaign.ppnRate / 100);
      const profit = totalDonation - biayaPpn;

      totalProfit += profit;

      results.push({
        campaignId: campaign._id,
        campaignName: campaign.name,
        leads: totalLeads,
        adSpend: totalAdSpend,
        biayaPpn,
        donation: totalDonation,
        profit,
      });
    }

    return { campaigns: results, totalProfit, date: args.date };
  },
});

// ── Period summary (for MAKSIMAL line) ──

export const getPeriodSummary = query({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, args) => {
    await requireAdProfit(ctx);
    const campaigns = await ctx.db.query("adProfitCampaigns").collect();

    let grandTotal = 0;

    for (const campaign of campaigns) {
      const entries = await ctx.db
        .query("adProfitEntries")
        .withIndex("by_campaign", (q) => q.eq("campaignId", campaign._id))
        .collect();

      const periodEntries = entries.filter(
        (e) => e.date >= args.startDate && e.date <= args.endDate,
      );

      const totalAdSpend = periodEntries.reduce((s, e) => s + e.adSpend, 0);
      const totalDonation = periodEntries.reduce((s, e) => s + e.donation, 0);
      const biayaPpn = totalAdSpend * (1 + campaign.ppnRate / 100);
      grandTotal += totalDonation - biayaPpn;
    }

    return { total: grandTotal, startDate: args.startDate, endDate: args.endDate };
  },
});
