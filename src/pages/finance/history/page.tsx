import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ArrowUpRight, CheckCircle2, ArrowLeftRight, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID", { style: "decimal", maximumFractionDigits: 0 }).format(
    Math.abs(value),
  );
}

export default function FinanceHistoryPage() {
  const transactions = useQuery(api.finance.listTransactions, {});
  const categories = useQuery(api.finance.listCategories, {});
  const wallets = useQuery(api.finance.listWallets, {});
  const deleteTransaction = useMutation(api.finance.deleteTransaction);
  const navigate = useNavigate();

  const categoryMap = useMemo(() => {
    if (!categories) return new Map<string, string>();
    const m = new Map<string, string>();
    for (const c of categories) m.set(c._id, c.name);
    return m;
  }, [categories]);

  const walletMap = useMemo(() => {
    if (!wallets) return new Map<string, string>();
    const m = new Map<string, string>();
    for (const w of wallets) m.set(w._id, w.name);
    return m;
  }, [wallets]);

  if (transactions === undefined) {
    return (
      <div>
        <div className="bg-primary text-primary-foreground px-5 pt-6 pb-6">
          <h1 className="text-lg font-bold">Riwayat</h1>
          <p className="text-xs opacity-80">Semua transaksi</p>
        </div>
        <div className="px-4 py-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const handleDelete = async (id: Id<"financeTransactions">) => {
    try {
      await deleteTransaction({ id });
      toast.success("Transaksi dihapus");
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  // Group by date
  const grouped = new Map<string, typeof transactions>();
  for (const txn of transactions) {
    const dateKey = txn.date;
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(txn);
  }

  const sortedDates = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      <div className="bg-primary text-primary-foreground px-5 pt-6 pb-6">
        <h1 className="text-lg font-bold">Riwayat</h1>
        <p className="text-xs opacity-80">Semua transaksi</p>
      </div>

      <div className="px-4 py-4">
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">Belum ada transaksi</p>
        ) : (
          sortedDates.map((dateKey) => (
            <div key={dateKey} className="mb-5">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-2">{dateKey}</p>
              <div className="space-y-2">
                {grouped.get(dateKey)!.map((txn) => {
                  const catName =
                    txn.categoryId
                      ? categoryMap.get(txn.categoryId) ?? txn.description ?? "-"
                      : txn.description ?? "Transfer";
                  const isExpense = txn.type === "expense";
                  const isTransfer = txn.type === "transfer";
                  const walletName = walletMap.get(txn.walletId) ?? "?";
                  const toWalletName = txn.toWalletId ? walletMap.get(txn.toWalletId) ?? "?" : "";

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
                          <ArrowLeftRight className="w-4 h-4 text-blue-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate uppercase">{catName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {isTransfer ? `${walletName} → ${toWalletName}` : walletName}
                        </p>
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
                          onClick={() => handleDelete(txn._id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
