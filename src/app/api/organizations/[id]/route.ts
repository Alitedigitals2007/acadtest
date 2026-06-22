import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, students: true, tests: true } },
        payments: { orderBy: { createdAt: "desc" } },
        tests: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }
    return NextResponse.json({ organization: org });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch organization", details: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status, studentLimit, testLimit, bonusStudents, bonusTests, subscription } = await req.json();
    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (studentLimit !== undefined) data.studentLimit = studentLimit;
    if (testLimit !== undefined) data.testLimit = testLimit;
    if (bonusStudents !== undefined) data.bonusStudents = bonusStudents;
    if (bonusTests !== undefined) data.bonusTests = bonusTests;
    if (subscription !== undefined) data.subscription = subscription;
    const org = await prisma.organization.update({
      where: { id },
      data,
    });
    return NextResponse.json({ message: "Organization updated", organization: org });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update organization", details: String(err) }, { status: 500 });
  }
}
