"use client";
import React, { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";

interface ResultData {
  test: { id: string; title: string; immediateResult: boolean };
  participant: { id: string; fullName: string; email: string };
  result: { id: string; score: number | null; percentage: number | null; status: string; submittedAt: string };
  hoursRemaining: number;
}

export default function ParticipantLoginPage() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResultData | null>(null);

  const handleLogin = async () => {
    if (!code.trim() || !email.trim()) {
      setError("Please enter both test code and email");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/public/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
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
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome, {result.participant.fullName}!</h2>
              <p className="text-gray-500 mt-1">{result.test.title}</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-5 mb-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs text-blue-600 mb-1">Score</p>
                  <p className="text-3xl font-bold text-blue-700">{result.result.score ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-600 mb-1">Percentage</p>
                  <p className="text-3xl font-bold text-blue-700">{result.result.percentage != null ? `${result.result.percentage}%` : "-"}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 mb-4 px-1">
              <span>Submitted: {new Date(result.result.submittedAt).toLocaleDateString()}</span>
              <span className={`px-2 py-0.5 rounded-full font-medium ${
                result.result.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              }`}>{result.result.status}</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
              <p className="text-xs text-amber-700 text-center">
                You can check your result again within <strong>{result.hoursRemaining} hours</strong>. After 48 hours from the test end time, this will no longer be available.
              </p>
            </div>

            <div className="space-y-3">
              <Button className="w-full" onClick={() => { setResult(null); setCode(""); setEmail(""); }}>
                Check Another Result
              </Button>
              <Link href="/" className="block text-center text-sm text-gray-500 hover:text-gray-700">
                Go Home
              </Link>
            </div>
          </div>
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
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Check Your Result</h2>
            <p className="text-gray-500 mt-2">Login with your test code and email to view your result</p>
          </div>

          {error && (
            <div className={`px-4 py-3 rounded-lg text-sm mb-4 ${error.includes("expired") ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"}`}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Test Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <p className="text-xs text-gray-400 text-center">Use the email you used when taking the test. Results available for 48 hours after the test ends.</p>
            <Button className="w-full" onClick={handleLogin} loading={loading}>
              Login & View Result
            </Button>
          </div>

          <div className="mt-6 text-center space-y-2">
            <Link href="/exam" className="block text-sm text-blue-600 hover:text-blue-700">
              Take a test
            </Link>
            <Link href="/" className="block text-sm text-gray-500 hover:text-gray-700">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
