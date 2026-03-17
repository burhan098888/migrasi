import { api } from "@/convex/_generated/api.js";
import { useQuery } from "convex/react";

export function useUserRole() {
  const user = useQuery(api.users.getCurrentUser);

  return {
    user,
    isAdmin: user?.role === "admin",
    isManager: user?.role === "manager",
    isStaff: user?.role === "staff",
    isAdminOrManager: user?.role === "admin" || user?.role === "manager",
    hasRole: (roles: Array<"admin" | "manager" | "staff">) => {
      return user ? roles.includes(user.role) : false;
    },
  };
}
