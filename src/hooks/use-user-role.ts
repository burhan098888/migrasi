import { api } from "@/convex/_generated/api.js";
import { useQuery } from "convex/react";
import { useAuth } from "@/hooks/use-auth.ts";

export function useUserRole() {
  const { user: authUser } = useAuth();
  const isAuthenticated = !!authUser;

  // Skip the backend query when not authenticated to avoid UNAUTHENTICATED errors
  const user = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");

  return {
    user,
    isAuthenticated,
    isAdmin: user?.role === "admin",
    isManager: user?.role === "manager",
    isStaff: user?.role === "staff",
    isPkl: user?.role === "pkl",
    isRpManager: user?.role === "rp_manager",
    isAdminOrManager: user?.role === "admin" || user?.role === "manager",
    /** Whether the user can add/edit Reward & Punishment records */
    canManageRP:
      user?.role === "admin" ||
      user?.role === "manager" ||
      user?.role === "rp_manager",
    /** Whether the user can view the Task Manager (read-only for rp_manager) */
    canViewTasks:
      user?.role === "admin" ||
      user?.role === "manager" ||
      user?.role === "rp_manager",
    /** Whether the user can view attendance admin tabs (read-only for rp_manager) */
    canViewAttendanceAdmin:
      user?.role === "admin" ||
      user?.role === "manager" ||
      user?.role === "rp_manager",
    hasRole: (roles: Array<"admin" | "manager" | "staff" | "pkl" | "rp_manager">) => {
      return user ? roles.includes(user.role) : false;
    },
  };
}
