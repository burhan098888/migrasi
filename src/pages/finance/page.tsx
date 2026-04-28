import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ChevronLeft, ChevronRight, CheckCircle2, ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID", { style: "decimal", maximumFractionDigits: 0 }).format(
    Math.abs(value),
  );
}

export default function FinanceDashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthKey = format(currentDate, "yyyy-MM");
  const summary = useQuery(api.finance.getDashboardSummary, { month: monthKey });
  const categories = useQuery(api.finance.listCategories, {});
  const wallets = useQuery(api.finance.listWallets, {});
  const deleteTransaction = useMutation(api.finance.deleteTransaction);
  const navigate = useNavigate();

  const categoryMap = useMemo(() => {
    if (!categories) return new Map<string, string>();
    const m = new Map<string, string>();
    for (const c of categories) {
      m.set(c._id, c.name);
    }
    return m;
  }, [categories]);

  const walletMap = useMemo(() => {
    if (!wallets) return new Map<string, string>();
    const m = new Map<string, string>();
    for (const w of wallets) {
      m.set(w._id, w.name);
    }
    return m;
  }, [wallets]);

  if (summary === undefined) {
    return (
      <div>
        <div className="bg-primary text-primary-foreground px-5 pt-6 pb-8">
          <Skeleton className="h-4 w-24 bg-primary-foreground/20" />
          <Skeleton className="h-8 w-32 mt-1 bg-primary-foreground/20" />
        </div>
        <div className="px-4 -mt-4 space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const handleDeleteTransaction = async (id: Id<"financeTransactions">) => {
    try {
      await deleteTransaction({ id });
      toast.success("Transaksi dihapus");
    } catch {
      toast.error("Gagal menghapus transaksi");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-5 pt-6 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">Total Saldo</p>
            <h1 className="text-xl font-bold">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 bg-primary-foreground/10 rounded-full px-3 py-1.5">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="cursor-pointer hover:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {format(currentDate, "MMMM yyyy", { locale: localeId })}
            </span>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="cursor-pointer hover:opacity-70 transition-opacity"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Balance card */}
      <div className="px-4 -mt-6">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
          <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            Saldo Aktif
          </p>
          <p className="text-3xl font-bold mt-1">{formatNumber(summary.totalBalance)}</p>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="border border-border rounded-xl p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                Masuk
              </div>
              <p className="text-base font-bold text-green-600">{formatNumber(summary.totalIncome)}</p>
            </div>
            <div className="border border-border rounded-xl p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />
                Keluar
              </div>
              <p className="text-base font-bold text-red-600">{formatNumber(summary.totalExpense)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">Transaksi Terakhir</h2>
          <button
            onClick={() => navigate("/finance/history")}
            className="text-xs text-primary font-medium cursor-pointer hover:underline"
          >
            Lihat Semua
          </button>
        </div>

        {summary.recentTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Belum ada transaksi bulan ini</p>
        ) : (
          <div className="space-y-2">
            {summary.recentTransactions.map((txn) => {
              const catName =
                txn.categoryId ? categoryMap.get(txn.categoryId) ?? txn.description ?? "-" : txn.description ?? "Transfer";
              const isExpense = txn.type === "expense";
              const isTransfer = txn.type === "transfer";

              return (
                <div
                  key={txn._id}
                  className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      isExpense
                        ? "bg-red-50 dark:bg-red-500/10"
                        : isTransfer
                          ? "bg-blue-50 dark:bg-blue-500/10"
                          : "bg-green-50 dark:bg-green-500/10"
                    }`}
                  >
                    {isExpense ? (
                      <ArrowUpRight className="w-4 h-4 text-red-500" />
                    ) : isTransfer ? (
                      <ArrowUpRight className="w-4 h-4 text-blue-500" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate uppercase">{catName}</p>
                    <p className="text-[11px] text-muted-foreground">{txn.date}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-sm font-bold ${isExpense || isTransfer ? "text-red-600" : "text-green-600"}`}
                    >
                      {isExpense || isTransfer ? "- " : "+ "}
                      {formatNumber(txn.amount)}
                    </span>
                    <button
                      onClick={() => navigate(`/finance/add?edit=${txn._id}`)}
                      className="p-1.5 text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTransaction(txn._id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
