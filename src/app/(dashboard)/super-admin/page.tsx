"use client";
import React, { useEffect, useState } from "react";

interface RevenueData { totalRevenue: number; todayRevenue: number; monthRevenue: number; totalOrganizations: number; }
interface OrgStats { total: number; active: number; suspended: number; totalStudents: number; totalTests: number; totalQuizAttempts: number; }

export default function SuperAdminDashboard() {
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [orgStats, setOrgStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/organizations/revenue").then((r) => r.json()),
      fetch("/api/organizations").then((r) => r.json()),
    ])
      .then(([revData, orgData]) => {
        setRevenue(revData);
        if (orgData.organizations) {
          const orgs = orgData.organizations;
          const total = orgs.length;
          const active = orgs.filter((o: { status: string }) => o.status === "active").length;
          const suspended = orgs.filter((o: { status: string }) => o.status === "suspended").length;
          const totalStudents = orgs.reduce((acc: number, o: { _count: { students: number } }) => acc + (o._count?.students || 0), 0);
          const totalTests = orgs.reduce((acc: number, o: { _count: { tests: number } }) => acc + (o._count?.tests || 0), 0);
          setOrgStats({ total, active, suspended, totalStudents, totalTests, totalQuizAttempts: 0 });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const stats = [
    { label: "Total Revenue", value: `₦${(revenue?.totalRevenue || 0).toLocaleString()}`, sub: "All time", color: "from-indigo-500 to-blue-500" },
    { label: "Revenue Today", value: `₦${(revenue?.todayRevenue || 0).toLocaleString()}`, sub: "Today", color: "from-emerald-500 to-teal-500" },
    { label: "Revenue This Month", value: `₦${(revenue?.monthRevenue || 0).toLocaleString()}`, sub: "This month", color: "from-violet-500 to-purple-500" },
  ];

  const orgCards = [
    { label: "Total Organizations", value: orgStats?.total || 0, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Active", value: orgStats?.active || 0, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Suspended", value: orgStats?.suspended || 0, color: "text-red-600", bg: "bg-red-50" },
    { label: "Total Students", value: orgStats?.totalStudents || 0, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Tests", value: orgStats?.totalTests || 0, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Quiz Attempts", value: orgStats?.totalQuizAttempts || 0, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {stats.map((s) => (
          <div key={s.label} className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${s.color} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2`} />
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
        {orgCards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className={`text-2xl lg:text-3xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs lg:text-sm text-gray-600 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 lg:p-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg lg:text-xl font-bold">Platform Overview</h3>
            <p className="text-indigo-100 text-sm mt-1">Monitor your entire platform from one dashboard</p>
          </div>
          <a href="/super-admin/organizations" className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-colors whitespace-nowrap">
            Manage Organizations
          </a>
        </div>
      </div>
    </div>
  );
}
