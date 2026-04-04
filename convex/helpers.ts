import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      message: "User not logged in",
      code: "UNAUTHENTICATED",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new ConvexError({
      message: "User not found",
      code: "NOT_FOUND",
    });
  }

  return user;
}

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: Array<"admin" | "manager" | "staff">,
) {
  const user = await getCurrentUser(ctx);

  if (!allowedRoles.includes(user.role)) {
    throw new ConvexError({
      message: "Insufficient permissions",
      code: "FORBIDDEN",
    });
  }

  return user;
}

export async function requireAdminOrManager(ctx: QueryCtx | MutationCtx) {
  return requireRole(ctx, ["admin", "manager"]);
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  return requireRole(ctx, ["admin"]);
}

/**
 * Filter records by demo mode.
 * - demoMode true  → only demo records
 * - demoMode false/undefined → only live records (isDemo !== true)
 */
export function filterDemo<T extends { isDemo?: boolean }>(
  records: T[],
  demoMode?: boolean,
): T[] {
  if (demoMode === true) return records.filter((r) => r.isDemo === true);
  return records.filter((r) => r.isDemo !== true);
}

/**
 * Resolve the effective demo mode based on the current user's role.
 * Staff users are always forced into demo mode — they cannot access live data.
 * Admin/manager users use whatever mode was requested.
 */
export async function resolveDemoMode(
  ctx: QueryCtx | MutationCtx,
  requestedDemoMode?: boolean,
): Promise<boolean | undefined> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return requestedDemoMode;

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  // Staff users are always forced into demo mode
  if (user?.role === "staff") return true;

  return requestedDemoMode;
}
