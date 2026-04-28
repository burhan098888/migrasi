import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

type TxnType = "expense" | "income" | "transfer";

export default function FinanceAddPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit") as Id<"financeTransactions"> | null;

  const wallets = useQuery(api.finance.listWallets, {});
  const categories = useQuery(api.finance.listCategories, {});
  const allTransactions = useQuery(api.finance.listTransactions, {});
  const createTransaction = useMutation(api.finance.createTransaction);
  const updateTransaction = useMutation(api.finance.updateTransaction);

  const [type, setType] = useState<TxnType>("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [walletId, setWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill for edit
  useEffect(() => {
    if (editId && allTransactions) {
      const txn = allTransactions.find((t) => t._id === editId);
      if (txn) {
        setType(txn.type);
        setAmount(String(txn.amount));
        setDate(txn.date);
        setWalletId(txn.walletId);
        if (txn.toWalletId) setToWalletId(txn.toWalletId);
        if (txn.categoryId) setCategoryId(txn.categoryId);
        if (txn.description) setDescription(txn.description);
      }
    }
  }, [editId, allTransactions]);

  if (wallets === undefined || categories === undefined) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const filteredCategories = categories.filter((c) =>
    type === "transfer" ? false : c.type === type,
  );

  // Calculate wallet balances for display
  const walletBalanceMap = new Map<string, number>();
  if (wallets && allTransactions) {
    for (const w of wallets) {
      let balance = w.initialBalance;
      for (const t of allTransactions) {
        if (t.walletId === w._id) {
          if (t.type === "income") balance += t.amount;
          else if (t.type === "expense") balance -= t.amount;
          else if (t.type === "transfer") balance -= t.amount;
        }
        if (t.type === "transfer" && t.toWalletId === w._id) {
          balance += t.amount;
        }
      }
      walletBalanceMap.set(w._id, balance);
    }
  }

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Nominal harus lebih dari 0");
      return;
    }
    if (!walletId) {
      toast.error("Pilih sumber dana");
      return;
    }
    if (type === "transfer" && !toWalletId) {
      toast.error("Pilih dompet tujuan");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        type,
        amount: numAmount,
        date,
        walletId: walletId as Id<"financeWallets">,
        ...(type === "transfer" ? { toWalletId: toWalletId as Id<"financeWallets"> } : {}),
        ...(categoryId ? { categoryId: categoryId as Id<"financeCategories"> } : {}),
        ...(description ? { description } : {}),
      };

      if (editId) {
        await updateTransaction({ id: editId, ...data });
        toast.success("Transaksi diperbarui");
      } else {
        await createTransaction(data);
        toast.success("Transaksi berhasil ditambahkan");
      }
      navigate("/finance");
    } catch {
      toast.error("Gagal menyimpan transaksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs: { value: TxnType; label: string }[] = [
    { value: "expense", label: "Keluar" },
    { value: "income", label: "Masuk" },
    { value: "transfer", label: "Transfer" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-5 pt-6 pb-6">
        <h1 className="text-lg font-bold">Input Data</h1>
        <p className="text-xs opacity-80">Catat transaksi baru</p>
      </div>

      <div className="px-4 py-5">
        {/* Type tabs */}
        <div className="grid grid-cols-3 gap-0 bg-muted rounded-xl overflow-hidden mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setType(tab.value);
                setCategoryId("");
              }}
              className={cn(
                "py-2.5 text-sm font-semibold transition-colors cursor-pointer",
                type === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/80",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {/* Nominal */}
          <div>
            <Label className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
              Nominal
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold">Rp</span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="text-lg font-bold border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <Label className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
              Tanggal
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Wallet */}
          <div>
            <Label className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
              Sumber Dana
            </Label>
            {wallets.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-1">
                Belum ada dompet.{" "}
                <button onClick={() => navigate("/finance/menu")} className="text-primary cursor-pointer underline">
                  Tambah dompet
                </button>
              </p>
            ) : (
              <Select value={walletId} onValueChange={setWalletId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih dompet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w._id} value={w._id}>
                      {w.name} ({new Intl.NumberFormat("id-ID").format(walletBalanceMap.get(w._id) ?? 0)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* To Wallet (transfer only) */}
          {type === "transfer" && (
            <div>
              <Label className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                Dompet Tujuan
              </Label>
              <Select value={toWalletId} onValueChange={setToWalletId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih dompet tujuan" />
                </SelectTrigger>
                <SelectContent>
                  {wallets
                    .filter((w) => w._id !== walletId)
                    .map((w) => (
                      <SelectItem key={w._id} value={w._id}>
                        {w.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Category (not for transfer) */}
          {type !== "transfer" && (
            <div>
              <Label className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                Kategori
              </Label>
              {filteredCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-1">
                  Belum ada kategori.{" "}
                  <button onClick={() => navigate("/finance/menu")} className="text-primary cursor-pointer underline">
                    Tambah kategori
                  </button>
                </p>
              ) : (
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <Label className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
              Keterangan (opsional)
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan tambahan"
              className="mt-1"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 text-base font-bold mt-4 cursor-pointer"
          >
            {isSubmitting ? "Menyimpan..." : editId ? "Perbarui Transaksi" : "Simpan Transaksi"}
          </Button>
        </div>
      </div>
    </div>
  );
}
