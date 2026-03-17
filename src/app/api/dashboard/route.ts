import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalCheques, statusCounts, totalAmount, recentCheques, topParties] =
      await Promise.all([
        prisma.cheque.count(),
        prisma.cheque.groupBy({
          by: ["status"],
          _sum: { amount: true },
          _count: true,
        }),
        prisma.cheque.aggregate({ _sum: { amount: true } }),
        prisma.cheque.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { party: { select: { name: true, slug: true } } },
        }),
        prisma.party.findMany({
          where: { cheques: { some: {} } },
          select: {
            id: true,
            name: true,
            slug: true,
            _count: { select: { cheques: true } },
            cheques: {
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
