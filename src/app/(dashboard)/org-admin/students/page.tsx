"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OrgAdminStudents() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ fullName: "", department: "", level: "", email: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("acadtest_user") || "{}") : {};

  const fetchStudents = () => {
    if (!user.organizationId) return;
    fetch(`/api/students?organizationId=${user.organizationId}`)
      .then((r) => r.json())
      .then((data) => setStudents(data.students || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStudents() }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, organizationCode: user.organizationCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to add student"); return; }
      setShowModal(false);
      setForm({ fullName: "", department: "", level: "", email: "", username: "", password: "" });
      fetchStudents();
    } catch { setError("Network error"); }
    finally { setSubmitting(false); }
  };

  const downloadStudentTemplate = () => {
    const csv = "fullname,department,level,email,username\nJohn Doe,Computer Science,200,john@school.edu,johndoe\nJane Smith,Mathematics,300,jane@school.edu,janesmith";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
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
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Students</h2>
          <p className="text-sm text-gray-500">{students.length} student{students.length !== 1 ? "s" : ""} registered</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-indigo-700 hover:to-blue-600 transition-all shadow-lg shadow-indigo-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Student
          </button>
          <button onClick={downloadStudentTemplate} className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            CSV Template
          </button>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No students yet</h3>
          <p className="text-gray-500 text-sm mb-6">Add students manually or upload in bulk</p>
          <button onClick={() => setShowModal(true)} className="inline-flex px-5 py-2.5 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors">Add Student</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Department</th>
                  <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Level</th>
                  <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Email</th>
                  <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Username</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">{s.fullName.charAt(0)}</div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[120px] lg:max-w-none">{s.fullName}</p>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">{s.department}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 hidden md:table-cell">{s.level}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">{s.email}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-700 font-mono">{s.username}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Add Student</h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>}
              <form onSubmit={handleAdd} className="space-y-4">
                <input type="text" placeholder="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <input type="text" placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <input type="text" placeholder="Level (e.g. 200)" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <input type="text" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">{submitting ? "Adding..." : "Add Student"}</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
