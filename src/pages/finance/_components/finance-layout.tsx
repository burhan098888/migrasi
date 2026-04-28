import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Home, Clock, Plus, Grid3X3, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useUserRole } from "@/hooks/use-user-role.ts";
import { Button } from "@/components/ui/button.tsx";

function BottomNav() {
  const navItems = [
    { to: "/finance", icon: Home, label: "Home", end: true },
    { to: "/finance/history", icon: Clock, label: "Riwayat" },
    { to: "/finance/menu", icon: Grid3X3, label: "Menu" },
  ];

  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex items-center justify-around h-16 safe-area-bottom">
      {navItems.slice(0, 1).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors cursor-pointer",
              isActive ? "text-primary" : "text-muted-foreground",
            )
          }
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{item.label}</span>
        </NavLink>
      ))}

      {/* Riwayat */}
      <NavLink
        to="/finance/history"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors cursor-pointer",
            isActive ? "text-primary" : "text-muted-foreground",
          )
        }
      >
        <Clock className="w-5 h-5" />
        <span className="text-[10px] font-medium">Riwayat</span>
      </NavLink>

      {/* FAB */}
      <div className="flex-1 flex items-center justify-center relative">
        <button
          onClick={() => navigate("/finance/add")}
          className="absolute -top-5 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Menu */}
      <NavLink
        to="/finance/menu"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors cursor-pointer",
            isActive ? "text-primary" : "text-muted-foreground",
          )
        }
      >
        <Grid3X3 className="w-5 h-5" />
        <span className="text-[10px] font-medium">Menu</span>
      </NavLink>
    </nav>
  );
}

function FinanceInner() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Outlet />
      <BottomNav />
    </div>
  );
}

function FinanceRoleGate() {
  const { user, isAdminOrManager } = useUserRole();
  const navigate = useNavigate();

  // Still loading user data
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!isAdminOrManager) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4 px-6">
          <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-destructive" />
          </div>
          <h2 className="text-xl font-bold">Akses Ditolak</h2>
          <p className="text-muted-foreground text-sm">
            Halaman Finance hanya dapat diakses oleh Admin dan Manager.
          </p>
          <Button onClick={() => navigate("/dashboard")} className="cursor-pointer">
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <FinanceInner />;
}

export default function FinanceLayout() {
  return (
    <>
      <AuthLoading>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="space-y-4 w-64">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center space-y-4 px-6">
            <h2 className="text-2xl font-bold">Hashinah Finance</h2>
            <p className="text-muted-foreground">Silahkan login untuk mengakses keuangan.</p>
            <SignInButton />
          </div>
        </div>
      </Unauthenticated>
      <Authenticated>
        <FinanceRoleGate />
      </Authenticated>
    </>
  );
}
