import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function getAuthSession() {
  const session = await auth();
  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function requireSuperAdmin() {
  const { session, error } = await getAuthSession();
  if (error) return { session: null, error };
  if (session!.user.role !== "SUPER_ADMIN") {
    return { session: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session: session!, error: null };
}

export async function requireOrgUser() {
  const { session, error } = await getAuthSession();
  if (error) return { session: null, orgId: null, error };
  if (!session!.user.orgId) {
    return { session: null, orgId: null, error: NextResponse.json({ error: "No organization" }, { status: 403 }) };
  }
  return { session: session!, orgId: session!.user.orgId, error: null };
}
