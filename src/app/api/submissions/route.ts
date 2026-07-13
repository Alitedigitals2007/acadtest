import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { studentId, testId, answers, questionIds, timeUsed } = await req.json();
    if (!testId || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { questions: true },
    });
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }
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
        studentId: studentId ?? null,
        testId,
        answers: JSON.stringify(parsedAnswers),
        score: test.autoMark ? score : null,
        percentage: test.autoMark ? percentage : null,
        status: "completed",
        timeUsed: timeUsed ? parseInt(timeUsed) : null,
      },
    });
    return NextResponse.json({ message: "Test submitted", submission }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to submit test", details: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const testId = searchParams.get("testId");
    const studentId = searchParams.get("studentId");
    const where: Record<string, unknown> = {};
    if (testId) where.testId = testId;
    if (studentId) where.studentId = studentId;
    const submissions = await prisma.submission.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      include: {
        student: { select: { id: true, fullName: true, email: true, department: true, level: true } },
        participant: { select: { id: true, fullName: true, email: true, department: true, level: true } },
        test: { select: { id: true, title: true, autoMark: true } },
      },
    });
    return NextResponse.json({ submissions });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch submissions", details: String(err) }, { status: 500 });
  }
}
