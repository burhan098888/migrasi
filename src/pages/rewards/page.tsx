import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useUserRole } from "@/hooks/use-user-role.ts";
import { useDemoMode } from "@/hooks/use-demo-mode.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty.tsx";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Award,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Minus as MinusIcon,
} from "lucide-react";
import { format } from "date-fns";
import { formatRupiah } from "@/lib/currency.ts";
import RewardFormDialog from "./_components/reward-form-dialog.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const SPREADSHEET_URL =
  "https://docs.google.com/spreadsheets/d/1GVJq0_edsfHQ_LSEyCb-Tl7ICpOZ-m-_I-3NXyBMBl4/edit?usp=sharing";

export default function RewardsPage() {
  const { user: currentUser, isAdminOrManager } = useUserRole();
  const { demoModeArg, isDemoGuest } = useDemoMode();
  const records = useQuery(api.rewardPunishments.list, { demoMode: demoModeArg });
  const summary = useQuery(api.rewardPunishments.summary, { demoMode: demoModeArg });
  const removeRecord = useMutation(api.rewardPunishments.remove);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterUser, setFilterUser] = useState<string>("all");

  // Sort records by date descending
  const sortedRecords = useMemo(() => {
    if (!records) return [];
    const filtered =
      filterUser === "all"
        ? records
        : records.filter((r) => r.userId === filterUser);
    return [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [records, filterUser]);

  // Aggregate stats
  const totals = useMemo(() => {
    if (!records) return { rewards: 0, punishments: 0, net: 0 };
    const rewards = records
      .filter((r) => r.amount > 0)
      .reduce((sum, r) => sum + r.amount, 0);
    const punishments = records
      .filter((r) => r.amount < 0)
      .reduce((sum, r) => sum + r.amount, 0);
    return { rewards, punishments, net: rewards + punishments };
  }, [records]);

  const handleDelete = async (id: Id<"rewardPunishments">) => {
    try {
      await removeRecord({ id });
      toast.success("Record deleted");
    } catch {
      toast.error("Failed to delete record");
    }
  };

  if (!records || !summary || (!currentUser && !isDemoGuest)) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!isAdminOrManager && !isDemoGuest) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">
          Only admins and managers can access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Reward & Punishment
          </h1>
          <p className="text-muted-foreground mt-1">
            Track staff rewards (tabungan akhirat) and punishments from daily
            tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open(SPREADSHEET_URL, "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            Spreadsheet
          </Button>
          {!isDemoGuest && (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Record
            </Button>
          )}
        </div>
      </div>

      {/* Note banner */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-6 text-sm text-amber-800 dark:text-amber-300">
        <strong>Catatan:</strong> Tanda minus (-) berarti hukuman (punishment),
        selain itu berarti tabungan akhirat (reward). Detail ada di sheet Task
        harian.
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">
              Total Tabungan Akhirat
            </span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatRupiah(totals.rewards)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-xs text-muted-foreground">
              Total Punishment
            </span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatRupiah(totals.punishments)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Net Balance</span>
          </div>
          <p
            className={`text-2xl font-bold ${totals.net >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
          >
            {formatRupiah(totals.net)}
          </p>
        </div>
      </div>

      {/* Tabs: Leaderboard vs History */}
      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard">Per-Staff Summary</TabsTrigger>
          <TabsTrigger value="history">All Records</TabsTrigger>
        </TabsList>

        {/* Leaderboard tab */}
        <TabsContent value="leaderboard">
          {summary.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Award />
                </EmptyMedia>
                <EmptyTitle>No records yet</EmptyTitle>
                <EmptyDescription>
                  Add reward or punishment records to see the per-staff summary
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold w-8">#</TableHead>
                    <TableHead className="font-semibold">Staff</TableHead>
                    <TableHead className="font-semibold text-right">
                      Tabungan Akhirat
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      Punishment
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      Net Balance
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      Records
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.map((s, idx) => (
                    <TableRow
                      key={s.userId}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => setFilterUser(s.userId)}
                    >
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-semibold flex items-center justify-center shrink-0">
                            {s.userName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-sm">
                            {s.userName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-green-600 dark:text-green-400">
                        {formatRupiah(s.rewards)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-red-600 dark:text-red-400">
                        {formatRupiah(s.punishments)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-semibold text-sm ${s.net >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                        >
                          {formatRupiah(s.net)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground text-sm">
                        {s.count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* History tab */}
        <TabsContent value="history">
          {/* User filter chips */}
          {summary.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant={filterUser === "all" ? "default" : "secondary"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFilterUser("all")}
              >
                All
              </Button>
              {summary.map((s) => (
                <Button
                  key={s.userId}
                  variant={filterUser === s.userId ? "default" : "secondary"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setFilterUser(s.userId)}
                >
                  {s.userName}
                </Button>
              ))}
            </div>
          )}

          {sortedRecords.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Award />
                </EmptyMedia>
                <EmptyTitle>No records found</EmptyTitle>
                <EmptyDescription>
                  {records.length === 0
                    ? "Add the first reward or punishment record"
                    : "No records for this filter"}
                </EmptyDescription>
              </EmptyHeader>
              {records.length === 0 && !isDemoGuest && (
                <EmptyContent>
                  <Button size="sm" onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Record
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Staff</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold text-right">
                      Amount
                    </TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    {!isDemoGuest && (
                      <TableHead className="font-semibold w-16">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRecords.map((r) => {
                    const isPunishment = r.amount < 0;
                    return (
                      <TableRow key={r._id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(r.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-semibold flex items-center justify-center shrink-0">
                              {r.userName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm">{r.userName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              isPunishment
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            }
                          >
                            {isPunishment ? (
                              <span className="flex items-center gap-1">
                                <MinusIcon className="w-3 h-3" />
                                Punishment
                              </span>
                            ) : (
                              "Tabungan Akhirat"
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold text-sm ${isPunishment ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
                        >
                          {isPunishment ? "- " : "+ "}
                          {formatRupiah(Math.abs(r.amount))}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">
                          {r.description}
                          {r.taskTitle && (
                            <span className="block text-xs text-primary">
                              Task: {r.taskTitle}
                            </span>
                          )}
                        </TableCell>
                        {!isDemoGuest && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(r._id)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-3 text-xs text-muted-foreground">
            Showing {sortedRecords.length} of {records.length} records
          </div>
        </TabsContent>
      </Tabs>

      {/* Form dialog */}
      <RewardFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
