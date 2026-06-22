import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { calculateAvailable } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { fullName, department, level, email, username, password, organizationCode } = await req.json();
    if (!fullName || !department || !level || !email || !username || !password || !organizationCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const org = await prisma.organization.findUnique({ where: { code: organizationCode } });
    if (!org) {
      return NextResponse.json({ error: "Invalid organization code" }, { status: 404 });
    }
    const available = calculateAvailable(org.studentLimit, org.studentsUsed, org.bonusStudents);
    if (available <= 0) {
      return NextResponse.json({ error: "Student limit reached for this organization" }, { status: 403 });
    }
    const existingEmail = await prisma.student.findUnique({
      where: { email_organizationId: { email, organizationId: org.id } },
    });
    if (existingEmail) {
      return NextResponse.json({ error: "Email already registered in this organization" }, { status: 409 });
    }
    const existingUsername = await prisma.student.findUnique({
      where: { username_organizationId: { username, organizationId: org.id } },
    });
    if (existingUsername) {
      return NextResponse.json({ error: "Username already taken in this organization" }, { status: 409 });
    }
    const hashed = await bcrypt.hash(password, 10);
    const student = await prisma.student.create({
      data: {
        fullName, department, level, email, username,
        password: hashed,
        organizationId: org.id,
      },
    });
    await prisma.organization.update({
      where: { id: org.id },
      data: { studentsUsed: { increment: 1 } },
    });
    return NextResponse.json(
      { message: "Student registered", student: { id: student.id, fullName: student.fullName, email: student.email } },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: "Failed to register student", details: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("organizationId");
    if (!orgId) {
      return NextResponse.json({ error: "organizationId query parameter required" }, { status: 400 });
    }
    const students = await prisma.student.findMany({
      where: { organizationId: orgId },
      orderBy: { fullName: "asc" },
      include: { _count: { select: { submissions: true } } },
    });
    return NextResponse.json({ students });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch students", details: String(err) }, { status: 500 });
  }
}
