"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import Calculator from "@/components/ui/calculator";
import LatexText from "@/components/ui/latex-text";

interface Question {
  id: string;
  type: string;
  questionText: string;
  options: string[];
  orderIndex: number;
}

interface TestData {
  id: string;
  title: string;
  duration: number;
  numQuestions: number;
  enableCalculator: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  immediateResult: boolean;
  questions: Question[];
}

export default function PublicTestTaking() {
  const params = useParams();
  const router = useRouter();
  const [test, setTest] = useState<TestData | null>(null);
  const [participant, setParticipant] = useState<{ fullName: string; department: string; level: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
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

  useEffect(() => {
    const stored = localStorage.getItem(`participant_${params.code}`);
    if (!stored) { router.push(`/join/${params.code}`); return; }
    setParticipant(JSON.parse(stored));

    fetch(`/api/public?code=${params.code}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.test) return;
        let questions = [...(data.test.questions || [])];
        if (data.test.shuffleOptions) {
          questions = questions.map((q: Question) => ({
            ...q,
            options: shuffleArray(q.options),
          }));
        }
        setTest({ ...data.test, questions });
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [params.code, router]);

  const shuffleArray = (arr: unknown[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const startTest = () => {
    if (!test) return;
    setShowInstructions(false);
    const durationSeconds = test.duration * 60;
    const saved = localStorage.getItem(`public_test_${params.code}_time`);
    const savedAnswers = localStorage.getItem(`public_test_${params.code}_answers`);
    if (saved) {
      const elapsed = Math.floor((Date.now() - parseInt(saved)) / 1000);
      setTimeLeft(Math.max(0, durationSeconds - elapsed));
    } else {
      localStorage.setItem(`public_test_${params.code}_time`, String(Date.now()));
      setTimeLeft(durationSeconds);
    }
    if (savedAnswers) {
      try { setAnswers(JSON.parse(savedAnswers)); } catch { /* ignore */ }
    }
    try { document.documentElement.requestFullscreen(); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (showInstructions || submitted) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            setTabWarningMsg("You have switched tabs 3 times. Your test will be auto-submitted.");
            setShowTabWarning(true);
            setTimeout(() => { handleSubmit(); }, 2000);
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
      if (!document.fullscreenElement && !showInstructions) {
        setTabWarningMsg("Warning: You exited fullscreen. Please stay in fullscreen mode.");
        setShowTabWarning(true);
        setTimeout(() => setShowTabWarning(false), 3000);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [showInstructions, submitted]);

  const answersRef = useRef<Record<string, string>>({});

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (showInstructions || submitted) return;
    const interval = setInterval(() => {
      localStorage.setItem(`public_test_${params.code}_answers`, JSON.stringify(answersRef.current));
    }, 10000);
    return () => clearInterval(interval);
  }, [params.code, showInstructions, submitted]);

  useEffect(() => {
    if (showInstructions || submitted || timeLeft <= 0) return;
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
  }, [timeLeft, showInstructions, submitted]);

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicCode: params.code,
          ...participant,
          answers,
          questionIds: test!.questions.map((q: Question) => q.id),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.removeItem(`public_test_${params.code}_answers`);
        localStorage.removeItem(`public_test_${params.code}_time`);
        if (data.submission) {
          setResult({ score: data.submission.score || 0, percentage: data.submission.percentage || 0 });
        }
        setSubmitted(true);
        try { if (document.fullscreenElement) document.exitFullscreen(); } catch { /* ignore */ }
      }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
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
          {tabSwitchCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-amber-700">Tab switches detected: {tabSwitchCount}</p>
            </div>
          )}
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (!test) return <p className="text-center text-gray-500 mt-10">Test not found.</p>;

  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <span className="text-2xl font-bold text-gray-900">AcadTest</span>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Test Instructions</h2>
              <p className="text-gray-500 mt-2">{test.title}</p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Duration</p>
                  <p className="text-xs text-gray-500">You have <strong>{test.duration} minutes</strong> to complete this test.</p>
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
                  <p className="text-xs text-gray-500">Your answers are saved automatically every 10 seconds.</p>
                </div>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-xs text-amber-700 font-medium">By proceeding, you agree to take this test under fair conditions.</p>
            </div>
            <Button className="w-full" onClick={startTest}>I Understand, Start Test</Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = test.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showTabWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 text-center text-sm font-medium animate-pulse">
          {tabWarningMsg}
        </div>
      )}

      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <h1 className="text-sm sm:text-lg font-bold text-gray-900 truncate">{test.title}</h1>
            <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">{currentIndex + 1}/{test.questions.length}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {test.enableCalculator && (
              <Button variant="ghost" size="sm" onClick={() => setShowCalculator(!showCalculator)} className="hidden sm:inline-flex">
                {showCalculator ? "Hide Calc" : "Calc"}
              </Button>
            )}
            <div className={`text-base sm:text-xl font-bold font-mono ${timeLeft < 300 ? "text-red-600 animate-pulse" : "text-gray-900"}`}>
              {formatTime(timeLeft)}
            </div>
            <Button variant="danger" size="sm" onClick={() => setShowSubmitModal(true)}>Submit</Button>
          </div>
        </div>
        {test.enableCalculator && (
          <button onClick={() => setShowCalculator(!showCalculator)} className="sm:hidden mt-2 text-xs text-indigo-600 font-medium">
            {showCalculator ? "Hide Calculator" : "Show Calculator"}
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="hidden sm:flex w-16 md:w-20 bg-white border-r border-gray-200 p-2 md:p-3 flex-col items-center gap-1.5 md:gap-2 overflow-y-auto">
          {test.questions.map((q: Question, idx: number) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-8 h-8 md:w-10 md:h-10 rounded-lg text-xs md:text-sm font-medium transition-colors flex-shrink-0 ${
                idx === currentIndex
                  ? "bg-blue-600 text-white"
                  : answers[q.id]
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 p-3 sm:p-6 md:p-8 overflow-y-auto">
            {showCalculator && (
              <div className="mb-4">
                <Calculator />
              </div>
            )}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-gray-500 mb-2">Question {currentIndex + 1} of {test.questions.length}</p>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4 sm:mb-6"><LatexText text={currentQuestion.questionText} /></h3>
              <div className="space-y-2 sm:space-y-3">
                {currentQuestion.options.map((option: string, idx: number) => (
                  <label
                    key={idx}
                    className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border cursor-pointer transition-colors ${
                      answers[currentQuestion.id] === option
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q_${currentQuestion.id}`}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={() => handleAnswer(currentQuestion.id, option)}
                      className="w-4 h-4 text-blue-600 flex-shrink-0"
                    />
                    <span className="text-sm text-gray-700"><LatexText text={option} /></span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border-t border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
            <Button variant="secondary" size="sm" onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))} disabled={currentIndex === 0} className="text-xs sm:text-sm">
              Prev
            </Button>
            <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">Answered: {answeredCount}/{test.questions.length}</div>
            <div className="text-xs sm:text-sm text-gray-500 sm:hidden">{answeredCount}/{test.questions.length}</div>
            {currentIndex < test.questions.length - 1 ? (
              <Button size="sm" onClick={() => setCurrentIndex((prev) => Math.min(test.questions.length - 1, prev + 1))} className="text-xs sm:text-sm">
                Next
              </Button>
            ) : (
              <Button variant="success" size="sm" onClick={() => setShowSubmitModal(true)} className="text-xs sm:text-sm">Submit</Button>
            )}
          </div>
        </div>
      </div>

      <Modal open={showSubmitModal} onClose={() => !submitting ? setShowSubmitModal(false) : null} title="Submit Test" size="sm">
        <p className="text-gray-600 mb-2">Are you sure you want to submit?</p>
        <p className="text-sm text-gray-500 mb-6">
          You have answered {answeredCount} of {test.questions.length} questions.
          {answeredCount < test.questions.length && (
            <span className="text-red-500 block mt-1">{test.questions.length - answeredCount} questions unanswered.</span>
          )}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowSubmitModal(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>Submit</Button>
        </div>
      </Modal>
    </div>
  );
}
