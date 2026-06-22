"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateTestPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", description: "", duration: "30", numQuestions: "10",
    startDate: "", endDate: "",
    shuffleQuestions: false, shuffleOptions: false, autoMark: true,
    showLeaderboard: false, enableCalculator: false, immediateResult: true,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const user = JSON.parse(localStorage.getItem("acadtest_user") || "{}");
    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          duration: parseInt(form.duration),
          numQuestions: parseInt(form.numQuestions),
          organizationId: user.organizationId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create test"); return; }
      router.push(`/org-admin/tests/${data.test.id}`);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
      <span className="text-sm text-gray-700">{label}</span>
      <button type="button" onClick={() => onChange(!value)} className={`relative w-10 h-5 rounded-full transition-colors ${value ? "bg-indigo-600" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${value ? "translate-x-5" : ""}`} />
      </button>
    </label>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Create New Test</h2>
        <p className="text-sm text-gray-500">Set up your test configuration</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8 shadow-sm space-y-6">
        {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Test Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. MTH101 Mid-Semester Exam" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description for students" rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (minutes)</label>
              <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} min="1" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of Questions</label>
              <input type="number" value={form.numQuestions} onChange={(e) => setForm({ ...form, numQuestions: e.target.value })} min="1" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
              <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
              <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Test Options</p>
          <Toggle label="Shuffle Questions" value={form.shuffleQuestions} onChange={(v) => setForm({ ...form, shuffleQuestions: v })} />
          <Toggle label="Shuffle Options" value={form.shuffleOptions} onChange={(v) => setForm({ ...form, shuffleOptions: v })} />
          <Toggle label="Automatic Marking" value={form.autoMark} onChange={(v) => setForm({ ...form, autoMark: v })} />
          <Toggle label="Show Leaderboard" value={form.showLeaderboard} onChange={(v) => setForm({ ...form, showLeaderboard: v })} />
          <Toggle label="Enable Calculator" value={form.enableCalculator} onChange={(v) => setForm({ ...form, enableCalculator: v })} />
          <Toggle label="Release Results Immediately" value={form.immediateResult} onChange={(v) => setForm({ ...form, immediateResult: v })} />
        </div>

        <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-blue-600 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200">
          {loading ? "Creating..." : "Create Test"}
        </button>
      </form>
    </div>
  );
}
