"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import Calculator from "@/components/ui/calculator";
import LatexText from "@/components/ui/latex-text";

interface TestInfo {
  id: string;
  title: string;
  description: string;
  duration: number;
  numQuestions: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  enableCalculator: boolean;
  immediateResult: boolean;
  questions: Question[];
}

interface Question {
  id: string;
  type: string;
  questionText: string;
  options: string[];
  orderIndex: number;
}

type Step = "code" | "form" | "instructions" | "test" | "result";

export default function ExamPage() {
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [test, setTest] = useState<TestInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", department: "", level: "100" });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; percentage: number } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [tabWarningMsg, setTabWarningMsg] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const shuffleArray = (arr: unknown[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const handleCodeSubmit = async () => {
    if (!code.trim()) { setError("Please enter a test code"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/public?code=${code.trim()}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Test not found"); setLoading(false); return; }
      let questions = [...(data.test.questions || [])];
      if (data.test.shuffleOptions) {
        questions = questions.map((q: Question) => ({ ...q, options: shuffleArray(q.options) }));
      }
      setTest({ ...data.test, questions });
      setStep("form");
    } catch {
      setError("Failed to load test");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.department.trim()) { setError("Please fill in all fields"); return; }
    localStorage.setItem(`exam_${code}_participant`, JSON.stringify(form));
    setStep("instructions");
  };

  const startTest = () => {
    const durationSeconds = test!.duration * 60;
    localStorage.setItem(`exam_${code}_time`, String(Date.now()));
    setTimeLeft(durationSeconds);
    setStep("test");
    setTabSwitchCount(0);
    try {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (step !== "test") return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            setTabWarningMsg("You have switched tabs 3 times. Your test will be auto-submitted.");
            setShowTabWarning(true);
            setTimeout(() => {
              handleSubmit();
            }, 2000);
          } else {
            setTabWarningMsg(`Warning: Tab switching detected (${newCount}/3). After 3 switches, your test will be auto-submitted.`);
            setShowTabWarning(true);
            setTimeout(() => setShowTabWarning(false), 3000);
          }
          return newCount;
        });
      }
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && step === "test") {
        setIsFullscreen(false);
        setTabWarningMsg("Warning: You exited fullscreen. Please stay in fullscreen mode.");
        setShowTabWarning(true);
        setTimeout(() => setShowTabWarning(false), 3000);
      } else {
        setIsFullscreen(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [step]);

  useEffect(() => {
    if (step !== "test") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step]);

  const answersRef = useRef<Record<string, string>>({});

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (step !== "test") return;
    const saved = localStorage.getItem(`exam_${code}_answers`);
    if (saved) { try { setAnswers(JSON.parse(saved)); } catch { /* ignore */ } }
    const interval = setInterval(() => {
      localStorage.setItem(`exam_${code}_answers`, JSON.stringify(answersRef.current));
    }, 10000);
    return () => clearInterval(interval);
  }, [step, code]);

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      const timeUsed = test ? test.duration * 60 - timeLeft : 0;
      const res = await fetch("/api/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicCode: code,
          fullName: form.fullName,
          department: form.department,
          level: form.level,
          email: form.email,
          answers,
          questionIds: test!.questions.map((q) => q.id),
          timeUsed,
        }),
      });
      const data = await res.json();
      localStorage.removeItem(`exam_${code}_answers`);
      localStorage.removeItem(`exam_${code}_time`);
      if (data.submission) {
        setResult({ score: data.submission.score || 0, percentage: data.submission.percentage || 0 });
      }
      setSubmitted(true);
      setStep("result");
      try { if (document.fullscreenElement) document.exitFullscreen(); } catch { /* ignore */ }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const resetAll = () => {
    setStep("code");
    setCode("");
    setTest(null);
    setForm({ fullName: "", email: "", department: "", level: "100" });
    setCurrentIndex(0);
    setAnswers({});
    setTimeLeft(0);
    setSubmitted(false);
    setResult(null);
    setError("");
    setTabSwitchCount(0);
  };

  if (step === "code") {
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Enter Test Code</h2>
              <p className="text-gray-500 mt-2">Enter the code given to you by your examiner</p>
            </div>
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
            )}
            <div className="space-y-4">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. ABC123"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
              />
              <Button className="w-full" onClick={handleCodeSubmit} loading={loading}>
                Continue
              </Button>
            </div>
            <div className="mt-6 text-center space-y-2">
              <Link href="/check-result" className="text-sm text-blue-600 hover:text-blue-700 block">
                Already took a test? Check your result
              </Link>
              <Link href="/participant/login" className="text-sm text-indigo-600 hover:text-indigo-700 block">
                Login with test code
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "form") {
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
              <Input
                label="Full Name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Your full name"
                required
              />
              <Input
                label="Department"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="Your department"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {["100", "200", "300", "400", "500", "600", "700", "800"].map((l) => (
                    <option key={l} value={l}>{l} Level</option>
                  ))}
                </select>
              </div>
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
                required
              />
              <p className="text-xs text-gray-400">Use your email to check results later</p>
              <Button className="w-full" onClick={handleFormSubmit}>
                Continue
              </Button>
              <button onClick={() => { setStep("code"); setError(""); }} className="w-full text-sm text-gray-500 hover:text-gray-700">
                &larr; Change code
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "instructions") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
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
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Test Instructions</h2>
              <p className="text-gray-500 mt-2">{test?.title}</p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Duration</p>
                  <p className="text-xs text-gray-500">You have <strong>{test?.duration} minutes</strong> to complete this test. The timer starts when you click &quot;Start Test&quot;.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Fullscreen Mode</p>
                  <p className="text-xs text-gray-500">This test requires fullscreen mode. Do not exit fullscreen during the test.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Tab Switching Policy</p>
                  <p className="text-xs text-gray-500">Do not switch tabs or windows. After <strong>3 tab switches</strong>, your test will be <strong>auto-submitted</strong>.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">4</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Auto-Save</p>
                  <p className="text-xs text-gray-500">Your answers are saved automatically every 10 seconds. If the page crashes, you can resume where you left off.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">5</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Submission</p>
                  <p className="text-xs text-gray-500">Click &quot;Submit Test&quot; when done. If time runs out, your test will be auto-submitted.</p>
                </div>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-xs text-amber-700 font-medium">By proceeding, you agree to take this test under fair conditions. Any form of malpractice may result in disqualification.</p>
            </div>
            <div className="space-y-3">
              <Button className="w-full" onClick={startTest}>
                I Understand, Start Test
              </Button>
              <button onClick={() => setStep("form")} className="w-full text-sm text-gray-500 hover:text-gray-700">
                &larr; Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "test" && test) {
    const currentQuestion = test.questions[currentIndex];
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        {showTabWarning && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 text-center text-sm font-medium animate-pulse">
            {tabWarningMsg}
          </div>
        )}

        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-1.5 sm:py-2 flex-shrink-0">
          <div className="flex items-center justify-between gap-1 sm:gap-3">
            <div className="flex items-center gap-1 sm:gap-3 min-w-0">
              <h1 className="text-xs sm:text-base font-bold text-gray-900 truncate">{test.title}</h1>
              <span className="text-[10px] sm:text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">{currentIndex + 1}/{test.questions.length}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              {test.enableCalculator && (
                <button onClick={() => setShowCalculator(!showCalculator)} className="text-[10px] sm:text-xs text-indigo-600 font-medium px-1.5 sm:px-2 py-1 bg-indigo-50 rounded-lg">
                  {showCalculator ? "Hide Calc" : "Calc"}
                </button>
              )}
              <div className={`text-sm sm:text-lg font-bold font-mono min-w-[48px] sm:min-w-[64px] text-center ${timeLeft < 300 ? "text-red-600 animate-pulse" : "text-gray-900"}`}>
                {formatTime(timeLeft)}
              </div>
              <button onClick={() => setShowSubmitModal(true)} className="text-[10px] sm:text-xs text-white font-medium px-1.5 sm:px-3 py-1 bg-red-500 hover:bg-red-600 rounded-lg">
                Submit
              </button>
            </div>
          </div>
          {/* Mobile question strip */}
          <div className="flex sm:hidden gap-1 mt-1.5 overflow-x-auto pb-1">
            {test.questions.map((q: Question, idx: number) => (
              <button key={q.id} onClick={() => { setCurrentIndex(idx); }}
                className={`w-6 h-6 rounded text-[10px] font-bold flex-shrink-0 ${idx === currentIndex ? "ring-2 ring-blue-500 ring-offset-1" : ""} ${answers[q.id] ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Desktop question palette */}
          <div className="hidden sm:flex w-14 lg:w-20 bg-white border-r border-gray-200 p-1.5 lg:p-2.5 flex-col items-center gap-1 lg:gap-1.5 overflow-y-auto">
            {test.questions.map((q: Question, idx: number) => (
              <button key={q.id} onClick={() => setCurrentIndex(idx)}
                className={`w-7 h-7 lg:w-9 lg:h-9 rounded-lg text-[10px] lg:text-xs font-bold flex-shrink-0 transition-all ${idx === currentIndex ? "ring-2 ring-blue-500 ring-offset-1 scale-110" : ""} ${answers[q.id] ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                {idx + 1}
              </button>
            ))}
            <div className="mt-auto pt-2 border-t border-gray-100 w-full text-center">
              <div className="text-[9px] lg:text-[10px] text-gray-400">{answeredCount}/{test.questions.length}</div>
            </div>
          </div>

          {/* Question + options */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 p-2 sm:p-4 lg:p-6 overflow-y-auto">
              {showCalculator && (
                <div className="mb-3">
                  <Calculator />
                </div>
              )}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] sm:text-xs font-bold text-white bg-blue-600 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0">{currentIndex + 1}</span>
                  <span className="text-[10px] sm:text-xs text-gray-400">Question {currentIndex + 1} of {test.questions.length}</span>
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 mb-3 sm:mb-5 leading-relaxed">
                  <LatexText text={currentQuestion.questionText} />
                </h3>
                <div className="space-y-1.5 sm:space-y-2.5">
                  {currentQuestion.options.map((option: string, idx: number) => {
                    const labels = ["A", "B", "C", "D", "E", "F"];
                    return (
                      <label key={idx}
                        className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border cursor-pointer transition-all text-sm sm:text-base ${
                          answers[currentQuestion.id] === option
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                        }`}>
                        <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 ${
                          answers[currentQuestion.id] === option ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
                        }`}>
                          {labels[idx] || idx}
                        </span>
                        <span className="text-gray-700"><LatexText text={option} /></span>
                        <input type="radio" name={`q_${currentQuestion.id}`} value={option}
                          checked={answers[currentQuestion.id] === option}
                          onChange={() => handleAnswer(currentQuestion.id, option)}
                          className="sr-only" />
                      </label>
                    );
                  })}
                </div>
              </div>
              {test.enableCalculator && (
                <div className="sm:hidden mt-2">
                  <button onClick={() => setShowCalculator(!showCalculator)}
                    className="w-full py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg">
                    {showCalculator ? "Hide Calculator" : "Show Calculator"}
                  </button>
                </div>
              )}
            </div>

            {/* Bottom nav */}
            <div className="bg-white border-t border-gray-200 px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0">
              <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto">
                <button onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))} disabled={currentIndex === 0}
                  className="text-xs sm:text-sm font-medium px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">
                  ← Prev
                </button>
                <div className="hidden sm:flex items-center gap-1.5">
                  {test.questions.map((q: Question, idx: number) => (
                    <button key={q.id} onClick={() => setCurrentIndex(idx)}
                      className={`w-5 h-5 rounded text-[9px] font-bold ${idx === currentIndex ? "ring-1 ring-blue-500" : ""} ${answers[q.id] ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] sm:text-xs text-gray-400">{answeredCount}/{test.questions.length} answered</span>
                {currentIndex < test.questions.length - 1 ? (
                  <button onClick={() => setCurrentIndex((prev) => Math.min(test.questions.length - 1, prev + 1))}
                    className="text-xs sm:text-sm font-medium px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                    Next →
                  </button>
                ) : (
                  <button onClick={() => setShowSubmitModal(true)}
                    className="text-xs sm:text-sm font-medium px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                    Submit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <Modal open={showSubmitModal} onClose={() => !submitting ? setShowSubmitModal(false) : null} title="Submit Test" size="sm">
          <p className="text-gray-600 mb-2">Are you sure you want to submit?</p>
          <div className="bg-gray-50 rounded-xl p-3 mb-4">
            <div className="flex gap-3 flex-wrap justify-center">
              {test.questions.map((q: Question, idx: number) => (
                <div key={q.id} className={`w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold ${answers[q.id] ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                  {idx + 1}
                </div>
              ))}
            </div>
            <p className="text-xs text-center mt-2 text-gray-500">
              {answeredCount}/{test.questions.length} answered
              {answeredCount < test.questions.length && (
                <span className="text-red-500 block">{test.questions.length - answeredCount} unanswered</span>
              )}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowSubmitModal(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>Submit</Button>
          </div>
        </Modal>
      </div>
    );
  }

  if (step === "result") {
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
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Submitted!</h2>

            {result !== null && (
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <p className="text-3xl font-bold text-blue-700">{result.percentage}%</p>
                <p className="text-sm text-blue-600">Score: {result.score}</p>
              </div>
            )}

            {test?.immediateResult === false && (
              <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-700">
                  Results will be released later. Login within 48 hours after the test ends to check your result.
                </p>
                <Link href="/participant/login" className="mt-2 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700 underline">
                  Login to Check Result
                </Link>
              </div>
            )}

            {tabSwitchCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-xs text-amber-700">Tab switches detected: {tabSwitchCount}</p>
              </div>
            )}

            <div className="space-y-3">
              <Button className="w-full" onClick={resetAll}>Take Another Test</Button>
              <Link href="/" className="block text-sm text-gray-500 hover:text-gray-700">Go Home</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
