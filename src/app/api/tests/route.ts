import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCode, calculateAvailable, getLagosTime, parseLagosDate } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const {
      title, description, duration, numQuestions, startDate, endDate,
      shuffleQuestions, shuffleOptions, autoMark, showLeaderboard,
      enableCalculator, immediateResult, scheduledReleaseAt, organizationId,
    } = await req.json();
    if (!title || !duration || !numQuestions || !startDate || !endDate || !organizationId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }
    const existingTest = await prisma.test.findFirst({
      where: { organizationId, title: { equals: title.trim(), mode: "insensitive" } },
    });
    if (existingTest) {
      return NextResponse.json({ error: "A test with this name already exists in your organization" }, { status: 409 });
    }
    const available = calculateAvailable(org.testLimit, org.testsUsed, org.bonusTests);
    if (available <= 0) {
      return NextResponse.json({ error: "Test limit reached" }, { status: 403 });
    }
    const publicCode = generateCode(title.replace(/\s+/g, "").substring(0, 6).toUpperCase());
    const test = await prisma.test.create({
      data: {
        title: title.trim(), description, duration, numQuestions,
        startDate: parseLagosDate(startDate), endDate: parseLagosDate(endDate),
        shuffleQuestions: shuffleQuestions ?? false,
        shuffleOptions: shuffleOptions ?? false,
        autoMark: autoMark ?? true,
        showLeaderboard: showLeaderboard ?? false,
        enableCalculator: enableCalculator ?? false,
        immediateResult: immediateResult ?? true,
        publicCode, organizationId,
      },
    });
    await prisma.organization.update({
      where: { id: organizationId },
      data: { testsUsed: { increment: 1 } },
    });
    return NextResponse.json({ message: "Test created", test }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create test", details: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("organizationId");
    const status = searchParams.get("status");
    const studentView = searchParams.get("studentView");
    const where: Record<string, unknown> = {};
    if (orgId) where.organizationId = orgId;
    if (status) {
      where.status = status;
    } else if (studentView === "true") {
      where.status = "open";
      const now = getLagosTime();
      where.AND = [
        { startDate: { lte: now } },
        { endDate: { gte: now } },
      ];
    }
    const tests = await prisma.test.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { questions: true, submissions: true } } },
    });
    return NextResponse.json({ tests });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch tests", details: String(err) }, { status: 500 });
  }
}
