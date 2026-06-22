"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function StudentTests() {
  const [tests, setTests] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("acadtest_user");
    if (!stored) return;
    const user = JSON.parse(stored);
    Promise.all([
      fetch(`/api/tests?organizationId=${user.organizationId}&studentView=true`).then((r) => r.json()),
      fetch(`/api/results?studentId=${user.id}`).then((r) => r.json()),
    ])
      .then(([testsData, resultsData]) => {
        setTests(testsData.tests || []);
        setSubmissions(resultsData.results || []);
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

  const available = tests.filter((t) => !submissions.find((s) => s.testId === t.id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Available Tests</h2>
        <p className="text-sm text-gray-500">{available.length} test{available.length !== 1 ? "s" : ""} available</p>
      </div>

      {available.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tests available</h3>
          <p className="text-gray-500 text-sm">Check back later when your instructor adds new tests.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {available.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base lg:text-lg font-bold text-gray-900 truncate">{t.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{t.numQuestions} questions &middot; {t.duration} minutes</p>
                  {t.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{t.description}</p>}
                </div>
                <Link
                  href={`/student/tests/${t.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-indigo-700 hover:to-blue-600 transition-all shadow-lg shadow-indigo-200 whitespace-nowrap"
                >
                  Start Test
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
