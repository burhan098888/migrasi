import { useUserRole } from "@/hooks/use-user-role.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  LayoutDashboard,
  ListTodo,
  Users,
  FolderKanban,
  ArrowRight,
  Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user, isAdminOrManager } = useUserRole();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const handleComingSoon = (label: string) => {
    toast.info(`${label} is coming soon in a future milestone!`);
  };

  const quickLinks = [
    ...(isAdminOrManager
      ? [
          {
            icon: ListTodo,
            label: "Task Manager",
            description: "Create and assign tasks",
            action: () => navigate("/tasks"),
          },
          {
            icon: FolderKanban,
            label: "Projects",
            description: "Manage projects and timelines",
            action: () => navigate("/projects"),
          },
          {
            icon: Building2,
            label: "Divisions",
            description: "Manage organizational divisions",
            action: () => navigate("/divisions"),
          },
          {
            icon: Users,
            label: "Manage Users",
            description: "Set roles and permissions",
            action: () => navigate("/users"),
          },
        ]
      : []),
    {
      icon: FolderKanban,
      label: "My Tasks",
      description: "View your assigned tasks",
      action: () => navigate("/my-tasks"),
    },
    {
      icon: LayoutDashboard,
      label: "Analytics",
      description: "View project analytics",
      action: () => navigate("/analytics"),
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user.name ?? "User"}
        </h1>
        <p className="text-muted-foreground mt-1">
          You are signed in as{" "}
          <span className="font-medium capitalize text-foreground">
            {user.role}
          </span>
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <button
            key={link.label}
            onClick={link.action}
            className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary/30 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <link.icon className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="font-semibold text-foreground">{link.label}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {link.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
