"use client";

import { useState } from "react";
import useSWR from "swr";
import { DateRange } from "react-day-picker";
import { StatCards } from "@/components/dashboard/stat-cards";
import { StatusChart } from "@/components/dashboard/status-chart";
import { RecentCheques } from "@/components/dashboard/recent-cheques";
import { TopParties } from "@/components/dashboard/top-parties";
import { DateRangePicker } from "@/components/date-range-picker";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const queryParams = new URLSearchParams();
  if (dateRange?.from) queryParams.set("dateFrom", dateRange.from.toISOString());
  if (dateRange?.to) queryParams.set("dateTo", dateRange.to.toISOString());
  const qs = queryParams.toString();

  const { data, isLoading } = useSWR(
    `/api/dashboard${qs ? `?${qs}` : ""}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of all cheque transactions
          </p>
        </div>
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          placeholder="Filter by date"
        />
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
