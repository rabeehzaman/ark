"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface StatusChartProps {
  stats: {
    cleared: { count: number; amount: string };
    bounced: { count: number; amount: string };
    pending: { count: number; amount: string };
  } | null;
  isLoading: boolean;
}

const COLORS = {
  Cleared: "#10b981",
  Bounced: "#ef4444",
  Pending: "#f59e0b",
};

export function StatusChart({ stats, isLoading }: StatusChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Skeleton className="h-48 w-48 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const data = [
    { name: "Cleared", value: stats?.cleared.count ?? 0, amount: stats?.cleared.amount ?? "0" },
    { name: "Bounced", value: stats?.bounced.count ?? 0, amount: stats?.bounced.amount ?? "0" },
    { name: "Pending", value: stats?.pending.count ?? 0, amount: stats?.pending.amount ?? "0" },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[entry.name as keyof typeof COLORS]}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => [
                `${value} cheques (${formatCurrency((props?.payload as { amount?: string })?.amount ?? "0")})`,
                String(name),
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
