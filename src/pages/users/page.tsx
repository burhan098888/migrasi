import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useUserRole } from "@/hooks/use-user-role.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Shield, ShieldAlert, UserCheck, GraduationCap, BookOpen, Megaphone } from "lucide-react";
import { useDemoMode } from "@/hooks/use-demo-mode.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const ROLE_BADGE_MAP = {
  admin: { label: "Admin", className: "bg-primary/10 text-primary border-primary/20" },
  manager: { label: "Manager", className: "bg-accent/20 text-accent-foreground border-accent/30" },
  staff: { label: "Staff", className: "bg-muted text-muted-foreground border-border" },
  pkl: { label: "PKL (Intern)", className: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800" },
  rp_manager: { label: "RP Manager", className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800" },
  admin_iklan: { label: "Admin Iklan", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800" },
} as const;

export default function UsersPage() {
  const { user: currentUser, isAdmin } = useUserRole();
  const { demoModeArg, isDemoGuest } = useDemoMode();
  const users = useQuery(api.users.listAll, { demoMode: demoModeArg });
  const updateRole = useMutation(api.users.updateRole);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && !isAdmin && !isDemoGuest) {
      toast.error("Only admins can manage users");
      navigate("/dashboard");
    }
  }, [currentUser, isAdmin, isDemoGuest, navigate]);

  if (!users || (!currentUser && !isDemoGuest)) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!isAdmin && !isDemoGuest) return null;

  const handleRoleChange = async (userId: Id<"users">, newRole: "admin" | "manager" | "staff" | "pkl" | "rp_manager" | "admin_iklan") => {
    try {
      await updateRole({ userId, role: newRole });
      toast.success("Role updated successfully");
    } catch {
      toast.error("Failed to update role");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage team members and their access levels
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Current Role</TableHead>
              <TableHead className="font-semibold">Change Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const badge = ROLE_BADGE_MAP[u.role];
              const isCurrentUser = !isDemoGuest && currentUser && u._id === currentUser._id;
              return (
                <TableRow key={u._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                        {u.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <span>
                        {u.name ?? "Unnamed"}
                        {isCurrentUser && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (you)
                          </span>
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={badge.className}>
                      {u.role === "admin" && <Shield className="w-3 h-3 mr-1" />}
                      {u.role === "manager" && <ShieldAlert className="w-3 h-3 mr-1" />}
                      {u.role === "staff" && <UserCheck className="w-3 h-3 mr-1" />}
                      {u.role === "pkl" && <GraduationCap className="w-3 h-3 mr-1" />}
                      {u.role === "rp_manager" && <BookOpen className="w-3 h-3 mr-1" />}
                      {u.role === "admin_iklan" && <Megaphone className="w-3 h-3 mr-1" />}
                      {badge.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isDemoGuest ? (
                      <span className="text-xs text-muted-foreground">View only</span>
                    ) : isCurrentUser ? (
                      <span className="text-xs text-muted-foreground">
                        Cannot change own role
                      </span>
                    ) : (
                      <Select
                        value={u.role}
                        onValueChange={(value) =>
                          handleRoleChange(u._id, value as "admin" | "manager" | "staff" | "pkl" | "rp_manager" | "admin_iklan")
                        }
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="rp_manager">RP Manager</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="pkl">PKL (Intern)</SelectItem>
                          <SelectItem value="admin_iklan">Admin Iklan</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
