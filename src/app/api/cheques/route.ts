import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { requireOrgUser } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const { orgId, error } = await requireOrgUser();
    if (error) return error;

    const sp = req.nextUrl.searchParams;
    const partyId = sp.get("partyId");
    const status = sp.get("status");
    const search = sp.get("search");
    const dateFrom = sp.get("dateFrom");
    const dateTo = sp.get("dateTo");
    const page = parseInt(sp.get("page") || "1");
    const limit = parseInt(sp.get("limit") || "50");
    const sortBy = sp.get("sortBy") || "date";
    const sortOrder = sp.get("sortOrder") || "desc";

    const where: Prisma.ChequeWhereInput = {
      party: { orgId: orgId! },
    };

    if (partyId) where.partyId = partyId;
    if (status && ["PENDING", "CLEARED", "BOUNCED"].includes(status)) {
      where.status = status as "PENDING" | "CLEARED" | "BOUNCED";
    }
    if (search) {
      where.chequeNumber = { contains: search, mode: "insensitive" };
    }
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const [cheques, total] = await Promise.all([
      prisma.cheque.findMany({
        where,
        include: { party: { select: { name: true, slug: true } } },
        orderBy: sortBy === "amount"
          ? { amount: sortOrder as "asc" | "desc" }
          : sortBy === "date"
          ? { date: { sort: sortOrder as "asc" | "desc", nulls: "last" } }
          : { createdAt: sortOrder as "asc" | "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cheque.count({ where }),
    ]);

    return NextResponse.json({
      cheques: cheques.map((c) => ({ ...c, amount: c.amount.toString() })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Cheques list error:", error);
    return NextResponse.json(
      { error: "Failed to load cheques" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { orgId, error } = await requireOrgUser();
    if (error) return error;

    const body = await req.json();
    const { date, chequeNumber, amount, status, remarks, partyId } = body;

    if (!chequeNumber || !amount || !partyId) {
      return NextResponse.json(
        { error: "Cheque number, amount, and party are required" },
        { status: 400 }
      );
    }

    // Verify the party belongs to user's org
    const party = await prisma.party.findFirst({
      where: { id: partyId, orgId: orgId! },
    });
    if (!party) {
      return NextResponse.json(
        { error: "Party not found" },
        { status: 404 }
      );
    }

    const cheque = await prisma.cheque.create({
      data: {
        date: date ? new Date(date) : null,
        chequeNumber: chequeNumber.trim(),
        amount: new Prisma.Decimal(amount),
        status: status || "PENDING",
        remarks: remarks?.trim() || null,
        partyId,
      },
      include: { party: { select: { name: true, slug: true } } },
    });

    return NextResponse.json(
      { ...cheque, amount: cheque.amount.toString() },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Cheque create error:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A cheque with this number already exists for this party" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create cheque" },
      { status: 500 }
    );
  }
}
