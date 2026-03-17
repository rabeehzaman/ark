import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const party = await prisma.party.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        cheques: { orderBy: { date: { sort: "desc", nulls: "last" } } },
        _count: { select: { cheques: true } },
      },
    });

    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    const totalAmount = party.cheques.reduce(
      (sum, c) => sum + Number(c.amount),
      0
    );
    const clearedAmount = party.cheques
      .filter((c) => c.status === "CLEARED")
      .reduce((sum, c) => sum + Number(c.amount), 0);
    const bouncedAmount = party.cheques
      .filter((c) => c.status === "BOUNCED")
      .reduce((sum, c) => sum + Number(c.amount), 0);

    return NextResponse.json({
      ...party,
      cheques: party.cheques.map((c) => ({
        ...c,
        amount: c.amount.toString(),
      })),
      totalAmount: totalAmount.toString(),
      clearedAmount: clearedAmount.toString(),
      bouncedAmount: bouncedAmount.toString(),
    });
  } catch (error) {
    console.error("Party detail error:", error);
    return NextResponse.json(
      { error: "Failed to load party" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, isActive } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) {
      data.name = name.trim();
      data.slug = slugify(name.trim());
    }
    if (isActive !== undefined) data.isActive = isActive;

    const party = await prisma.party.update({
      where: { id },
      data,
    });

    return NextResponse.json(party);
  } catch (error) {
    console.error("Party update error:", error);
    return NextResponse.json(
      { error: "Failed to update party" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.party.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Party delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete party" },
      { status: 500 }
    );
  }
}
