import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  FolderKanban,
  ListTodo,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  Gauge,
} from "lucide-react";
import KpiCard from "./_components/kpi-card.tsx";
import StatusPieChart from "./_components/status-pie-chart.tsx";
import PriorityBarChart from "./_components/priority-bar-chart.tsx";
import ProjectProgressChart from "./_components/project-progress-chart.tsx";
import BudgetChart from "./_components/budget-chart.tsx";
import DivisionWorkloadChart from "./_components/division-workload-chart.tsx";
import TopPerformersTable from "./_components/top-performers-table.tsx";

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}

function formatCurrency(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toLocaleString()}`;
}

export default function AnalyticsPage() {
  const analytics = useQuery(api.analytics.getSummary, {});

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
        />
        <KpiCard
          icon={Gauge}
          title="Avg. Progress"
          value={`${kpis.avgProgress}%`}
        />
        <KpiCard icon={Users} title="Team Members" value={kpis.totalUsers} />
        <KpiCard
          icon={DollarSign}
          title="Budget Allocated"
          value={formatCurrency(kpis.totalBudgetAllocated)}
          accent="warning"
        />
        <KpiCard
          icon={TrendingUp}
          title="Budget Realized"
          value={formatCurrency(kpis.totalBudgetRealized)}
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
    </div>
  );
}
