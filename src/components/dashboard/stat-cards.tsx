"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, XCircle, Clock, IndianRupee } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsProps {
  stats: {
    totalCheques: number;
    totalAmount: string;
    cleared: { count: number; amount: string };
    bounced: { count: number; amount: string };
    pending: { count: number; amount: string };
  } | null;
  isLoading: boolean;
}

const cards = [
  {
    title: "Total Cheques",
    icon: FileText,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950",
    getValue: (s: StatsProps["stats"]) => s?.totalCheques ?? 0,
    getAmount: (s: StatsProps["stats"]) => s?.totalAmount ?? "0",
  },
  {
    title: "Cleared",
    icon: CheckCircle,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950",
    getValue: (s: StatsProps["stats"]) => s?.cleared.count ?? 0,
    getAmount: (s: StatsProps["stats"]) => s?.cleared.amount ?? "0",
  },
  {
    title: "Bounced",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950",
    getValue: (s: StatsProps["stats"]) => s?.bounced.count ?? 0,
    getAmount: (s: StatsProps["stats"]) => s?.bounced.amount ?? "0",
  },
  {
    title: "Pending",
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950",
    getValue: (s: StatsProps["stats"]) => s?.pending.count ?? 0,
    getAmount: (s: StatsProps["stats"]) => s?.pending.amount ?? "0",
  },
];

export function StatCards({ stats, isLoading }: StatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${card.bg}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.getValue(stats)}</div>
            <p className={`text-sm ${card.color} font-medium`}>
              {formatCurrency(card.getAmount(stats))}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
