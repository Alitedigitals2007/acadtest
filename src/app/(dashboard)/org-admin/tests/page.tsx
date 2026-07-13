"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OrgAdminTests() {
  const router = useRouter();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("acadtest_user");
    if (!stored) { router.push("/login"); return; }
    const user = JSON.parse(stored);
    fetch(`/api/tests?organizationId=${user.organizationId}`)
      .then((r) => r.json())
      .then((data) => setTests(data.tests || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this test and all its data?")) return;
    await fetch(`/api/tests/${id}`, { method: "DELETE" });
    setTests(tests.filter((t) => t.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">My Tests</h2>
          <p className="text-sm text-gray-500">{tests.length} test{tests.length !== 1 ? "s" : ""} created</p>
        </div>
        <Link href="/org-admin/tests/create" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-indigo-700 hover:to-blue-600 transition-all shadow-lg shadow-indigo-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Create Test
        </Link>
      </div>

      {tests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tests yet</h3>
          <p className="text-gray-500 text-sm mb-6">Create your first test to get started</p>
          <Link href="/org-admin/tests/create" className="inline-flex px-5 py-2.5 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors">Create Test</Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
                  <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Status</th>
                  <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Code</th>
                  <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Questions</th>
                  <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Duration</th>
                  <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Created</th>
                  <th className="text-right px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tests.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 lg:px-6 py-4">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[180px] lg:max-w-none">{t.title}</p>
                    </td>
                    <td className="px-4 lg:px-6 py-4 hidden sm:table-cell">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                        t.status === "open" ? "bg-emerald-100 text-emerald-700" :
                        t.status === "paused" ? "bg-amber-100 text-amber-700" :
                        t.status === "closed" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>{t.status || "draft"}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 hidden sm:table-cell">
                      <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded-md">{t.publicCode}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 hidden md:table-cell">{t.numQuestions}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 hidden md:table-cell">{t.duration} min</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 lg:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/org-admin/tests/${t.id}`} className="px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">View</Link>
                        <button onClick={() => handleDelete(t.id)} className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
