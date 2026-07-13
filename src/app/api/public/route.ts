import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLagosTime } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "publicCode query parameter required" }, { status: 400 });
    }
    const test = await prisma.test.findUnique({
      where: { publicCode: code },
      include: {
        questions: {
          select: { id: true, questionText: true, options: true, type: true, orderIndex: true },
          orderBy: { orderIndex: "asc" },
        },
        _count: { select: { submissions: true, participants: true } },
      },
    });
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }
    if (test.status !== "open") {
      return NextResponse.json({ error: "Test is not available" }, { status: 403 });
    }
    const now = getLagosTime();
    const start = new Date(test.startDate);
    const end = new Date(test.endDate);
    if (now < start || now > end) {
      return NextResponse.json({ error: "Test is not currently available" }, { status: 403 });
    }
    let parsed = test.questions.map((q) => ({
      ...q,
      options: JSON.parse(q.options),
    }));
    if (test.shuffleQuestions) {
      parsed = parsed.sort(() => Math.random() - 0.5);
    }
    if (test.numQuestions && parsed.length > test.numQuestions) {
      parsed = parsed.slice(0, test.numQuestions);
    }
    if (test.shuffleOptions) {
      parsed = parsed.map((q) => ({
        ...q,
        options: q.options.sort(() => Math.random() - 0.5),
      }));
    }
    return NextResponse.json({
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        numQuestions: test.numQuestions,
        shuffleQuestions: test.shuffleQuestions,
        shuffleOptions: test.shuffleOptions,
        showLeaderboard: test.showLeaderboard,
        enableCalculator: test.enableCalculator,
        immediateResult: test.immediateResult,
        questions: parsed,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch test", details: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { publicCode, fullName, department, level, email, answers, questionIds, timeUsed } = await req.json();
    if (!publicCode || !fullName || !department || !level || !email || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const test = await prisma.test.findUnique({
      where: { publicCode },
      include: { questions: true },
    });
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }
    const existingParticipant = await prisma.participant.findFirst({
      where: { testId: test.id, email: email.toLowerCase().trim() },
    });
    if (existingParticipant) {
      const existingSubmission = await prisma.submission.findFirst({
        where: { testId: test.id, participantId: existingParticipant.id },
      });
      if (existingSubmission) {
        return NextResponse.json({ error: "This email has already been used to take this test." }, { status: 409 });
      }
    }
    const participant = await prisma.participant.create({
      data: { testId: test.id, fullName, department, level, email: email.toLowerCase().trim() },
    });
    const parsedAnswers: Record<string, string> = typeof answers === "string" ? JSON.parse(answers) : answers;
    let presentedQuestions = test.questions;
    if (questionIds && Array.isArray(questionIds) && questionIds.length > 0) {
      presentedQuestions = test.questions.filter((q) => questionIds.includes(q.id));
    }
    let score = 0;
    let percentage = 0;
    if (test.autoMark && presentedQuestions.length > 0) {
      for (const q of presentedQuestions) {
        const selected = parsedAnswers[q.id];
        if (selected && selected === q.correctAnswer) {
          score++;
        }
      }
      percentage = Math.round((score / presentedQuestions.length) * 100);
    }
    const submission = await prisma.submission.create({
      data: {
        testId: test.id,
        participantId: participant.id,
        answers: JSON.stringify(parsedAnswers),
        score: test.autoMark ? score : null,
        percentage: test.autoMark ? percentage : null,
        status: "completed",
        timeUsed: timeUsed ? parseInt(timeUsed) : null,
      },
    });
    return NextResponse.json({
      message: "Test submitted",
      submission: {
        id: submission.id,
        score: submission.score,
        percentage: submission.percentage,
        status: submission.status,
      },
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to submit test", details: String(err) }, { status: 500 });
  }
}
