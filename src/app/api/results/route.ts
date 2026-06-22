import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const testId = searchParams.get("testId");
    const studentId = searchParams.get("studentId");
    const where: Record<string, unknown> = {};
    if (testId) where.testId = testId;
    if (studentId) where.studentId = studentId;
    const results = await prisma.submission.findMany({
      where,
      orderBy: [{ percentage: "desc" }, { submittedAt: "asc" }],
      include: {
        student: { select: { id: true, fullName: true, email: true, department: true, level: true } },
        participant: { select: { id: true, fullName: true, email: true, department: true, level: true } },
        test: { select: { id: true, title: true, autoMark: true } },
      },
    });
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch results", details: String(err) }, { status: 500 });
  }
}
