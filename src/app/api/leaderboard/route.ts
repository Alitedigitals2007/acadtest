import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const testId = searchParams.get("testId");
    if (!testId) {
      return NextResponse.json({ error: "testId query parameter required" }, { status: 400 });
    }
    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }
    const submissions = await prisma.submission.findMany({
      where: { testId, score: { not: null } },
      orderBy: [{ percentage: "desc" }, { submittedAt: "asc" }],
      include: {
        student: { select: { id: true, fullName: true, email: true, department: true } },
      },
    });
    const leaderboard = submissions.map((s, idx) => ({
      rank: idx + 1,
      name: s.student?.fullName || "Anonymous",
      email: s.student?.email || "",
      department: s.student?.department || "",
      score: s.score,
      percentage: s.percentage,
      submittedAt: s.submittedAt,
    }));
    return NextResponse.json({
      testTitle: test.title,
      showLeaderboard: test.showLeaderboard,
      leaderboard,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch leaderboard", details: String(err) }, { status: 500 });
  }
}
