import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "code query parameter required" }, { status: 400 });
    }
    const org = await prisma.organization.findUnique({
      where: { code: code.toUpperCase() },
      select: { id: true, name: true, code: true, status: true },
    });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }
    return NextResponse.json({ organization: org });
  } catch (err) {
    return NextResponse.json({ error: "Lookup failed", details: String(err) }, { status: 500 });
  }
}
