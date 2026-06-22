"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OrgAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recent, setRecent] = useState<{ tests: any[]; students: any[] }>({ tests: [], students: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("acadtest_user");
    if (!stored) return;
    const user = JSON.parse(stored);
    const orgId = user.organizationId;

    Promise.all([
      fetch(`/api/organizations/${orgId}`).then((r) => r.json()),
      fetch(`/api/tests?organizationId=${orgId}`).then((r) => r.json()),
      fetch(`/api/students?organizationId=${orgId}`).then((r) => r.json()),
    ])
      .then(([orgData, testsData, studentsData]) => {
        const org = orgData.organization;
        if (org?.status === "pending") { router.push("/org-admin/payment"); return; }
        setStats({
          testsUsed: org.testsUsed || 0, testLimit: org.testLimit || 0, bonusTests: org.bonusTests || 0,
          studentsUsed: org.studentsUsed || 0, studentLimit: org.studentLimit || 0, bonusStudents: org.bonusStudents || 0,
          status: org.status, code: org.code,
        });
        setRecent({
          tests: (testsData.tests || []).slice(-5).reverse(),
          students: (studentsData.students || []).slice(-5).reverse(),
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
  }

  const testsRemaining = (stats?.testLimit || 0) + (stats?.bonusTests || 0) - (stats?.testsUsed || 0);
  const studentsRemaining = (stats?.studentLimit || 0) + (stats?.bonusStudents || 0) - (stats?.studentsUsed || 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tests Used</p>
          <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{stats?.testsUsed || 0}</p>
          <p className="text-xs text-gray-400 mt-1">{testsRemaining} remaining</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tests Remaining</p>
          <p className={`text-2xl lg:text-3xl font-bold mt-1 ${testsRemaining <= 5 ? "text-red-600" : "text-emerald-600"}`}>{testsRemaining}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Students</p>
          <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{stats?.studentsUsed || 0}</p>
          <p className="text-xs text-gray-400 mt-1">of {stats?.studentLimit || 0} limit</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Students Left</p>
          <p className={`text-2xl lg:text-3xl font-bold mt-1 ${studentsRemaining <= 20 ? "text-red-600" : "text-emerald-600"}`}>{studentsRemaining}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base lg:text-lg font-bold text-gray-900">Recent Tests</h3>
            <Link href="/org-admin/tests" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View all</Link>
          </div>
          {recent.tests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm mb-3">No tests created yet</p>
              <Link href="/org-admin/tests/create" className="inline-flex px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors">Create Test</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.tests.map((t: any) => (
                <Link key={t.id} href={`/org-admin/tests/${t.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                    <p className="text-xs text-gray-500">{t.publicCode} &middot; {t.numQuestions} questions</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base lg:text-lg font-bold text-gray-900">Recent Students</h3>
            <Link href="/org-admin/students" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View all</Link>
          </div>
          {recent.students.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No students registered yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.students.map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">{s.fullName.charAt(0)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.fullName}</p>
                    <p className="text-xs text-gray-500">{s.department} &middot; {s.level}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-5 lg:p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <p className="text-indigo-100 text-xs uppercase tracking-wider font-medium">Organization Code</p>
            <p className="text-2xl lg:text-3xl font-bold mt-1 font-mono">{stats?.code || "N/A"}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/org-admin/tests/create" className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-colors">Create Test</Link>
            <Link href="/org-admin/students" className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-colors">Add Students</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
