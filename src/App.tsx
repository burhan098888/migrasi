import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
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
import { useServiceWorker } from "@/hooks/use-service-worker.ts";

export default function App() {
  useServiceWorker();

  return (
    <DefaultProviders>
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
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}
