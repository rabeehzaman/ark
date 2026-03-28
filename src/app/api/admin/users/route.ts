import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireSuperAdmin } from "@/lib/auth-utils";

export async function GET() {
  try {
    const { error } = await requireSuperAdmin();
    if (error) return error;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        orgId: true,
        org: { select: { id: true, name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireSuperAdmin();
    if (error) return error;

    const body = await req.json();
    const { name, email, password, role, orgId } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    if (role !== "SUPER_ADMIN" && !orgId) {
      return NextResponse.json(
        { error: "Organization is required for regular users" },
        { status: 400 }
      );
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: role || "USER",
        orgId: role === "SUPER_ADMIN" ? null : orgId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        orgId: true,
        org: { select: { id: true, name: true } },
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Admin user create error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
