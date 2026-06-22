"use client";
import React, { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";

interface ResultData {
  test: { id: string; title: string; immediateResult: boolean };
  participant: { fullName: string; email: string };
  result: { id: string; score: number | null; percentage: number | null; status: string; submittedAt: string };
}

export default function CheckResultPage() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResultData | null>(null);

  const handleCheck = async () => {
    if (!code.trim() || !email.trim()) { setError("Please enter test code and email"); return; }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/public/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to check result"); return; }
      if (data.test.immediateResult) {
        setResult(data);
      } else {
        setError("Results for this test have not been released yet. Please check back later.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Check Your Result</h2>
            <p className="text-gray-500 mt-2">Enter your test code and email to view your result</p>
          </div>

          {error && (
            <div className={`px-4 py-3 rounded-lg text-sm mb-4 ${error.includes("not been released") ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"}`}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Test Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. ABC123"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-gray-400 text-center">Use the same email you used when taking the test</p>
            <Button className="w-full" onClick={handleCheck} loading={loading}>
              Check Result
            </Button>
          </div>

          {result && (
            <div className="mt-6 bg-blue-50 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{result.test.title}</h3>
              <p className="text-sm text-gray-600 mb-3">Name: <strong>{result.participant.fullName}</strong></p>
              <div className="flex flex-wrap gap-4 sm:gap-6 mb-3">
                <div>
                  <p className="text-xs text-blue-600">Score</p>
                  <p className="text-xl font-bold text-blue-900">{result.result.score ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-600">Percentage</p>
                  <p className="text-xl font-bold text-blue-900">{result.result.percentage != null ? `${result.result.percentage}%` : "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-600">Date</p>
                  <p className="text-sm font-medium text-blue-900">{new Date(result.result.submittedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                result.result.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
              }`}>{result.result.status}</div>
            </div>
          )}

          <div className="mt-6 text-center space-y-2">
            <Link href="/participant/login" className="text-sm text-indigo-600 hover:text-indigo-700 block font-medium">
              Login with test code (for public tests)
            </Link>
            <Link href="/exam" className="text-sm text-blue-600 hover:text-blue-700 block">
              Take a test
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
