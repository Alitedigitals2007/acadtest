"use client";
import React, { useEffect, useState } from "react";

interface Result {
  id: string;
  score: number | null;
  percentage: number | null;
  status: string;
  submittedAt: string;
  student: { id: string; fullName: string; email: string; department: string; level: string } | null;
  participant: { id: string; fullName: string; email: string; department: string; level: string } | null;
  test: { id: string; title: string; autoMark: boolean };
}

export default function OrgAdminResults() {
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("acadtest_user");
    if (!stored) return;
    const user = JSON.parse(stored);
    fetch(`/api/tests?organizationId=${user.organizationId}`)
      .then((r) => r.json())
      .then((data) => setTests(data.tests || []))
      .catch(console.error)
      .finally(() => setLoadingTests(false));
  }, []);

  const fetchResults = async (testId: string) => {
    if (!testId) return;
    setLoadingResults(true);
    try {
      const res = await fetch(`/api/results?testId=${testId}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) { console.error(err); }
    finally { setLoadingResults(false); }
  };

  const handleRelease = async () => {
    if (!selectedTestId) return;
    setReleasing(true);
    await fetch("/api/results/release", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testId: selectedTestId }),
    });
    setReleasing(false);
    alert("Results released! Students can now view their scores.");
  };

  const selectedTest = tests.find((t) => t.id === selectedTestId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Results Management</h2>
        <p className="text-sm text-gray-500">View and manage test results</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Test</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedTestId}
            onChange={(e) => { setSelectedTestId(e.target.value); fetchResults(e.target.value); }}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Choose a test...</option>
            {tests.map((t) => (
              <option key={t.id} value={t.id}>{t.title} ({t.publicCode})</option>
            ))}
          </select>
          {selectedTest && !selectedTest.immediateResult && (
            <button
              onClick={handleRelease}
              disabled={releasing}
              className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {releasing ? "Releasing..." : "Release Results"}
            </button>
          )}
        </div>
      </div>

      {loadingResults ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
        </div>
      ) : results.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                  <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Department</th>
                  <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                  <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Percentage</th>
                  <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {results.map((r) => {
                  const name = r.student?.fullName || r.participant?.fullName || "Unknown";
                  const email = r.student?.email || r.participant?.email || "";
                  const dept = r.student?.department || r.participant?.department || "-";
                  return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 lg:px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{name}</p>
                      <p className="text-xs text-gray-500">{email}</p>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">{dept}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm font-semibold text-gray-900">{r.score ?? "-"} / {r.test?.autoMark ? "Auto" : "?"}</td>
                    <td className="px-4 lg:px-6 py-4">
                      <span className={`text-sm font-bold ${(r.percentage || 0) >= 50 ? "text-emerald-600" : "text-red-600"}`}>
                        {r.percentage != null ? `${r.percentage}%` : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${r.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{r.status}</span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedTestId ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <p className="text-gray-500 text-sm">No submissions for this test yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <p className="text-gray-500 text-sm">Select a test to view results.</p>
        </div>
      )}
    </div>
  );
}
