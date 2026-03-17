"use client";

import useSWR from "swr";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Search, Plus, Users } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Party {
  id: string;
  name: string;
  slug: string;
  chequeCount: number;
  totalAmount: string;
  clearedAmount: string;
  bouncedAmount: string;
  pendingAmount: string;
  clearedCount: number;
  bouncedCount: number;
  pendingCount: number;
}

export default function PartiesPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPartyName, setNewPartyName] = useState("");
  const { data, isLoading, mutate } = useSWR<Party[]>(
    `/api/parties${search ? `?search=${encodeURIComponent(search)}` : ""}`,
    fetcher
  );

  const handleCreate = async () => {
    if (!newPartyName.trim()) return;
    try {
      const res = await fetch("/api/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPartyName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to create party");
        return;
      }
      toast.success("Party created successfully");
      setNewPartyName("");
      setDialogOpen(false);
      mutate();
    } catch {
      toast.error("Failed to create party");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parties</h1>
          <p className="text-muted-foreground">
            Manage all parties and stores
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Plus className="h-4 w-4 mr-2" />
            Add Party
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Party</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="partyName">Party Name</Label>
                <Input
                  id="partyName"
                  value={newPartyName}
                  onChange={(e) => setNewPartyName(e.target.value)}
                  placeholder="Enter party name"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <Button onClick={handleCreate} className="w-full">
                Create Party
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search parties..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No parties found</p>
            <p className="text-muted-foreground">
              {search ? "Try a different search term" : "Import data or add a party to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((party) => (
            <Link key={party.id} href={`/parties/${party.slug}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg">{party.name}</h3>
                    <span className="text-sm text-muted-foreground">
                      {party.chequeCount} cheques
                    </span>
                  </div>
                  <p className="text-2xl font-bold mb-3">
                    {formatCurrency(party.totalAmount)}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {party.clearedCount} cleared
                    </span>
                    <span className="text-red-600 dark:text-red-400">
                      {party.bouncedCount} bounced
                    </span>
                    <span className="text-amber-600 dark:text-amber-400">
                      {party.pendingCount} pending
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
