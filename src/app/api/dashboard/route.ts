import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const dateFrom = sp.get("dateFrom");
    const dateTo = sp.get("dateTo");

    const dateFilter: Prisma.ChequeWhereInput = {};
    if (dateFrom || dateTo) {
      dateFilter.date = {};
      if (dateFrom) dateFilter.date.gte = new Date(dateFrom);
      if (dateTo) dateFilter.date.lte = new Date(dateTo);
    }

    const [totalCheques, statusCounts, totalAmount, recentCheques, topParties] =
      await Promise.all([
        prisma.cheque.count({ where: dateFilter }),
        prisma.cheque.groupBy({
          by: ["status"],
          where: dateFilter,
          _sum: { amount: true },
          _count: true,
        }),
        prisma.cheque.aggregate({ where: dateFilter, _sum: { amount: true } }),
        prisma.cheque.findMany({
          where: dateFilter,
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { party: { select: { name: true, slug: true } } },
        }),
        prisma.party.findMany({
          where: { cheques: { some: dateFilter } },
          select: {
            id: true,
            name: true,
            slug: true,
            _count: { select: { cheques: { where: dateFilter } } },
            cheques: {
              where: dateFilter,
              select: { amount: true },
            },
          },
          orderBy: { name: "asc" },
        }),
      ]);

    const stats = {
      totalCheques,
      totalAmount: totalAmount._sum.amount?.toString() ?? "0",
      cleared: { count: 0, amount: "0" },
      bounced: { count: 0, amount: "0" },
      pending: { count: 0, amount: "0" },
    };

    for (const sc of statusCounts) {
      const key = sc.status.toLowerCase() as "cleared" | "bounced" | "pending";
      stats[key] = {
        count: sc._count,
        amount: sc._sum.amount?.toString() ?? "0",
      };
    }

    const topPartiesFormatted = topParties
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        chequeCount: p._count.cheques,
        totalAmount: p.cheques
          .reduce((sum, c) => sum + Number(c.amount), 0)
          .toString(),
      }))
      .sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount))
      .slice(0, 10);

    return NextResponse.json({
      stats,
      recentCheques: recentCheques.map((c) => ({
        ...c,
        amount: c.amount.toString(),
      })),
      topParties: topPartiesFormatted,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
