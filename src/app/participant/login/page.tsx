"use client";
import React, { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import LatexText from "@/components/ui/latex-text";

interface ResultData {
  test: { id: string; title: string; immediateResult: boolean };
  participant: { id: string; fullName: string; email: string };
  result: { id: string; score: number | null; percentage: number | null; status: string; submittedAt: string };
  hoursRemaining: number;
}

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  type: string;
}

export default function ParticipantLoginPage() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResultData | null>(null);
  const [showCorrections, setShowCorrections] = useState(false);
  const [correctionsLoading, setCorrectionsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, string>>({});

  const handleLogin = async () => {
    if (!code.trim() || !email.trim()) {
      setError("Please enter both test code and email");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setShowCorrections(false);
    try {
      const res = await fetch("/api/public/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        if (data.pending) {
          setError(data.error + " Results will be available once published by the administrator.");
        }
        return;
      }
      setResult(data);
      const answers = JSON.parse(localStorage.getItem(`public_test_${code.trim()}_answers`) || "{}");
      setSubmittedAnswers(answers);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShowCorrections = async () => {
    if (!result) return;
    setCorrectionsLoading(true);
    setShowCorrections(true);
    try {
      const res = await fetch(`/api/public/result?code=${code.trim()}`);
      const data = await res.json();
      if (res.ok && data.questions) {
        setQuestions(data.questions);
      }
    } catch {
      setError("Failed to load corrections");
    } finally {
      setCorrectionsLoading(false);
    }
  };

  if (result) {
    const { test, participant, result: r, hoursRemaining } = result;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Result Available</h2>
              <p className="text-gray-500">{test.title}</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-700 font-medium">{participant.fullName}</p>
              <p className="text-xs text-blue-600">{participant.email}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-xs text-emerald-700">Score</p>
                <p className="text-2xl font-bold text-emerald-600">{r.score ?? "-"}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-xs text-blue-700">Percentage</p>
                <p className="text-2xl font-bold text-blue-900">{r.percentage !== null ? `${r.percentage}%` : "-"}</p>
              </div>
              <div className={`bg-${r.percentage && r.percentage >= 50 ? "emerald" : "red"}-50 rounded-xl p-4 text-center`}>
                <p className="text-xs text-gray-700">Status</p>
                <p className={`text-lg font-bold ${r.percentage && r.percentage >= 50 ? "text-emerald-600" : "text-red-600"}`}>
                  {r.percentage !== null ? (r.percentage >= 50 ? "Passed" : "Failed") : "Pending"}
                </p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs text-amber-700">Results available for <strong>{hoursRemaining} hours</strong> after test end.</p>
            </div>

            {!test.immediateResult && (
              <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-xs text-blue-700">Results were published by the administrator.</p>
              </div>
            )}

            <div className="flex gap-3 mb-6">
              <Button variant="secondary" onClick={() => { setResult(null); setCode(""); setEmail(""); }}>
                Back to Login
              </Button>
              {test.immediateResult && (
                <Button variant="outline" onClick={handleShowCorrections} loading={correctionsLoading}>
                  {showCorrections ? "Hide Corrections" : "Show Corrections"}
                </Button>
              )}
            </div>

            {showCorrections && questions.length > 0 && (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Question Corrections</h3>
                {questions.map((q, idx) => {
                  const userAnswer = submittedAnswers[q.id];
                  const isCorrect = userAnswer && userAnswer === q.correctAnswer;
                  return (
                    <div key={q.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-start gap-3 mb-2">
                        <span className="text-xs font-bold text-gray-400 bg-gray-200 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{idx + 1}</span>
                        <p className="text-sm font-medium text-gray-900"><LatexText text={q.questionText} /></p>
                      </div>
                      <div className="ml-9 space-y-1">
                        {q.options.map((opt, oi) => {
                          const label = ["A", "B", "C", "D"][oi];
                          const isUserAns = userAnswer === opt;
                          const isCorrectAns = opt === q.correctAnswer;
                          return (
                            <div
                              key={label}
                              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                                isCorrectAns
                                  ? "bg-emerald-100 text-emerald-800 font-medium"
                                  : isUserAns
                                  ? "bg-red-100 text-red-800"
                                  : "text-gray-700"
                              }`}
                            >
                              <span className="font-mono w-5">{label}.</span>
                              <LatexText text={opt} />
                              {isCorrectAns && <span className="text-emerald-600">✓</span>}
                              {isUserAns && !isCorrectAns && <span className="text-red-600">✗ your answer</span>}
                            </div>
                          );
                        })}
                      </div>
                      {userAnswer && userAnswer !== q.correctAnswer && (
                        <p className="mt-2 text-xs text-red-600">Your answer: {userAnswer}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Result</h2>
          <p className="text-gray-500 mb-6">Enter your test code and email to view your result</p>
          {error && (
            <div className={`px-4 py-3 rounded-lg text-sm mb-4 ${error.includes("expired") ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"}`}>
              {error}
            </div>
          )}
          <div className="space-y-4">
            <Input
              label="Test Code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. MAT101-12345"
            />
            <Input
              label="Your Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Button className="w-full" onClick={handleLogin} loading={loading}>
              View Result
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}