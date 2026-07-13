import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseLagosDate } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { orderIndex: "asc" } },
        _count: { select: { submissions: true, participants: true } },
      },
    });
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }
    return NextResponse.json({ test });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch test", details: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const allowed = [
      "title", "description", "duration", "numQuestions", "startDate", "endDate",
      "status", "shuffleQuestions", "shuffleOptions", "autoMark", "showLeaderboard",
      "enableCalculator", "immediateResult",
    ];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        data[key] = key === "startDate" || key === "endDate" ? parseLagosDate(body[key]) : body[key];
      }
    }
    const test = await prisma.test.update({
      where: { id },
      data,
    });
    return NextResponse.json({ message: "Test updated", test });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update test", details: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.question.deleteMany({ where: { testId: id } });
    await prisma.submission.deleteMany({ where: { testId: id } });
    await prisma.participant.deleteMany({ where: { testId: id } });
    await prisma.test.delete({ where: { id } });
    return NextResponse.json({ message: "Test deleted" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete test", details: String(err) }, { status: 500 });
  }
}
