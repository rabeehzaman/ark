import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { requireSuperAdmin } from "@/lib/auth-utils";

export async function GET() {
  try {
    const { error } = await requireSuperAdmin();
    if (error) return error;

    const orgs = await prisma.organization.findMany({
      include: {
        _count: { select: { users: true, parties: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(orgs);
  } catch (error) {
    console.error("Admin orgs list error:", error);
    return NextResponse.json({ error: "Failed to load organizations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireSuperAdmin();
    if (error) return error;

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    }

    const slug = slugify(name.trim());

    const existing = await prisma.organization.findFirst({
      where: { OR: [{ name: name.trim() }, { slug }] },
    });
    if (existing) {
      return NextResponse.json({ error: "An organization with this name already exists" }, { status: 409 });
    }

    const org = await prisma.organization.create({
      data: { name: name.trim(), slug },
    });

    return NextResponse.json(org, { status: 201 });
  } catch (error) {
    console.error("Admin org create error:", error);
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }
}
