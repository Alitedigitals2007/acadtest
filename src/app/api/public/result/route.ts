import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { code, email } = await req.json();
    if (!code || !email) {
      return NextResponse.json({ error: "Code and email required" }, { status: 400 });
    }

    const test = await prisma.test.findUnique({
      where: { publicCode: code },
      select: { id: true, title: true, immediateResult: true },
    });
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const participant = await prisma.participant.findFirst({
      where: { testId: test.id, email: email.toLowerCase() },
    });
    if (!participant) {
      return NextResponse.json({ error: "No participant found with this email for this test" }, { status: 404 });
    }

    const submission = await prisma.submission.findFirst({
      where: { testId: test.id, participantId: participant.id },
      orderBy: { submittedAt: "desc" },
    });
    if (!submission) {
      return NextResponse.json({ error: "No submission found" }, { status: 404 });
    }

    return NextResponse.json({
      test: { id: test.id, title: test.title, immediateResult: test.immediateResult },
      participant: { fullName: participant.fullName, email: participant.email },
      result: {
        id: submission.id,
        score: submission.score,
        percentage: submission.percentage,
        status: submission.status,
        submittedAt: submission.submittedAt,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch result", details: String(err) }, { status: 500 });
  }
}
