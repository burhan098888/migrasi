import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Button } from "@/components/ui/button.tsx";
import { X } from "lucide-react";

import { useDemoMode } from "@/hooks/use-demo-mode.tsx";

export type TaskFilters = {
  projectId: string;
  divisionId: string;
  assigneeId: string;
  status: string;
  priority: string;
};

type TaskFiltersBarProps = {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
};

export default function TaskFiltersBar({
  filters,
  onFiltersChange,
}: TaskFiltersBarProps) {
  const { demoModeArg } = useDemoMode();
  const projects = useQuery(api.projects.list, { demoMode: demoModeArg });
  const divisions = useQuery(api.divisions.list, { demoMode: demoModeArg });
  const users = useQuery(api.users.listAll, { demoMode: demoModeArg });

  const hasFilters = Object.values(filters).some((v) => v !== "all");

  const clearFilters = () => {
    onFiltersChange({
      projectId: "all",
      divisionId: "all",
      assigneeId: "all",
      status: "all",
      priority: "all",
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={filters.projectId}
        onValueChange={(val) =>
          onFiltersChange({ ...filters, projectId: val })
        }
      >
        <SelectTrigger className="w-40 h-8 text-xs">
          <SelectValue placeholder="Project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          {projects?.map((p) => (
            <SelectItem key={p._id} value={p._id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.divisionId}
        onValueChange={(val) =>
          onFiltersChange({ ...filters, divisionId: val })
        }
      >
        <SelectTrigger className="w-40 h-8 text-xs">
          <SelectValue placeholder="Division" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Divisions</SelectItem>
          {divisions?.map((d) => (
            <SelectItem key={d._id} value={d._id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.assigneeId}
        onValueChange={(val) =>
          onFiltersChange({ ...filters, assigneeId: val })
        }
      >
        <SelectTrigger className="w-40 h-8 text-xs">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Assignees</SelectItem>
          {users?.map((u) => (
            <SelectItem key={u._id} value={u._id}>
              {u.name ?? u.email ?? "Unnamed"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(val) => onFiltersChange({ ...filters, status: val })}
      >
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="not_started">Not Started</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="complete">Complete</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.priority}
        onValueChange={(val) => onFiltersChange({ ...filters, priority: val })}
      >
        <SelectTrigger className="w-32 h-8 text-xs">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-8 text-xs text-muted-foreground"
        >
          <X className="w-3 h-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
