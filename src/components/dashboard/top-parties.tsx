"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface TopParty {
  id: string;
  name: string;
  slug: string;
  chequeCount: number;
  totalAmount: string;
}

interface TopPartiesProps {
  parties: TopParty[] | null;
  isLoading: boolean;
}

export function TopParties({ parties, isLoading }: TopPartiesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Parties by Amount</CardTitle>
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
        <CardTitle>Top Parties by Amount</CardTitle>
      </CardHeader>
      <CardContent>
        {!parties || parties.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No parties found.
          </p>
        ) : (
          <div className="space-y-3">
            {parties.map((party, idx) => (
              <Link
                key={party.id}
                href={`/parties/${party.slug}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium">{party.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {party.chequeCount} cheques
                    </p>
                  </div>
                </div>
                <span className="font-semibold">
                  {formatCurrency(party.totalAmount)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
