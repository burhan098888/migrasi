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
  allowedRoles: Array<"admin" | "manager" | "staff" | "pkl" | "rp_manager">,
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
 * Resolve demo-mode access based on authentication state.
 *
 * - Authenticated users → always live data (effectiveDemoMode = undefined).
 * - Unauthenticated + demoMode=true → demo data only (effectiveDemoMode = true).
 * - Unauthenticated without demoMode → throws UNAUTHENTICATED.
 *
 * This replaces both the auth check and demo-mode resolution in a single call.
 */
export async function resolveDemoAccess(
  ctx: QueryCtx | MutationCtx,
  requestedDemoMode?: boolean,
): Promise<{ isGuest: boolean; effectiveDemoMode: boolean | undefined }> {
  const identity = await ctx.auth.getUserIdentity();

  if (identity) {
    // Authenticated user → always live data, never demo
    return { isGuest: false, effectiveDemoMode: undefined };
  }

  if (requestedDemoMode === true) {
    // Unauthenticated guest viewing demo → demo data only
    return { isGuest: true, effectiveDemoMode: true };
  }

  // Not authenticated and not in demo mode → error
  throw new ConvexError({
    message: "User not logged in",
    code: "UNAUTHENTICATED",
  });
}
