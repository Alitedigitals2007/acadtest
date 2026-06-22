"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("acadtest_user");
    if (!stored) return;
    const u = JSON.parse(stored);
    setUser(u);

    Promise.all([
      fetch(`/api/tests?organizationId=${u.organizationId}&studentView=true`).then((r) => r.json()),
      fetch(`/api/results?studentId=${u.id}`).then((r) => r.json()),
    ])
      .then(([testsData, resultsData]) => {
        setTests(testsData.tests || []);
        setResults(resultsData.results || []);
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

  const completed = results.length;
  const pending = tests.filter((t) => !results.find((r) => r.testId === t.id)).length;
  const avgScore = completed > 0 ? Math.round(results.reduce((a: number, r: any) => a + (r.percentage || 0), 0) / completed) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 lg:p-8 text-white shadow-xl">
        <h2 className="text-xl lg:text-2xl font-bold">Welcome, {user?.name || "Student"}!</h2>
        <p className="text-indigo-100 mt-1 text-sm">Ready to take your tests? Let&apos;s get started.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
          <p className="text-2xl lg:text-3xl font-bold text-indigo-600">{pending}</p>
          <p className="text-xs lg:text-sm text-gray-600 mt-1">Available</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
          <p className="text-2xl lg:text-3xl font-bold text-emerald-600">{completed}</p>
          <p className="text-xs lg:text-sm text-gray-600 mt-1">Completed</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
          <p className={`text-2xl lg:text-3xl font-bold ${avgScore >= 50 ? "text-emerald-600" : "text-red-600"}`}>{avgScore}%</p>
          <p className="text-xs lg:text-sm text-gray-600 mt-1">Avg Score</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm">
          <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-4">Available Tests</h3>
          {tests.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No tests available</p>
          ) : (
            <div className="space-y-3">
              {tests.slice(0, 5).map((t: any) => {
                const done = results.find((r) => r.testId === t.id);
                return (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                      <p className="text-xs text-gray-500">{t.numQuestions} questions &middot; {t.duration} min</p>
                    </div>
                    {done ? (
                      <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full">Done</span>
                    ) : (
                      <Link href={`/student/tests/${t.id}`} className="text-xs font-medium text-white bg-indigo-600 px-3 py-1.5 rounded-xl hover:bg-indigo-700 transition-colors">
                        Start
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm">
          <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-4">Recent Results</h3>
          {results.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No results yet</p>
          ) : (
            <div className="space-y-3">
              {results.slice(0, 5).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.test?.title || "Test"}</p>
                    <p className="text-xs text-gray-500">{new Date(r.submittedAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${(r.percentage || 0) >= 50 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {r.percentage || 0}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold">Powered by Prepium</h3>
            <p className="text-purple-100 text-sm mt-1">Prepare for examinations and improve your academic performance.</p>
          </div>
          <a href="https://theprepium.vercel.app" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-colors whitespace-nowrap">
            Visit Prepium
          </a>
        </div>
      </div>
    </div>
  );
}
