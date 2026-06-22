import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { testId } = await req.json();
    if (!testId) {
      return NextResponse.json({ error: "testId required" }, { status: 400 });
    }
    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }
    await prisma.test.update({
      where: { id: testId },
      data: { immediateResult: true },
    });
    return NextResponse.json({ message: "Results released" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to release results", details: String(err) }, { status: 500 });
  }
}
