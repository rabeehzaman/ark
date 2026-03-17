import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.date !== undefined) data.date = body.date ? new Date(body.date) : null;
    if (body.chequeNumber !== undefined) data.chequeNumber = body.chequeNumber.trim();
    if (body.amount !== undefined) data.amount = new Prisma.Decimal(body.amount);
    if (body.status !== undefined) data.status = body.status;
    if (body.remarks !== undefined) data.remarks = body.remarks?.trim() || null;

    const cheque = await prisma.cheque.update({
      where: { id },
      data,
      include: { party: { select: { name: true, slug: true } } },
    });

    return NextResponse.json({ ...cheque, amount: cheque.amount.toString() });
  } catch (error) {
    console.error("Cheque update error:", error);
    return NextResponse.json(
      { error: "Failed to update cheque" },
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
    await prisma.cheque.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cheque delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete cheque" },
      { status: 500 }
    );
  }
}
