"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

interface TestInfo {
  id: string;
  title: string;
  description: string;
  duration: number;
  numQuestions: number;
}

export default function JoinTest() {
  const params = useParams();
  const router = useRouter();
  const [test, setTest] = useState<TestInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ fullName: "", department: "", level: "100", email: "" });

  useEffect(() => {
    fetch(`/api/public?code=${params.code}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.test) setTest(data.test);
        else if (data.error) setError(data.error);
        else setError("Test not found");
      })
      .catch(() => setError("Failed to load test"))
      .finally(() => setLoading(false));
  }, [params.code]);

  const handleStart = () => {
    if (!form.fullName || !form.department || !form.email) {
      setError("Please fill in all fields");
      return;
    }
    localStorage.setItem(
      `participant_${params.code}`,
      JSON.stringify(form)
    );
    router.push(`/test/${params.code}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !test) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Test Not Found</h2>
          <p className="text-gray-600">The test with code <strong>{params.code}</strong> was not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">AcadTest</span>
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{test?.title}</h2>
            {test?.description && <p className="text-gray-500 mt-2">{test.description}</p>}
          </div>
          <div className="bg-blue-50 rounded-xl px-4 py-3 mb-6">
            <div className="flex justify-between text-sm text-blue-700">
              <span>Duration: <strong>{test?.duration} min</strong></span>
              <span>Questions: <strong>{test?.numQuestions}</strong></span>
            </div>
          </div>
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
          )}
          <div className="space-y-4">
            <Input label="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Your full name" required />
            <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Your department" required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {["100", "200", "300", "400", "500", "600", "700", "800"].map((l) => (
                  <option key={l} value={l}>{l} Level</option>
                ))}
              </select>
            </div>
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" required />
            <Button className="w-full" onClick={handleStart}>
              Start Test
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
