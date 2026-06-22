import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [totalResult, todayResult, monthResult, orgCount] = await Promise.all([
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "success" } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "success", createdAt: { gte: startOfToday } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "success", createdAt: { gte: startOfMonth } } }),
      prisma.organization.count(),
    ]);
    return NextResponse.json({
      totalRevenue: totalResult._sum.amount || 0,
      todayRevenue: todayResult._sum.amount || 0,
      monthRevenue: monthResult._sum.amount || 0,
      totalOrganizations: orgCount,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch revenue data", details: String(err) }, { status: 500 });
  }
}
