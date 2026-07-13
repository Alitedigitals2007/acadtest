"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import LatexText from "@/components/ui/latex-text";

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  type: string;
}

interface Result {
  id: string;
  testId: string;
  studentId?: string;
  participantId?: string;
  score: number | null;
  percentage: number | null;
  status: string;
  submittedAt: string;
  answers: string;
  timeUsed?: number;
  resultReleased: boolean;
  test?: {
    id: string;
    title: string;
    autoMark: boolean;
    immediateResult: boolean;
    scheduledReleaseAt?: string;
    endDate?: string;
  };
  student?: { id: string; fullName: string; email: string };
  participant?: { id: string; fullName: string; email: string };
}

const getAnswerMap = (answersStr: string) => {
  try { return JSON.parse(answersStr); } catch { return {}; }
};

const optionLabels = ["A", "B", "C", "D", "E", "F"];

export default function StudentResults() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [corrections, setCorrections] = useState<Record<string, Question[]>>({});
  const [correctionsLoading, setCorrectionsLoading] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [certificateResult, setCertificateResult] = useState<Result | null>(null);
  const [generatingCert, setGeneratingCert] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("acadtest_user");
    if (!stored) return;
    const u = JSON.parse(stored);
    setUser(u);
    fetch(`/api/results?studentId=${u.id}`)
      .then((r) => r.json())
      .then((data) => setResults(data.results || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggleCorrections = async (r: Result) => {
    if (expandedId === r.id) { setExpandedId(null); return; }
    setExpandedId(r.id);
    if (!corrections[r.testId]) {
      setCorrectionsLoading(r.id);
      try {
        const res = await fetch(`/api/questions?testId=${r.testId}`);
        const data = await res.json();
        const parsed = (data.questions || []).map((q: any) => ({
          ...q,
          options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
        }));
        setCorrections((prev) => ({ ...prev, [r.testId]: parsed }));
      } catch { }
      setCorrectionsLoading(null);
    }
  };

  const handlePrint = useCallback((r: Result) => {
    const name = user?.fullName || r.student?.fullName || r.participant?.fullName || "Student";
    const testName = r.test?.title || "Test";
    const score = r.score ?? 0;
    const percentage = r.percentage ?? 0;
    const answers = getAnswerMap(r.answers);
    const qs = corrections[r.testId] || [];
    const total = qs.length;
    const correct = qs.filter((q) => answers[q.id] === q.correctAnswer).length;
    const incorrect = total - correct;
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
        .info-item .value.amber { color: #d97706; }
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
          <div class="info-item"><div class="label">Score</div><div class="value">${score}/${total}</div></div>
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
              const userAns = answers[q.id] || "(not answered)";
              const isCorrect = userAns === q.correctAnswer;
              const fa = q.options.findIndex((o: string) => o === userAns);
              const fc = q.options.findIndex((o: string) => o === q.correctAnswer);
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
  }, [corrections, user]);

  const handleDownloadCertificate = useCallback(async (r: Result) => {
    setCertificateResult(r);
    setGeneratingCert(true);
    // wait for render
    await new Promise((r) => setTimeout(r, 300));
    try {
      const name = user?.fullName || r.student?.fullName || r.participant?.fullName || "Student";
      const testName = r.test?.title || "Test";
      const score = r.score ?? 0;
      const total = (corrections[r.testId] || []).length;
      const percentage = r.percentage ?? 0;
      const timeUsed = r.timeUsed || 0;
      const date = new Date(r.submittedAt).toLocaleDateString();

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
    setCertificateResult(null);
  }, [corrections, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const released = results.filter((r) => r.resultReleased);
  const pending = results.filter((r) => !r.resultReleased);
  const avgScore = released.length > 0 ? Math.round(released.reduce((a: number, r: any) => a + (r.percentage || 0), 0) / released.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">My Results</h2>
          <p className="text-sm text-gray-500">{results.length} test{results.length !== 1 ? "s" : ""} completed</p>
        </div>
        {released.length > 0 && (
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
          {pending.length > 0 && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
              <h4 className="text-sm font-semibold text-amber-800 mb-2">Results Pending</h4>
              <p className="text-xs text-amber-700">Your results for {pending.length} test{pending.length !== 1 ? "s" : ""} will be available once the administrator releases them.</p>
            </div>
          )}
          {results.map((r) => {
            const answers = getAnswerMap(r.answers);
            const qs = corrections[r.testId] || [];
            const total = qs.length;
            const correct = qs.filter((q) => answers[q.id] === q.correctAnswer).length;
            return (
            <div key={r.id}>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 mr-4">
                    <h3 className="text-base font-semibold text-gray-900 truncate">{r.test?.title || "Test"}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(r.submittedAt).toLocaleDateString()} at {new Date(r.submittedAt).toLocaleTimeString()}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {r.resultReleased ? (
                      <>
                        <p className={`text-xl font-bold ${(r.percentage || 0) >= 50 ? "text-emerald-600" : "text-red-600"}`}>{r.percentage != null ? `${r.percentage}%` : "-"}</p>
                        <p className="text-xs text-gray-500">{r.score != null ? `${r.score} points` : "-"}</p>
                      </>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Pending</span>
                    )}
                  </div>
                </div>
                {r.resultReleased && (
                  <>
                    <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${(r.percentage || 0) >= 70 ? "bg-emerald-500" : (r.percentage || 0) >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${Math.min(r.percentage || 0, 100)}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => handleToggleCorrections(r)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 px-3 py-1.5 bg-indigo-50 rounded-lg">
                        {expandedId === r.id ? "Hide Corrections" : "Show Corrections"}
                        <svg className={`w-3.5 h-3.5 transition-transform ${expandedId === r.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      <button onClick={() => handlePrint(r)}
                        className="text-xs font-medium text-gray-600 hover:text-gray-700 flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Print
                      </button>
                      <button onClick={() => handleDownloadCertificate(r)} disabled={generatingCert}
                        className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1 px-3 py-1.5 bg-amber-50 rounded-lg disabled:opacity-50">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Certificate
                      </button>
                      <a href={`/leaderboard?testId=${r.testId}`} target="_blank"
                        className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1 px-3 py-1.5 bg-purple-50 rounded-lg">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        Leaderboard
                      </a>
                    </div>
                  </>
                )}
              </div>
              {expandedId === r.id && (
                <div className="mt-2 bg-gray-50 rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4 border-b pb-3">
                    <h4 className="text-sm font-bold text-gray-900">Question Corrections</h4>
                    {total > 0 && (
                      <div className="flex gap-3 text-xs">
                        <span className="text-emerald-600 font-medium">✓ {correct} Correct</span>
                        <span className="text-red-600 font-medium">✗ {total - correct} Incorrect</span>
                      </div>
                    )}
                  </div>
                  {correctionsLoading === r.id ? (
                    <p className="text-xs text-gray-400 text-center py-4">Loading corrections...</p>
                  ) : total === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No questions loaded.</p>
                  ) : (
                    <div className="space-y-3">
                      {qs.map((q, idx) => {
                        const userAnswer = answers[q.id];
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
                              {q.options.map((opt: string, oi: number) => {
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
                  )}
                </div>
              )}
            </div>
          );})}
        </div>
      )}

      {/* Hidden certificate template */}
      {certificateResult && (
        <div ref={certRef} style={{
          width: "297mm", height: "210mm", padding: "20mm", position: "absolute", left: "-9999px", top: 0,
          background: "linear-gradient(135deg, #fefce8 0%, #fef3c7 50%, #fffbeb 100%)",
          fontFamily: "Arial, sans-serif", boxSizing: "border-box", overflow: "hidden"
        }}>
          {/* Decorative border */}
          <div style={{ border: "3px solid #d97706", borderRadius: "15px", height: "100%", padding: "25px", boxSizing: "border-box", position: "relative", background: "rgba(255,255,255,0.8)" }}>
            {/* Top decoration */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ fontSize: "14px", color: "#92400e", letterSpacing: "4px", textTransform: "uppercase" }}>Certificate of Participation</div>
              <div style={{ width: "80px", height: "3px", background: "#d97706", margin: "10px auto" }} />
            </div>

            {/* Badge icon */}
            <div style={{ textAlign: "center", marginBottom: "15px" }}>
              <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, #d97706, #f59e0b)", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "28px", color: "white", fontWeight: "bold" }}>A</span>
              </div>
            </div>

            <div style={{ textAlign: "center", marginBottom: "15px" }}>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "#1f2937", marginBottom: "5px" }}>
                {user?.fullName || certificateResult.student?.fullName || certificateResult.participant?.fullName || "Student"}
              </div>
              <div style={{ fontSize: "16px", color: "#6b7280" }}>
                has successfully participated in
              </div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#d97706", margin: "8px 0" }}>
                {certificateResult.test?.title || "Test"}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "40px", margin: "20px 0" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px" }}>Score</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: certificateResult.percentage != null && certificateResult.percentage >= 50 ? "#059669" : "#dc2626" }}>
                  {certificateResult.score ?? 0}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px" }}>Percentage</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: certificateResult.percentage != null && certificateResult.percentage >= 50 ? "#059669" : "#dc2626" }}>
                  {certificateResult.percentage ?? 0}%
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px" }}>Date</div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#374151" }}>
                  {new Date(certificateResult.submittedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div style={{ textAlign: "center", fontSize: "13px", color: "#6b7280", margin: "15px 0", lineHeight: "1.6" }}>
              This certificate acknowledges participation in the assessment. The participant demonstrated their knowledge
              and skills by completing the test with the above-stated score.
            </div>

            {/* Bottom */}
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
      )}
    </div>
  );
}