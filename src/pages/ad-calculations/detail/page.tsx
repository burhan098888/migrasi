import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { Authenticated, AuthLoading } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ArrowLeft } from "lucide-react";
import { formatRupiah } from "@/lib/currency.ts";
import { cn } from "@/lib/utils.ts";
import IncomeSection from "../_components/income-section.tsx";
import ExpenseSection from "../_components/expense-section.tsx";
import ResultSection from "../_components/result-section.tsx";
import RecurringBillSection from "../_components/recurring-bill-section.tsx";

function DetailContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const calcId = id as Id<"adCalculations"> | undefined;
  const calc = useQuery(
    api.adCalculations.getById,
    calcId ? { id: calcId } : "skip",
  );

  if (calc === undefined) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-80" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  // Computed totals
  const totalIncome = calc.incomeEntries.reduce(
    (sum, e) => sum + e.amount,
    0,
  );
  const totalAdCost = calc.expenseEntries.reduce(
    (sum, e) => sum + e.amount,
    0,
  );
  const totalPPN = Math.round(totalAdCost * (calc.ppnRate / 100));
  const totalPengeluaran = totalAdCost + totalPPN;
  const balance = totalIncome - totalPengeluaran;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer"
          onClick={() => navigate("/ad-calculations")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            Perhitungan Iklan {calc.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            PPN {calc.ppnRate}%
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pemasukan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
              {formatRupiah(totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pengeluaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
              {formatRupiah(totalPengeluaran)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sisa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-2xl font-bold font-mono",
                balance >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400",
              )}
            >
              {balance < 0 ? "-" : ""}
              {formatRupiah(Math.abs(balance))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two-column: Income & Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncomeSection
          calculationId={calc._id}
          entries={calc.incomeEntries}
        />
        <ExpenseSection
          calculationId={calc._id}
          entries={calc.expenseEntries}
          ppnRate={calc.ppnRate}
        />
      </div>

      {/* Recurring Bills */}
      <RecurringBillSection
        calculationId={calc._id}
        bills={calc.recurringBills}
      />

      {/* Results */}
      <ResultSection
        calculationId={calc._id}
        entries={calc.resultEntries}
      />
    </div>
  );
}

export default function AdCalculationDetailPage() {
  return (
    <>
      <AuthLoading>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-80" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </div>
      </AuthLoading>
      <Authenticated>
        <DetailContent />
      </Authenticated>
    </>
  );
}
