import { Wallet, Tag, LogOut, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.ts";

export default function FinanceMenuPage() {
  const navigate = useNavigate();
  const { removeUser } = useAuth();

  const menuItems = [
    {
      icon: Wallet,
      label: "Dompet",
      sub: "Kelola Akun",
      to: "/finance/menu/wallets",
      color: "bg-blue-50 dark:bg-blue-500/10 text-blue-600",
    },
    {
      icon: Tag,
      label: "Kategori",
      sub: "Jenis Transaksi",
      to: "/finance/menu/categories",
      color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-5 pt-6 pb-6">
        <h1 className="text-lg font-bold">Pengaturan</h1>
        <p className="text-xs opacity-80">Kelola data master</p>
      </div>

      <div className="px-4 py-5">
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map((item) => (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/30 transition-colors"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Back to Tracker */}
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-6 w-full bg-card border border-border rounded-xl py-3.5 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Tracker
        </button>

        {/* Logout */}
        <button
          onClick={() => removeUser()}
          className="mt-3 w-full bg-card border border-destructive/30 rounded-xl py-3.5 flex items-center justify-center gap-2 text-sm font-medium text-destructive cursor-pointer hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout & Kunci
        </button>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Powered by <span className="font-semibold">hashinah.com</span>
        </p>
      </div>
    </div>
  );
}
