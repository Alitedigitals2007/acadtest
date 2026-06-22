import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API = "https://api.paystack.co";

export async function POST(req: NextRequest) {
  try {
    const { organizationId, amount, email, package: pkg } = await req.json();
    if (!organizationId || !amount || !email || !pkg) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }
    const reference = `ACAD-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const paystackRes = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100),
        reference,
        metadata: { organizationId, package: pkg },
      }),
    });
    const paystackData = await paystackRes.json();
    if (!paystackData.status) {
      return NextResponse.json({ error: "Paystack initialization failed", details: paystackData.message || paystackData }, { status: 500 });
    }
    await prisma.payment.create({
      data: {
        organizationId,
        amount,
        reference,
        status: "pending",
        package: pkg,
      },
    });
    return NextResponse.json({ reference, authorization_url: paystackData.data?.authorization_url });
  } catch (err) {
    return NextResponse.json({ error: "Payment initialization failed", details: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      const payments = await prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        include: { organization: { select: { id: true, name: true, email: true } } },
      });
      return NextResponse.json({ payments });
    }

    const response = await fetch(`${PAYSTACK_API}/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const data = await response.json();
    if (!data.status || data.data.status !== "success") {
      return NextResponse.json({ error: "Payment verification failed", paystack: data }, { status: 400 });
    }
    const payment = await prisma.payment.findUnique({ where: { reference } });
    if (!payment) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }
    await prisma.payment.update({
      where: { reference },
      data: { status: "success" },
    });
    const pkg = payment.package || "";
    let testInc = 0;
    let studentInc = 0;

    if (pkg.includes("Starter")) { testInc = 10; studentInc = 200; }
    else if (pkg.includes("Standard")) { testInc = 30; studentInc = 500; }
    else if (pkg.includes("Professional")) { testInc = 75; studentInc = 2000; }
    else if (pkg.includes("Institution")) { testInc = 200; studentInc = 10000; }
    if (pkg.includes("+5 Tests")) testInc += 5;
    if (pkg.includes("+10 Tests")) testInc += 10;
    if (pkg.includes("+25 Tests")) testInc += 25;
    if (pkg.includes("+100 Students")) studentInc += 100;
    if (pkg.includes("+500 Students")) studentInc += 500;
    if (pkg.includes("+1000 Students")) studentInc += 1000;

    await prisma.organization.update({
      where: { id: payment.organizationId },
      data: {
        status: "active",
        testLimit: { increment: testInc },
        studentLimit: { increment: studentInc },
      },
    });
    return NextResponse.json({ message: "Payment verified and organization activated", payment });
  } catch (err) {
    return NextResponse.json({ error: "Payment verification failed", details: String(err) }, { status: 500 });
  }
}
