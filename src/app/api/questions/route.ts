import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { testId, type, questionText, options, correctAnswer, orderIndex } = await req.json();
    if (!testId || !questionText || !correctAnswer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }
    const question = await prisma.question.create({
      data: {
        testId,
        type: type ?? "multiple_choice",
        questionText,
        options: options ? JSON.stringify(options) : "[]",
        correctAnswer,
        orderIndex: orderIndex ?? 0,
      },
    });
    return NextResponse.json({ message: "Question added", question }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to add question", details: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, questionText, options, correctAnswer, type } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Question ID required" }, { status: 400 });
    }
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }
    const data: Record<string, unknown> = {};
    if (questionText !== undefined) data.questionText = questionText;
    if (options !== undefined) data.options = JSON.stringify(options);
    if (correctAnswer !== undefined) data.correctAnswer = correctAnswer;
    if (type !== undefined) data.type = type;
    const question = await prisma.question.update({ where: { id }, data });
    return NextResponse.json({ message: "Question updated", question });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update question", details: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const ids = searchParams.get("ids");
    if (ids) {
      const idList = ids.split(",").filter(Boolean);
      await prisma.question.deleteMany({ where: { id: { in: idList } } });
      return NextResponse.json({ message: `${idList.length} question(s) deleted` });
    }
    if (!id) {
      return NextResponse.json({ error: "Question ID or ids required", details: "Provide ?id=... or ?ids=id1,id2,..." }, { status: 400 });
    }
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }
    await prisma.question.delete({ where: { id } });
    return NextResponse.json({ message: "Question deleted" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete question", details: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const testId = searchParams.get("testId");
    if (!testId) {
      return NextResponse.json({ error: "testId query parameter required" }, { status: 400 });
    }
    const questions = await prisma.question.findMany({
      where: { testId },
      orderBy: { orderIndex: "asc" },
    });
    const parsed = questions.map((q) => ({
      ...q,
      options: JSON.parse(q.options),
    }));
    return NextResponse.json({ questions: parsed });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch questions", details: String(err) }, { status: 500 });
  }
}
