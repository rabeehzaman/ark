import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { requireSuperAdmin } from "@/lib/auth-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireSuperAdmin();
    if (error) return error;

    const { id } = await params;
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
        _count: { select: { parties: true } },
      },
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Get org stats
    const [partyCount, chequeStats] = await Promise.all([
      prisma.party.count({ where: { orgId: id } }),
      prisma.cheque.aggregate({
        where: { party: { orgId: id } },
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      ...org,
      stats: {
        parties: partyCount,
        cheques: chequeStats._count,
        totalAmount: chequeStats._sum.amount?.toString() ?? "0",
      },
    });
  } catch (error) {
    console.error("Admin org detail error:", error);
    return NextResponse.json({ error: "Failed to load organization" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireSuperAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      data.name = body.name.trim();
      data.slug = slugify(body.name.trim());
    }
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const org = await prisma.organization.update({
      where: { id },
      data,
    });

    return NextResponse.json(org);
  } catch (error) {
    console.error("Admin org update error:", error);
    return NextResponse.json({ error: "Failed to update organization" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireSuperAdmin();
    if (error) return error;

    const { id } = await params;
    await prisma.organization.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin org delete error:", error);
    return NextResponse.json({ error: "Failed to delete organization" }, { status: 500 });
  }
}
