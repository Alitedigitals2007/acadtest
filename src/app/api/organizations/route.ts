import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true, students: true, tests: true, payments: true } },
      },
    });
    return NextResponse.json({ organizations: orgs });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch organizations", details: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, studentLimit, testLimit, bonusStudents, bonusTests } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 });
    }
    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (studentLimit !== undefined) data.studentLimit = studentLimit;
    if (testLimit !== undefined) data.testLimit = testLimit;
    if (bonusStudents !== undefined) data.bonusStudents = bonusStudents;
    if (bonusTests !== undefined) data.bonusTests = bonusTests;
    const org = await prisma.organization.update({ where: { id }, data });
    return NextResponse.json({ message: "Organization updated", organization: org });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update organization", details: String(err) }, { status: 500 });
  }
}
