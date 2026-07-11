import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLagosTime } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { code, email } = await req.json();
    if (!code || !email) {
      return NextResponse.json({ error: "Test code and email are required" }, { status: 400 });
    }

    const test = await prisma.test.findUnique({
      where: { publicCode: code },
      select: { id: true, title: true, immediateResult: true, endDate: true, status: true },
    });
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    if (test.status !== "open" && test.status !== "closed") {
      return NextResponse.json({ error: "Test is not available" }, { status: 403 });
    }

    const participant = await prisma.participant.findFirst({
      where: { testId: test.id, email: email.toLowerCase().trim() },
    });
    if (!participant) {
      return NextResponse.json({ error: "No participant found with this email for this test" }, { status: 404 });
    }

    const submission = await prisma.submission.findFirst({
      where: { testId: test.id, participantId: participant.id },
      orderBy: { submittedAt: "desc" },
    });
    if (!submission) {
      return NextResponse.json({ error: "No submission found for this participant" }, { status: 404 });
    }

    const now = getLagosTime();
    const testEndDate = new Date(test.endDate);
    const hoursSinceEnd = (now.getTime() - testEndDate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceEnd > 48) {
      return NextResponse.json({
        error: "The 48-hour window to check results has expired. Results are no longer available.",
        expired: true,
      }, { status: 403 });
    }

    if (!test.immediateResult) {
      return NextResponse.json({
        error: "Results are not yet published. Please wait for the administrator to release results.",
        pending: true,
      }, { status: 403 });
    }

    const hoursRemaining = Math.max(0, Math.round((48 - hoursSinceEnd) * 10) / 10);

    return NextResponse.json({
      test: { id: test.id, title: test.title, immediateResult: test.immediateResult },
      participant: { id: participant.id, fullName: participant.fullName, email: participant.email },
      result: {
        id: submission.id,
        score: submission.score,
        percentage: submission.percentage,
        status: submission.status,
        submittedAt: submission.submittedAt,
      },
      hoursRemaining,
    });
  } catch (err) {
    return NextResponse.json({ error: "Login failed", details: String(err) }, { status: 500 });
  }
}
