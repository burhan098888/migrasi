import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty.tsx";
import { FileText } from "lucide-react";
import WorkLogTable from "./_components/work-log-table.tsx";

export default function WorkLogsPage() {
  const logs = useQuery(api.workLogs.list);
  const summary = useQuery(api.workLogs.getSummary);

  if (logs === undefined || summary === undefined) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Work Logs</h1>
        <p className="text-muted-foreground mt-1">
          Daily work activity log and recap per PIC
        </p>
      </div>

      {logs.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>No work logs yet</EmptyTitle>
            <EmptyDescription>
              Work log entries will appear here once data is imported
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <WorkLogTable logs={logs} summary={summary} />
      )}
    </div>
  );
}
