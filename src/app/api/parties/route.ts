import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { requireOrgUser } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const { orgId, error } = await requireOrgUser();
    if (error) return error;

    const search = req.nextUrl.searchParams.get("search") || "";

    const parties = await prisma.party.findMany({
      where: {
        orgId: orgId!,
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      include: {
        _count: { select: { cheques: true } },
        cheques: {
          select: { amount: true, status: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = parties.map((p) => {
      const totalAmount = p.cheques.reduce(
        (sum, c) => sum + Number(c.amount),
        0
      );
      const clearedAmount = p.cheques
        .filter((c) => c.status === "CLEARED")
        .reduce((sum, c) => sum + Number(c.amount), 0);
      const bouncedAmount = p.cheques
        .filter((c) => c.status === "BOUNCED")
        .reduce((sum, c) => sum + Number(c.amount), 0);
      const pendingAmount = p.cheques
        .filter((c) => c.status === "PENDING")
        .reduce((sum, c) => sum + Number(c.amount), 0);

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        isActive: p.isActive,
        chequeCount: p._count.cheques,
        totalAmount: totalAmount.toString(),
        clearedAmount: clearedAmount.toString(),
        bouncedAmount: bouncedAmount.toString(),
        pendingAmount: pendingAmount.toString(),
        clearedCount: p.cheques.filter((c) => c.status === "CLEARED").length,
        bouncedCount: p.cheques.filter((c) => c.status === "BOUNCED").length,
        pendingCount: p.cheques.filter((c) => c.status === "PENDING").length,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Parties list error:", error);
    return NextResponse.json(
      { error: "Failed to load parties" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { orgId, error } = await requireOrgUser();
    if (error) return error;

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Party name is required" },
        { status: 400 }
      );
    }

    const slug = slugify(name.trim());

    const existing = await prisma.party.findFirst({
      where: {
        orgId: orgId!,
        OR: [{ name: name.trim() }, { slug }],
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A party with this name already exists" },
        { status: 409 }
      );
    }

    const party = await prisma.party.create({
      data: { name: name.trim(), slug, orgId: orgId! },
    });

    return NextResponse.json(party, { status: 201 });
  } catch (error) {
    console.error("Party create error:", error);
    return NextResponse.json(
      { error: "Failed to create party" },
      { status: 500 }
    );
  }
}
