"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Users, FileText, IndianRupee } from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminDashboard() {
  const { data: orgs, isLoading: orgsLoading } = useSWR("/api/admin/organizations", fetcher);
  const { data: users, isLoading: usersLoading } = useSWR("/api/admin/users", fetcher);

  const isLoading = orgsLoading || usersLoading;

  const totalOrgs = Array.isArray(orgs) ? orgs.length : 0;
  const totalUsers = Array.isArray(users) ? users.length : 0;
  const activeOrgs = Array.isArray(orgs) ? orgs.filter((o: { isActive: boolean }) => o.isActive).length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage organizations and users</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/organizations">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Organizations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">
                  {activeOrgs} <span className="text-sm font-normal text-muted-foreground">/ {totalOrgs}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">active organizations</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{totalUsers}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">registered users</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent organizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Organizations</span>
            <Link href="/admin/organizations" className="text-sm font-normal text-primary hover:underline">
              View all
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !Array.isArray(orgs) || orgs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No organizations yet</p>
          ) : (
            <div className="space-y-2">
              {orgs.slice(0, 5).map((org: { id: string; name: string; isActive: boolean; _count: { users: number; parties: number } }) => (
                <div key={org.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{org.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {org._count.users} users, {org._count.parties} parties
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${org.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {org.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
