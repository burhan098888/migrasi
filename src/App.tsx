import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import { DemoModeProvider } from "@/hooks/use-demo-mode.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AppLayout from "./components/app-layout.tsx";
import DashboardPage from "./pages/dashboard/page.tsx";
import UsersPage from "./pages/users/page.tsx";
import TasksPage from "./pages/tasks/page.tsx";
import ProjectsPage from "./pages/projects/page.tsx";
import DivisionsPage from "./pages/divisions/page.tsx";
import MyTasksPage from "./pages/my-tasks/page.tsx";
import AnalyticsPage from "./pages/analytics/page.tsx";
import CalendarPage from "./pages/calendar/page.tsx";
import WorkLogsPage from "./pages/work-logs/page.tsx";
import AttendancePage from "./pages/attendance/page.tsx";
import RewardsPage from "./pages/rewards/page.tsx";
import PklKpiPage from "./pages/pkl-kpi/page.tsx";
import AdCalculationsPage from "./pages/ad-calculations/page.tsx";
import AdCalculationDetailPage from "./pages/ad-calculations/detail/page.tsx";
import FinanceLayout from "./pages/finance/_components/finance-layout.tsx";
import FinanceDashboardPage from "./pages/finance/page.tsx";
import FinanceAddPage from "./pages/finance/add/page.tsx";
import FinanceHistoryPage from "./pages/finance/history/page.tsx";
import FinanceMenuPage from "./pages/finance/menu/page.tsx";
import FinanceWalletsPage from "./pages/finance/menu/wallets/page.tsx";
import FinanceCategoriesPage from "./pages/finance/menu/categories/page.tsx";
import { useServiceWorker } from "@/hooks/use-service-worker.ts";

export default function App() {
  useServiceWorker();

  return (
    <DefaultProviders>
      <DemoModeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/divisions" element={<DivisionsPage />} />
            <Route path="/my-tasks" element={<MyTasksPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/work-logs" element={<WorkLogsPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route path="/pkl-kpi" element={<PklKpiPage />} />
            <Route path="/ad-calculations" element={<AdCalculationsPage />} />
            <Route path="/ad-calculations/:id" element={<AdCalculationDetailPage />} />
          </Route>
          {/* Hashinah Finance – separate layout with bottom nav */}
          <Route path="/finance" element={<FinanceLayout />}>
            <Route index element={<FinanceDashboardPage />} />
            <Route path="add" element={<FinanceAddPage />} />
            <Route path="history" element={<FinanceHistoryPage />} />
            <Route path="menu" element={<FinanceMenuPage />} />
            <Route path="menu/wallets" element={<FinanceWalletsPage />} />
            <Route path="menu/categories" element={<FinanceCategoriesPage />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </DemoModeProvider>
    </DefaultProviders>
  );
}
