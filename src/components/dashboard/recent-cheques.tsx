"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { formatDate } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface Cheque {
  id: string;
  date: string | null;
  chequeNumber: string;
  amount: string;
  status: "CLEARED" | "BOUNCED" | "PENDING";
  party: { name: string; slug: string };
}

interface RecentChequesProps {
  cheques: Cheque[] | null;
  isLoading: boolean;
}

const statusVariant = {
  CLEARED: "default" as const,
  BOUNCED: "destructive" as const,
  PENDING: "secondary" as const,
};

const statusColors = {
  CLEARED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 hover:bg-emerald-100",
  BOUNCED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-100",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 hover:bg-amber-100",
};

export function StatusBadge({ status }: { status: "CLEARED" | "BOUNCED" | "PENDING" }) {
  return (
    <Badge variant={statusVariant[status]} className={statusColors[status]}>
      {status}
    </Badge>
  );
}

export function RecentCheques({ cheques, isLoading }: RecentChequesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Cheques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Cheques</CardTitle>
      </CardHeader>
      <CardContent>
        {!cheques || cheques.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No cheques found. Import data to get started.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Cheque #</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cheques.map((cheque) => (
                <TableRow key={cheque.id}>
                  <TableCell className="text-muted-foreground">
                    {formatDate(cheque.date)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/parties/${cheque.party.slug}`}
                      className="font-medium hover:underline"
                    >
                      {cheque.party.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono">{cheque.chequeNumber}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(cheque.amount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={cheque.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
