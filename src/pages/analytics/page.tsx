import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  FolderKanban,
  ListTodo,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Banknote,
  Users,
  Gauge,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatRupiahCompact } from "@/lib/currency.ts";
import KpiCard from "./_components/kpi-card.tsx";
import StatusPieChart from "./_components/status-pie-chart.tsx";
import PriorityBarChart from "./_components/priority-bar-chart.tsx";
import ProjectProgressChart from "./_components/project-progress-chart.tsx";
import BudgetChart from "./_components/budget-chart.tsx";
import DivisionWorkloadChart from "./_components/division-workload-chart.tsx";
import TopPerformersTable from "./_components/top-performers-table.tsx";
import UserAnalyticsCards from "./_components/user-analytics-cards.tsx";

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}



export default function AnalyticsPage() {
  const analytics = useQuery(api.analytics.getSummary, {});
  const userAnalytics = useQuery(api.analytics.getUserAnalytics, {});
  const allUsers = useQuery(api.users.listAll);
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState("all");

  if (!analytics) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-56" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  const { kpis } = analytics;

  // Filter user analytics based on selection
  const filteredUserAnalytics = userAnalytics
    ? selectedUserId === "all"
      ? userAnalytics
      : userAnalytics.filter((u) => u.name === selectedUserId)
    : null;

  // Find selected user name for display
  const selectedUserName =
    selectedUserId !== "all" ? selectedUserId : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of projects, tasks, budgets, and team performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={FolderKanban} title="Projects" value={kpis.totalProjects} />
        <KpiCard icon={ListTodo} title="Total Tasks" value={kpis.totalTasks} />
        <KpiCard
          icon={CheckCircle2}
          title="Completion Rate"
          value={`${kpis.completionRate}%`}
          accent="success"
        />
        <KpiCard
          icon={AlertTriangle}
          title="Overdue"
          value={kpis.overdueCount}
          accent={kpis.overdueCount > 0 ? "danger" : "default"}
          onClick={
            kpis.overdueCount > 0
              ? () => navigate("/tasks?status=overdue")
              : undefined
          }
        />
        <KpiCard
          icon={Gauge}
          title="Avg. Progress"
          value={`${kpis.avgProgress}%`}
        />
        <KpiCard icon={Users} title="Team Members" value={kpis.totalUsers} />
        <KpiCard
          icon={Banknote}
          title="Budget Allocated"
          value={formatRupiahCompact(kpis.totalBudgetAllocated)}
          accent="warning"
        />
        <KpiCard
          icon={TrendingUp}
          title="Budget Realized"
          value={formatRupiahCompact(kpis.totalBudgetRealized)}
          subtitle={
            kpis.totalBudgetAllocated > 0
              ? `${Math.round((kpis.totalBudgetRealized / kpis.totalBudgetAllocated) * 100)}% utilization`
              : undefined
          }
          accent="success"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Tasks by Status">
          <StatusPieChart data={analytics.tasksByStatus} />
        </ChartCard>
        <ChartCard title="Tasks by Priority">
          <PriorityBarChart data={analytics.tasksByPriority} />
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Project Progress">
          <ProjectProgressChart data={analytics.projectProgress} />
        </ChartCard>
        <ChartCard title="Division Workload">
          <DivisionWorkloadChart data={analytics.divisionWorkload} />
        </ChartCard>
      </div>

      {/* Budget & performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Budget: Allocated vs Realized">
          <BudgetChart data={analytics.budgetData} />
        </ChartCard>
        <ChartCard title="Top Performers">
          <TopPerformersTable data={analytics.topPerformers} />
        </ChartCard>
      </div>

      {/* User Analytics with filter */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground mb-1">
              {selectedUserName
                ? `Performance: ${selectedUserName}`
                : "Analytics by User"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {selectedUserName
                ? "Individual performance breakdown"
                : "Detailed task breakdown for each team member"}
            </p>
          </div>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-52 h-9 text-sm">
              <SelectValue placeholder="Filter by user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {userAnalytics
                ?.filter((u) => u.name)
                .map((u) => (
                  <SelectItem key={u.name} value={u.name}>
                    {u.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {filteredUserAnalytics ? (
          <UserAnalyticsCards
            data={filteredUserAnalytics}
            onViewOverdue={(userName) =>
              navigate(
                `/tasks?status=overdue&assignee=${encodeURIComponent(userName)}`,
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
