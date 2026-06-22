"use client";
import React, { useEffect, useState } from "react";

export default function StudentResults() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("acadtest_user");
    if (!stored) return;
    const user = JSON.parse(stored);
    fetch(`/api/results?studentId=${user.id}`)
      .then((r) => r.json())
      .then((data) => setResults(data.results || []))
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

  const avgScore = results.length > 0 ? Math.round(results.reduce((a: number, r: any) => a + (r.percentage || 0), 0) / results.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">My Results</h2>
          <p className="text-sm text-gray-500">{results.length} test{results.length !== 1 ? "s" : ""} completed</p>
        </div>
        {results.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-3 shadow-sm">
            <p className="text-xs text-gray-500">Average Score</p>
            <p className={`text-xl font-bold ${avgScore >= 50 ? "text-emerald-600" : "text-red-600"}`}>{avgScore}%</p>
          </div>
        )}
      </div>

      {results.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No results yet</h3>
          <p className="text-gray-500 text-sm">Complete a test to see your results here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {results.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 mr-4">
                  <h3 className="text-base font-semibold text-gray-900 truncate">{r.test?.title || "Test"}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{new Date(r.submittedAt).toLocaleDateString()} at {new Date(r.submittedAt).toLocaleTimeString()}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xl font-bold ${(r.percentage || 0) >= 50 ? "text-emerald-600" : "text-red-600"}`}>{r.percentage != null ? `${r.percentage}%` : "Pending"}</p>
                  <p className="text-xs text-gray-500">{r.score != null ? `${r.score} points` : "-"}</p>
                </div>
              </div>
              <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${(r.percentage || 0) >= 70 ? "bg-emerald-500" : (r.percentage || 0) >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(r.percentage || 0, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
