"use client";

import useSWR from "swr";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { formatDate } from "@/lib/date-utils";
import { StatusBadge } from "@/components/dashboard/recent-cheques";
import { Search, Download, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/date-range-picker";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Cheque {
  id: string;
  date: string | null;
  chequeNumber: string;
  amount: string;
  status: "CLEARED" | "BOUNCED" | "PENDING";
  remarks: string | null;
  party: { name: string; slug: string };
}

interface ChequesResponse {
  cheques: Cheque[];
  total: number;
  page: number;
  totalPages: number;
}

interface Party {
  id: string;
  name: string;
  slug: string;
}

export default function ChequesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [partyId, setPartyId] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams();
  queryParams.set("page", page.toString());
  queryParams.set("limit", "25");
  if (search) queryParams.set("search", search);
  if (status !== "all") queryParams.set("status", status);
  if (partyId !== "all") queryParams.set("partyId", partyId);
  if (dateRange?.from) queryParams.set("dateFrom", dateRange.from.toISOString());
  if (dateRange?.to) queryParams.set("dateTo", dateRange.to.toISOString());

  const { data, isLoading } = useSWR<ChequesResponse>(
    `/api/cheques?${queryParams.toString()}`,
    fetcher
  );

  const { data: partiesRaw } = useSWR<Party[]>("/api/parties", fetcher);
  const parties = Array.isArray(partiesRaw) ? partiesRaw : [];

  const handleExport = () => {
    window.open("/api/export", "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Cheques</h1>
          <p className="text-muted-foreground">
            {data?.total ?? 0} total cheques
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by cheque number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={(range) => { setDateRange(range); setPage(1); }}
          placeholder="Filter by date"
        />
        <Select value={status} onValueChange={(v) => { setStatus(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="CLEARED">Cleared</SelectItem>
            <SelectItem value="BOUNCED">Bounced</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={partyId} onValueChange={(v) => { setPartyId(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Party" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Parties</SelectItem>
            {parties.map((p: Party) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data || data.cheques.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No cheques found</p>
              <p className="text-muted-foreground">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Cheque #</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.cheques.map((cheque) => (
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
                    <TableCell className="font-mono">
                      {cheque.chequeNumber}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(cheque.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={cheque.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {cheque.remarks || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
