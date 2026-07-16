import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLagosTime } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { code, email } = await req.json();
    if (!code || !email) {
      return NextResponse.json({ error: "Code and email required" }, { status: 400 });
    }

    const test = await prisma.test.findUnique({
      where: { publicCode: code },
      select: { id: true, title: true, immediateResult: true, scheduledReleaseAt: true },
    });
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const now = new Date();
    let released = test.immediateResult;
    if (!released && test.scheduledReleaseAt && new Date(test.scheduledReleaseAt) <= now) {
      released = true;
    }
    if (!released) {
      return NextResponse.json({ error: "Results for this test have not been released yet. Please check back later." }, { status: 403 });
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    const test = await prisma.test.findUnique({
      where: { publicCode: code },
      include: {
        questions: {
          select: { id: true, questionText: true, options: true, correctAnswer: true, type: true, orderIndex: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    });
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const questions = test.questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: JSON.parse(q.options),
      correctAnswer: q.correctAnswer,
      type: q.type,
    }));

    return NextResponse.json({ test: { id: test.id, title: test.title }, questions });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch corrections", details: String(err) }, { status: 500 });
  }
}
