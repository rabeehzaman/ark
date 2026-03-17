"use client";

import useSWR from "swr";
import { StatCards } from "@/components/dashboard/stat-cards";
import { StatusChart } from "@/components/dashboard/status-chart";
import { RecentCheques } from "@/components/dashboard/recent-cheques";
import { TopParties } from "@/components/dashboard/top-parties";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const { data, isLoading } = useSWR("/api/dashboard", fetcher, {
    refreshInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of all cheque transactions
        </p>
      </div>

      <StatCards stats={data?.stats ?? null} isLoading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <StatusChart stats={data?.stats ?? null} isLoading={isLoading} />
        <TopParties parties={data?.topParties ?? null} isLoading={isLoading} />
      </div>

      <RecentCheques cheques={data?.recentCheques ?? null} isLoading={isLoading} />
    </div>
  );
}
