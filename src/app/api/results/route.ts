import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLagosTime } from "@/lib/utils";

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
        test: { select: { id: true, title: true, autoMark: true, immediateResult: true, scheduledReleaseAt: true, endDate: true, organization: { select: { giveCertificates: true } } } },
      },
    });
    const now = getLagosTime();
    const mapped = results.map((r) => {
      const test = r.test;
      let released = test.immediateResult;
      if (!released && test.scheduledReleaseAt && new Date(test.scheduledReleaseAt) <= now) {
        released = true;
      }
      return {
        ...r,
        resultReleased: released,
        giveCertificates: test.organization?.giveCertificates ?? true,
      };
    });
    return NextResponse.json({ results: mapped });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch results", details: String(err) }, { status: 500 });
  }
}
