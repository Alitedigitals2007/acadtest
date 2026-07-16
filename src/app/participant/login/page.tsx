"use client";
import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import LatexText from "@/components/ui/latex-text";

interface ResultData {
  test: { id: string; title: string; immediateResult: boolean };
  participant: { id: string; fullName: string; email: string };
  result: { id: string; score: number | null; percentage: number | null; status: string; submittedAt: string; timeUsed?: number };
  hoursRemaining: number;
  giveCertificates?: boolean;
}

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  type: string;
}

const optionLabels = ["A", "B", "C", "D", "E", "F"];

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
  const [generatingCert, setGeneratingCert] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

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
        const parsed = data.questions.map((q: any) => ({
          ...q,
          options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
        }));
        setQuestions(parsed);
      }
    } catch {
      setError("Failed to load corrections");
    } finally {
      setCorrectionsLoading(false);
    }
  };

  const handlePrint = useCallback(() => {
    if (!result) return;
    const r = result.result;
    const name = result.participant.fullName;
    const testName = result.test.title;
    const score = r.score ?? 0;
    const percentage = r.percentage ?? 0;
    const qs = questions;
    const total = qs.length;
    const correct = qs.filter((q) => submittedAnswers[q.id] === q.correctAnswer).length;
    const date = new Date(r.submittedAt).toLocaleString();

    const printWin = window.open("", "_blank");
    if (!printWin) return;
    printWin.document.write(`
      <html><head><title>Result - ${testName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #4f46e5; margin: 0; font-size: 28px; }
        .header p { color: #666; margin: 5px 0 0; }
        .info { display: flex; justify-content: center; gap: 40px; margin-bottom: 30px; }
        .info-item { text-align: center; }
        .info-item .label { font-size: 12px; color: #999; }
        .info-item .value { font-size: 24px; font-weight: bold; color: #4f46e5; }
        .info-item .value.green { color: #059669; }
        .info-item .value.red { color: #dc2626; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; font-size: 14px; }
        th { background: #f9fafb; font-weight: 600; }
        .correct { background: #ecfdf5; }
        .incorrect { background: #fef2f2; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .badge-green { background: #d1fae5; color: #065f46; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #999; }
      </style></head><body>
        <div class="header">
          <h1>${testName}</h1>
          <p>${name}</p>
        </div>
        <div class="info">
          <div class="info-item"><div class="label">Score</div><div class="value">${score}/${total || "?"}</div></div>
          <div class="info-item"><div class="label">Percentage</div><div class="value ${percentage >= 50 ? "green" : "red"}">${percentage}%</div></div>
          <div class="info-item"><div class="label">Status</div><div class="value ${percentage >= 50 ? "green" : "red"}">${percentage >= 50 ? "Passed" : "Failed"}</div></div>
          <div class="info-item"><div class="label">Date</div><div class="value" style="font-size:14px;color:#666">${date}</div></div>
        </div>
        ${qs.length > 0 ? `
        <h3 style="margin-top: 30px;">Question Details</h3>
        <table>
          <thead><tr><th>#</th><th>Question</th><th>Your Answer</th><th>Correct Answer</th><th>Result</th></tr></thead>
          <tbody>
            ${qs.map((q, i) => {
              const userAns = submittedAnswers[q.id] || "(not answered)";
              const isCorrect = userAns === q.correctAnswer;
              const fa = q.options.findIndex((o) => o === userAns);
              const fc = q.options.findIndex((o) => o === q.correctAnswer);
              return `<tr class="${isCorrect ? "correct" : "incorrect"}">
                <td>${i + 1}</td>
                <td>${q.questionText}</td>
                <td>${fa >= 0 ? optionLabels[fa] + ". " + userAns : userAns}</td>
                <td>${fc >= 0 ? optionLabels[fc] + ". " + q.correctAnswer : q.correctAnswer}</td>
                <td><span class="badge ${isCorrect ? "badge-green" : "badge-red"}">${isCorrect ? "Correct" : "Wrong"}</span></td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>` : ""}
        <div class="footer">Generated by AcadTest &middot; ${new Date().toLocaleString()}</div>
      </body></html>
    `);
    printWin.document.close();
    printWin.print();
  }, [result, questions, submittedAnswers]);

  const handleDownloadCertificate = useCallback(async () => {
    if (!result) return;
    setGeneratingCert(true);
    await new Promise((r) => setTimeout(r, 300));
    try {
      const name = result.participant.fullName;
      const testName = result.test.title;
      const score = result.result.score ?? 0;
      const percentage = result.result.percentage ?? 0;
      const timeUsed = result.result.timeUsed || 0;
      const date = new Date(result.result.submittedAt).toLocaleDateString();

      if (!certRef.current) return;
      const { default: html2canvas } = await import("html2canvas");
      const { default: jsPDF } = await import("jspdf");
      const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Certificate-${testName.replace(/\s+/g, "_")}-${name.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("Certificate generation failed", err);
    }
    setGeneratingCert(false);
  }, [result]);

  if (result) {
    const { test, participant, result: r, hoursRemaining } = result;
    const qs = questions;
    const total = qs.length;
    const correct = qs.filter((q) => submittedAnswers[q.id] === q.correctAnswer).length;
    return (
      <>
      {/* Hidden certificate template */}
      <div ref={certRef} style={{
        width: "297mm", height: "210mm", padding: "20mm", position: "absolute", left: "-9999px", top: 0,
        background: "linear-gradient(135deg, #fefce8 0%, #fef3c7 50%, #fffbeb 100%)",
        fontFamily: "Arial, sans-serif", boxSizing: "border-box", overflow: "hidden"
      }}>
        <div style={{ border: "3px solid #d97706", borderRadius: "15px", height: "100%", padding: "25px", boxSizing: "border-box", position: "relative", background: "rgba(255,255,255,0.8)" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "14px", color: "#92400e", letterSpacing: "4px", textTransform: "uppercase" }}>Certificate of Participation</div>
            <div style={{ width: "80px", height: "3px", background: "#d97706", margin: "10px auto" }} />
          </div>
          <div style={{ textAlign: "center", marginBottom: "15px" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, #d97706, #f59e0b)", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "28px", color: "white", fontWeight: "bold" }}>A</span>
            </div>
          </div>
          <div style={{ textAlign: "center", marginBottom: "15px" }}>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#1f2937", marginBottom: "5px" }}>
              {participant.fullName}
            </div>
            <div style={{ fontSize: "16px", color: "#6b7280" }}>
              has successfully participated in
            </div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#d97706", margin: "8px 0" }}>
              {test.title}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "40px", margin: "20px 0" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px" }}>Score</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: r.percentage != null && r.percentage >= 50 ? "#059669" : "#dc2626" }}>
                {r.score ?? 0}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px" }}>Percentage</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: r.percentage != null && r.percentage >= 50 ? "#059669" : "#dc2626" }}>
                {r.percentage ?? 0}%
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px" }}>Date</div>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#374151" }}>
                {new Date(r.submittedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div style={{ textAlign: "center", fontSize: "13px", color: "#6b7280", margin: "15px 0", lineHeight: "1.6" }}>
            This certificate acknowledges participation in the assessment. The participant demonstrated their knowledge
            and skills by completing the test with the above-stated score.
          </div>
          <div style={{ position: "absolute", bottom: "25px", left: "25px", right: "25px", display: "flex", justifyContent: "space-between", alignItems: "end", borderTop: "1px solid #e5e7eb", paddingTop: "15px" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#9ca3af" }}>Generated by</div>
              <div style={{ fontSize: "14px", fontWeight: "bold", color: "#4f46e5" }}>AcadTest</div>
            </div>
            <div style={{ fontSize: "11px", color: "#9ca3af" }}>
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-xs text-emerald-700">Score</p>
                <p className="text-2xl font-bold text-emerald-600">{r.score ?? "-"}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-xs text-blue-700">Percentage</p>
                <p className={`text-2xl font-bold ${r.percentage != null && r.percentage >= 50 ? "text-emerald-600" : "text-red-600"}`}>{r.percentage !== null ? `${r.percentage}%` : "-"}</p>
              </div>
              <div className={`${r.percentage !== null && r.percentage >= 50 ? "bg-emerald-50" : "bg-red-50"} rounded-xl p-4 text-center`}>
                <p className="text-xs text-gray-700">Status</p>
                <p className={`text-lg font-bold ${r.percentage !== null && r.percentage >= 50 ? "text-emerald-600" : "text-red-600"}`}>
                  {r.percentage !== null ? (r.percentage >= 50 ? "Passed" : "Failed") : "Pending"}
                </p>
              </div>
            </div>

            {r.timeUsed != null && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
                <p className="text-xs text-gray-500">Time Used: <strong>{Math.floor(r.timeUsed / 60)}m {r.timeUsed % 60}s</strong></p>
              </div>
            )}

            <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs text-amber-700">Results available for <strong>{hoursRemaining} hours</strong> after test end.</p>
            </div>

            {!test.immediateResult && (
              <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-xs text-blue-700">Results were published by the administrator.</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-6">
              <Button variant="secondary" onClick={() => { setResult(null); setCode(""); setEmail(""); }}>
                Back to Login
              </Button>
              <Button variant="outline" onClick={() => { if (!showCorrections) handleShowCorrections(); setShowCorrections(!showCorrections); }} loading={correctionsLoading}>
                {showCorrections ? "Hide Corrections" : "Show Corrections"}
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                Print
              </Button>
              {(result.giveCertificates ?? true) && (
                <Button variant="outline" onClick={handleDownloadCertificate} loading={generatingCert}>
                  Certificate
                </Button>
              )}
              <a href={`/leaderboard?testId=${result.test.id}`} target="_blank"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100">
                Leaderboard
              </a>
            </div>

            {showCorrections && questions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-lg font-bold text-gray-900">Question Corrections</h3>
                  <div className="flex gap-3 text-sm">
                    <span className="text-emerald-600 font-medium">✓ {correct} Correct</span>
                    <span className="text-red-600 font-medium">✗ {total - correct} Incorrect</span>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {questions.map((q, idx) => {
                    const userAnswer = submittedAnswers[q.id];
                    const isCorrect = userAnswer === q.correctAnswer;
                    const uaIdx = q.options.findIndex((o) => o === userAnswer);
                    const caIdx = q.options.findIndex((o) => o === q.correctAnswer);
                    return (
                      <div key={q.id} className={`rounded-xl p-4 border ${isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                        <div className="flex items-start gap-3 mb-2">
                          <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isCorrect ? "bg-emerald-200 text-emerald-700" : "bg-red-200 text-red-700"}`}>{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900"><LatexText text={q.questionText} /></p>
                            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded ${isCorrect ? "bg-emerald-200 text-emerald-700" : "bg-red-200 text-red-700"}`}>
                              {isCorrect ? "Correct" : "Incorrect"}
                            </span>
                          </div>
                        </div>
                        <div className="ml-9 space-y-1">
                          {q.options.map((opt, oi) => {
                            const label = optionLabels[oi] || String(oi);
                            const isUserAns = userAnswer === opt;
                            const isCorrectAns = opt === q.correctAnswer;
                            return (
                              <div key={label} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${isCorrectAns ? "border-emerald-300 bg-emerald-50" : isUserAns ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}`}>
                                <span className={`font-mono w-5 ${isCorrectAns ? "text-emerald-700 font-bold" : isUserAns ? "text-red-700 font-bold" : "text-gray-500"}`}>{label}.</span>
                                <span className={`flex-1 ${isCorrectAns ? "text-emerald-800 font-medium" : isUserAns ? "text-red-800" : "text-gray-700"}`}><LatexText text={opt} /></span>
                                {isCorrectAns && <span className="text-emerald-600 font-bold text-xs bg-emerald-100 px-1.5 py-0.5 rounded">Correct Answer</span>}
                                {isUserAns && !isCorrectAns && <span className="text-red-600 font-bold text-xs bg-red-100 px-1.5 py-0.5 rounded">Your Answer</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </>
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
            <div className={`px-4 py-3 rounded-lg text-sm mb-4 ${error.includes("expired") ? "bg-yellow-50 text-yellow-700" : error.includes("already") ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"}`}>
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