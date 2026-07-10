import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();
    if (!identifier || !password) {
      return NextResponse.json({ error: "Email/username and password are required" }, { status: 400 });
    }

    if (identifier === "admin@acadtest.com") {
      if (password === "Admin@123") {
        return NextResponse.json({
          user: {
            id: "super_admin",
            name: "Super Admin",
            email: "admin@acadtest.com",
            role: "super_admin",
          },
        });
      }
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
      include: { organization: { select: { id: true, name: true, code: true, status: true } } },
    });

    if (user) {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }
      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organization?.id,
          organizationName: user.organization?.name,
          organizationCode: user.organization?.code,
        },
      });
    }

    const student = await prisma.student.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
      include: { organization: { select: { id: true, name: true, code: true } } },
    });

    if (student) {
      const match = await bcrypt.compare(password, student.password);
      if (!match) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }
      return NextResponse.json({
        user: {
          id: student.id,
          name: student.fullName,
          email: student.email,
          username: student.username,
          role: "student",
          organizationId: student.organizationId,
          organizationName: student.organization?.name,
          organizationCode: student.organization?.code,
        },
      });
    }

    return NextResponse.json({ error: "No account found with this email/username. Please register first." }, { status: 401 });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
