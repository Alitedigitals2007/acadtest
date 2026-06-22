import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateCode } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password } = await req.json();
    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const existing = await prisma.organization.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Organization with this email already exists" }, { status: 409 });
    }
    const code = generateCode("ACAD");
    const hashed = await bcrypt.hash(password, 10);
    const org = await prisma.organization.create({
      data: {
        name,
        email,
        phone,
        code,
        users: {
          create: {
            name,
            email,
            password: hashed,
            role: "org_admin",
          },
        },
      },
      include: { users: true },
    });
    return NextResponse.json(
      { message: "Organization created", organization: { id: org.id, name: org.name, code: org.code } },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: "Registration failed", details: String(err) }, { status: 500 });
  }
}
