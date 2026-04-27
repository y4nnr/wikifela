import { NextRequest, NextResponse } from "next/server";

export function checkAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(authHeader.slice(6), "base64").toString();
  const expected = process.env.ADMIN_CREDENTIALS || "admin:admin";
  return decoded === expected;
}

export function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}
