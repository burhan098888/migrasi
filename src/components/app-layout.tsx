import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useUserRole } from "@/hooks/use-user-role.ts";
import {
  LayoutDashboard,
  ListTodo,
  Users,
  FolderKanban,
  CalendarDays,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Building2,
  ClipboardList,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth.ts";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import { toast } from "sonner";

function SidebarContent({ collapsed }: { collapsed: boolean }) {
  const { user, isAdminOrManager } = useUserRole();
  const { removeUser } = useAuth();

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ...(isAdminOrManager
      ? [
          { to: "/tasks", icon: ListTodo, label: "Task Manager" },
          { to: "/projects", icon: FolderKanban, label: "Projects" },
          { to: "/divisions", icon: Building2, label: "Divisions" },
          { to: "/users", icon: Users, label: "Users" },
        ]
      : []),
    { to: "/my-tasks", icon: ClipboardList, label: "My Tasks" },
    { to: "/work-logs", icon: FileText, label: "Work Logs" },
    { to: "/analytics", icon: BarChart3, label: "Analytics" },
    { to: "/calendar", icon: CalendarDays, label: "Calendar" },
  ];

  const handleComingSoon = (label: string) => {
    toast.info(`${label} is coming soon in a future milestone!`);
  };

  const availableRoutes = ["/dashboard", "/users", "/tasks", "/projects", "/divisions", "/my-tasks", "/work-logs", "/analytics", "/calendar"];

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm shrink-0">
          H
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-sidebar-foreground truncate">
              Hashinah
            </h1>
            <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">
              Project Tracker
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isAvailable = availableRoutes.includes(item.to);
          if (isAvailable) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    collapsed && "justify-center px-2",
                  )
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          }
          return (
            <button
              key={item.to}
              onClick={() => handleComingSoon(item.label)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors w-full text-left",
                "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                collapsed && "justify-center px-2",
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-sidebar-border px-3 py-4">
        {user && (
          <div
            className={cn(
              "flex items-center gap-3",
              collapsed && "justify-center",
            )}
          >
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary text-xs font-semibold shrink-0">
              {user.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  {user.name ?? "User"}
                </p>
                <p className="text-[10px] text-sidebar-foreground/50 capitalize">
                  {user.role}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={() => removeUser()}
                className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <Authenticated>
        <div className="flex h-screen bg-background overflow-hidden">
          {/* Desktop sidebar */}
          <aside
            className={cn(
              "hidden md:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 shrink-0",
              collapsed ? "w-16" : "w-60",
            )}
          >
            <SidebarContent collapsed={collapsed} />
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex items-center justify-center py-3 border-t border-sidebar-border text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </aside>

          {/* Mobile header */}
          <div className="md:hidden fixed top-10 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-xs flex items-center justify-center">
                H
              </div>
              <span className="text-sm font-bold text-sidebar-foreground">
                Hashinah
              </span>
            </div>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-sidebar-foreground"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Mobile sidebar overlay */}
          {mobileOpen && (
            <>
              <div
                className="md:hidden fixed inset-0 z-40 bg-black/50"
                onClick={() => setMobileOpen(false)}
              />
              <aside className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-60 bg-sidebar">
                <SidebarContent collapsed={false} />
              </aside>
            </>
          )}

          {/* Main content */}
          <main className="flex-1 overflow-y-auto md:pt-0 pt-24">
            <Outlet />
          </main>
        </div>
      </Authenticated>

      <Unauthenticated>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Sign in to continue</h2>
            <p className="text-muted-foreground">
              You need to be signed in to access this page.
            </p>
            <SignInButton />
          </div>
        </div>
      </Unauthenticated>

      <AuthLoading>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="space-y-4 w-64">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </AuthLoading>
    </>
  );
}
