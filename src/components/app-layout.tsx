import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { AuthLoading } from "convex/react";
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
  MapPin,
  Eye,
  ArrowLeft,
  Award,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth.ts";
import { useDemoMode } from "@/hooks/use-demo-mode.tsx";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";

function SidebarContent({ collapsed }: { collapsed: boolean }) {
  const { user, isAdminOrManager, isAuthenticated } = useUserRole();
  const { removeUser } = useAuth();
  const { isDemoGuest, exitDemoMode } = useDemoMode();
  const navigate = useNavigate();

  // In demo guest mode, show all nav items to showcase features
  const showAdminItems = isAdminOrManager || isDemoGuest;

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ...(showAdminItems
      ? [
          { to: "/tasks", icon: ListTodo, label: "Task Manager" },
          { to: "/projects", icon: FolderKanban, label: "Projects" },
          { to: "/divisions", icon: Building2, label: "Divisions" },
          { to: "/users", icon: Users, label: "Users" },
        ]
      : []),
    { to: "/my-tasks", icon: ClipboardList, label: "My Tasks" },
    { to: "/attendance", icon: MapPin, label: "Attendance" },
    { to: "/work-logs", icon: FileText, label: "Work Logs" },
    ...(showAdminItems
      ? [{ to: "/rewards", icon: Award, label: "Reward & Punishment" }]
      : []),
    { to: "/analytics", icon: BarChart3, label: "Analytics" },
    { to: "/calendar", icon: CalendarDays, label: "Calendar" },
  ];

  const availableRoutes = ["/dashboard", "/users", "/tasks", "/projects", "/divisions", "/my-tasks", "/attendance", "/work-logs", "/rewards", "/analytics", "/calendar"];

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
          return null;
        })}
      </nav>

      {/* Demo Guest indicator + exit */}
      {isDemoGuest && (
        <div className={cn("px-3 py-2 border-t border-sidebar-border space-y-2", collapsed && "px-2")}>
          <div
            className={cn(
              "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30",
              collapsed && "justify-center px-2",
            )}
          >
            <Eye className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && "Demo Preview"}
          </div>
          {!collapsed && (
            <button
              onClick={() => {
                exitDemoMode();
                navigate("/");
              }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              Exit Demo
            </button>
          )}
        </div>
      )}

      {/* User info (authenticated only) */}
      {isAuthenticated && user && (
        <div className="border-t border-sidebar-border px-3 py-4">
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
        </div>
      )}

      {/* Guest sign-in prompt */}
      {isDemoGuest && !collapsed && (
        <div className="border-t border-sidebar-border px-3 py-4">
          <SignInButton size="sm" signInText="Sign In" className="w-full" />
        </div>
      )}
    </div>
  );
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user: authUser, isLoading } = useAuth();
  const { isDemoGuest } = useDemoMode();

  const isAuthenticated = !!authUser;
  const showApp = isAuthenticated || isDemoGuest;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  // Not authenticated and not in demo mode
  if (!showApp) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Sign in to continue</h2>
          <p className="text-muted-foreground">
            You need to be signed in to access this page.
          </p>
          <SignInButton />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Demo banner for guests */}
      {isDemoGuest && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-1.5 text-xs font-medium flex items-center justify-center gap-2">
          <Eye className="w-3.5 h-3.5" />
          You{"'"}re viewing demo data. Sign in for the full experience.
        </div>
      )}

      <div className={cn("flex h-screen bg-background overflow-hidden", isDemoGuest && "pt-8")}>
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
        <div className={cn(
          "md:hidden fixed left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border px-4 py-3 flex items-center justify-between",
          isDemoGuest ? "top-8" : "top-0",
        )}>
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
            <aside className={cn(
              "md:hidden fixed left-0 bottom-0 z-50 w-60 bg-sidebar",
              isDemoGuest ? "top-8" : "top-0",
            )}>
              <SidebarContent collapsed={false} />
            </aside>
          </>
        )}

        {/* Main content */}
        <main className={cn(
          "flex-1 overflow-y-auto",
          isDemoGuest ? "md:pt-0 pt-16" : "md:pt-0 pt-14",
        )}>
          <AuthLoading>
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-32 w-full" />
            </div>
          </AuthLoading>
          <Outlet />
        </main>
      </div>
    </>
  );
}
