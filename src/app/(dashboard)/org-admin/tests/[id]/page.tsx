"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import LatexText from "@/components/ui/latex-text";

export default function TestDetail() {
  const params = useParams();
  const router = useRouter();
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"questions" | "import" | "settings" | "live" | "leaderboard">("questions");
  const [submissionCount, setSubmissionCount] = useState(0);
  const [participants, setParticipants] = useState<any[]>([]);
  const liveRef = useRef<NodeJS.Timeout | null>(null);

  const [qForm, setQForm] = useState({
    type: "multiple_choice", questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A",
  });
  const [qLoading, setQLoading] = useState(false);
  const [editingQ, setEditingQ] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState("");
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [settingsForm, setSettingsForm] = useState<any>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");

  const fetchData = async () => {
    try {
      const [qRes, tRes] = await Promise.all([
        fetch(`/api/questions?testId=${params.id}`),
        fetch(`/api/tests/${params.id}`),
      ]);
      const qData = await qRes.json();
      const tData = await tRes.json();
      setQuestions(qData.questions || []);
      const t = tData.test || tData;
      setTest(t);
      const toLocalDatetime = (d: string) => {
        const date = new Date(d);
        const y = date.getFullYear();
        const mo = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const h = String(date.getHours()).padStart(2, "0");
        const mi = String(date.getMinutes()).padStart(2, "0");
        return `${y}-${mo}-${dd}T${h}:${mi}`;
      };
      setSettingsForm({
        title: t.title || "",
        description: t.description || "",
        duration: t.duration || 30,
        numQuestions: t.numQuestions || 10,
        startDate: t.startDate ? toLocalDatetime(t.startDate) : "",
        endDate: t.endDate ? toLocalDatetime(t.endDate) : "",
        status: t.status || "draft",
        shuffleQuestions: t.shuffleQuestions ?? false,
        shuffleOptions: t.shuffleOptions ?? false,
        autoMark: t.autoMark ?? true,
        showLeaderboard: t.showLeaderboard ?? false,
        enableCalculator: t.enableCalculator ?? false,
        immediateResult: t.immediateResult ?? true,
        scheduledReleaseAt: t.scheduledReleaseAt ? toLocalDatetime(t.scheduledReleaseAt) : "",
      });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchLive = async () => {
    try {
      const res = await fetch(`/api/tests/${params.id}`);
      const data = await res.json();
      const t = data.test || data;
      setSubmissionCount(t._count?.submissions || 0);
      const subRes = await fetch(`/api/submissions?testId=${params.id}`);
      const subData = await subRes.json();
      setParticipants(subData.submissions || []);
    } catch {}
  };

  useEffect(() => { fetchData(); }, [params.id]);

  useEffect(() => {
    if (activeTab === "live") {
      fetchLive();
      liveRef.current = setInterval(fetchLive, 5000);
      return () => { if (liveRef.current) clearInterval(liveRef.current); };
    } else {
      if (liveRef.current) clearInterval(liveRef.current);
    }
  }, [activeTab, params.id]);

  const handleAddQ = async (e: React.FormEvent) => {
    e.preventDefault();
    setQLoading(true);
    const options = [qForm.optionA, qForm.optionB, qForm.optionC, qForm.optionD].filter(Boolean);
    const correctMap: Record<string, string> = { A: qForm.optionA, B: qForm.optionB, C: qForm.optionC, D: qForm.optionD };
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: params.id, type: qForm.type, questionText: qForm.questionText,
          options, correctAnswer: correctMap[qForm.correctAnswer] || qForm.correctAnswer,
          orderIndex: questions.length,
        }),
      });
      if (res.ok) {
        setQForm({ type: "multiple_choice", questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A" });
        fetchData();
      }
    } catch { }
    finally { setQLoading(false); }
  };

  const handleEditQ = async () => {
    if (!editForm) return;
    setQLoading(true);
    const options = [editForm.optionA, editForm.optionB, editForm.optionC, editForm.optionD].filter((o: string) => o && o.trim());
    if (!editForm.questionText?.trim()) { setQLoading(false); return; }
    if (options.length < 2) { setQLoading(false); alert("Please add at least 2 options"); return; }
    const correctMap: Record<string, string> = { A: editForm.optionA, B: editForm.optionB, C: editForm.optionC, D: editForm.optionD };
    const correctAnswer = correctMap[editForm.correctAnswer] || options[0];
    try {
      const res = await fetch("/api/questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editForm.id,
          questionText: editForm.questionText.trim(),
          options,
          correctAnswer,
          type: editForm.type,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditingQ(null);
        setEditForm(null);
        fetchData();
      } else {
        alert(data.error || "Failed to update question");
      }
    } catch (e) { alert("Network error"); }
    finally { setQLoading(false); }
  };

  const handleDeleteQ = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    try {
      const res = await fetch(`/api/questions?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch { }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map((q) => q.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} question(s)? This cannot be undone.`)) return;
    try {
      const ids = Array.from(selectedIds).join(",");
      const res = await fetch(`/api/questions?ids=${ids}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedIds(new Set());
        fetchData();
      }
    } catch { }
  };

  const startEdit = (q: any) => {
    const opts = Array.isArray(q.options) ? q.options : [];
    const correctIdx = opts.findIndex((o: string) => o === q.correctAnswer);
    const letter = correctIdx >= 0 ? ["A", "B", "C", "D"][correctIdx] : "A";
    setEditingQ(q.id);
    setEditForm({
      id: q.id,
      type: q.type || "multiple_choice",
      questionText: q.questionText,
      optionA: opts[0] || "",
      optionB: opts[1] || "",
      optionC: opts[2] || "",
      optionD: opts[3] || "",
      correctAnswer: letter,
    });
  };

  const handleBulk = async () => {
    if (!bulkFile) return;
    setBulkLoading(true);
    setBulkMsg("");
    const user = JSON.parse(localStorage.getItem("acadtest_user") || "{}");
    const fd = new FormData();
    fd.append("file", bulkFile);
    fd.append("type", "questions");
    fd.append("organizationId", user.organizationId || "");
    fd.append("testId", params.id as string);
    try {
      const res = await fetch("/api/bulk", { method: "POST", body: fd });
      const data = await res.json();
      setBulkMsg(data.message || (res.ok ? "Questions imported!" : "Import failed"));
      if (res.ok) { setBulkFile(null); setBulkPreview([]); fetchData(); }
    } catch { setBulkMsg("Upload failed"); }
    finally { setBulkLoading(false); }
  };

  const parseBulkFile = async (file: File) => {
    const text = await file.text();
    const ext = file.name.split(".").pop()?.toLowerCase();
    try {
      if (ext === "json") {
        const data = JSON.parse(text);
        const arr = Array.isArray(data) ? data : data.data || data.records || [];
        setBulkPreview(arr.slice(0, 20));
      } else {
        const lines = text.split("\n").filter((l) => l.trim());
        if (lines.length < 2) { setBulkPreview([]); return; }
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const rows = lines.slice(1, 21).map((line) => {
          const values: string[] = [];
          let current = "";
          let inQuotes = false;
          for (const char of line) {
            if (char === '"') { inQuotes = !inQuotes; }
            else if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; }
            else { current += char; }
          }
          values.push(current.trim());
          const row: any = {};
          headers.forEach((h, i) => { row[h] = values[i] || ""; });
          return {
            questionText: row.questiontext || row.question_text || row.question || row.text || "",
            optionA: row.optiona || row.option_a || row.a || "",
            optionB: row.optionb || row.option_b || row.b || "",
            optionC: row.optionc || row.option_c || row.c || "",
            optionD: row.optiond || row.option_d || row.d || "",
            correctAnswer: row.correctanswer || row.correct_answer || row.answer || row.correct || "",
          };
        });
        setBulkPreview(rows);
      }
    } catch { setBulkPreview([]); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setBulkFile(file);
    if (file) { parseBulkFile(file); } else { setBulkPreview([]); }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsMsg("");
    try {
      const res = await fetch(`/api/tests/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settingsForm,
          startDate: new Date(settingsForm.startDate).toISOString(),
          endDate: new Date(settingsForm.endDate).toISOString(),
          scheduledReleaseAt: settingsForm.immediateResult ? null : settingsForm.scheduledReleaseAt ? new Date(settingsForm.scheduledReleaseAt).toISOString() : null,
          duration: parseInt(settingsForm.duration),
          numQuestions: parseInt(settingsForm.numQuestions),
        }),
      });
      if (res.ok) {
        setSettingsMsg("Settings saved!");
        fetchData();
      } else {
        setSettingsMsg("Failed to save settings");
      }
    } catch { setSettingsMsg("Failed to save settings"); }
    finally { setSavingSettings(false); }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/tests/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTest({ ...test, status: newStatus });
        setSettingsForm({ ...settingsForm, status: newStatus });
      }
    } catch {}
  };

  const downloadTemplate = (type: "students" | "questions") => {
    let csv = "";
    let filename = "";
    if (type === "students") {
      csv = "fullname,department,level,email,username\nJohn Doe,Computer Science,200,john@school.edu,johndoe\nJane Smith,Mathematics,300,jane@school.edu,janesmith";
      filename = "student_import_template.csv";
    } else {
      csv = 'questiontext,type,optiona,optionb,optionc,optiond,correctanswer\n"What is 2+2?",multiple_choice,1,2,3,4,B\n"Capital of Nigeria?",multiple_choice,Lagos,Abuja,Kano,"Port Harcourt",B';
      filename = "question_import_template.csv";
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWin = window.open("", "_blank");
    if (!printWin || !test) return;
    let html = `<html><head><title>${test.title} - Questions & Answers</title>
      <style>body{font-family:sans-serif;padding:40px;max-width:800px;margin:auto}
      h1{font-size:20px;margin-bottom:4px}h2{font-size:14px;color:#666;margin-bottom:30px;font-weight:400}
      .q{margin-bottom:28px;page-break-inside:avoid}
      .q-num{font-weight:700;font-size:14px;margin-bottom:6px}
      .q-text{font-size:13px;margin-bottom:8px;line-height:1.5}
      .opts{margin-left:20px}.opt{font-size:12px;margin-bottom:3px;color:#333}
      .correct{color:#16a34a;font-weight:700}
      .answer-key{margin-top:30px;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px}
      .answer-key h3{font-size:14px;font-weight:700;margin-bottom:10px;color:#166534}
      .answer-item{font-size:12px;margin-bottom:4px;color:#333}
      hr{border:none;border-top:1px solid #eee;margin:20px 0}
      .info{font-size:12px;color:#888;margin-bottom:20px}
    </style></head><body>
    <h1>${test.title}</h1>
    <h2>${test.publicCode} &middot; ${questions.length} Questions &middot; ${test.duration} minutes</h2>
    <div class="info">${test.description || ""}</div>`;
    questions.forEach((q, i) => {
      html += `<div class="q"><div class="q-num">${i + 1}.</div><div class="q-text">${q.questionText}</div><div class="opts">`;
      if (q.options && Array.isArray(q.options)) {
        const labels = ["A", "B", "C", "D"];
        q.options.forEach((opt: string, oi: number) => {
          if (opt) {
            const isCorrect = opt === q.correctAnswer;
            html += `<div class="opt${isCorrect ? " correct" : ""}">${labels[oi] || oi}. ${opt}${isCorrect ? " &#10003;" : ""}</div>`;
          }
        });
      }
      html += `</div></div>`;
      if (i < questions.length - 1) html += `<hr/>`;
    });
    html += `<div class="answer-key"><h3>Answer Key</h3>`;
    questions.forEach((q, i) => {
      html += `<div class="answer-item">${i + 1}. <strong>${q.correctAnswer}</strong></div>`;
    });
    html += `</div></body></html>`;
    printWin.document.write(html);
    printWin.document.close();
    setTimeout(() => printWin.print(), 500);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
  }
  if (!test) return <p className="text-gray-500 text-center py-12">Test not found.</p>;

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    open: "bg-emerald-100 text-emerald-700",
    paused: "bg-amber-100 text-amber-700",
    closed: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/org-admin/tests" className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </Link>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900">{test.title}</h2>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase ${statusColors[test.status] || statusColors.draft}`}>{test.status}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1 ml-8">
              Code: <span className="font-mono font-medium text-indigo-600">{test.publicCode}</span>
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handlePrint} className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print
            </button>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              {test.status !== "open" && (
                <button onClick={() => handleStatusChange("open")} className="px-3 py-2 text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">Open</button>
              )}
              {test.status === "open" && (
                <button onClick={() => handleStatusChange("paused")} className="px-3 py-2 text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">Pause</button>
              )}
              {test.status !== "closed" && (
                <button onClick={() => handleStatusChange("closed")} className="px-3 py-2 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors border-l border-gray-200">Close</button>
              )}
              {test.status !== "draft" && (
                <button onClick={() => handleStatusChange("draft")} className="px-3 py-2 text-xs font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors border-l border-gray-200">Draft</button>
              )}
            </div>
          </div>
        </div>

        {test.description && <p className="text-sm text-gray-600 mb-4 ml-8">{test.description}</p>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm ml-8">
          <div><span className="text-gray-500">Duration:</span> <span className="font-medium">{test.duration} min</span></div>
          <div><span className="text-gray-500">Questions:</span> <span className="font-medium">{questions.length}/{test.numQuestions}</span></div>
          <div><span className="text-gray-500">Start:</span> <span className="font-medium">{new Date(test.startDate).toLocaleDateString()}</span></div>
          <div><span className="text-gray-500">End:</span> <span className="font-medium">{new Date(test.endDate).toLocaleDateString()}</span></div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3 ml-0 sm:ml-8">
          {test.shuffleQuestions && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Shuffle Qs</span>}
          {test.shuffleOptions && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Shuffle Options</span>}
          {test.autoMark && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Auto Mark</span>}
          {test.enableCalculator && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Calculator</span>}
          {test.immediateResult && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Instant Result</span>}
          {test.showLeaderboard && <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium">Leaderboard</span>}
        </div>
      </div>

      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-0">
          {(["questions", "import", "settings", "live", "leaderboard"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-5 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap ${activeTab === tab ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {tab === "live" ? `Live (${submissionCount})` : tab === "import" ? "Import" : tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "questions" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4">{editingQ ? "Edit Question" : "Add Question"}</h3>
            <form onSubmit={editingQ ? (e) => { e.preventDefault(); handleEditQ(); } : handleAddQ} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Question Text <span className="text-gray-400">(LaTeX supported: use $...$ for inline, $$...$$ for display)</span></label>
                <textarea
                  value={editingQ ? editForm?.questionText : qForm.questionText}
                  onChange={(e) => editingQ ? setEditForm({ ...editForm, questionText: e.target.value }) : setQForm({ ...qForm, questionText: e.target.value })}
                  rows={2} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                {(editingQ ? editForm?.questionText : qForm.questionText) && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-[10px] text-gray-400 mb-1 uppercase font-medium">Preview</p>
                    <LatexText text={editingQ ? editForm?.questionText || "" : qForm.questionText} className="text-sm text-gray-900" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["A", "B", "C", "D"].map((opt) => (
                  <div key={opt}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Option {opt}</label>
                    <input type="text"
                      value={editingQ ? (editForm as any)?.[`option${opt}`] || "" : (qForm as any)[`option${opt}`]}
                      onChange={(e) => editingQ ? setEditForm({ ...editForm, [`option${opt}`]: e.target.value }) : setQForm({ ...qForm, [`option${opt}`]: e.target.value })}
                      placeholder={`Option ${opt} (LaTeX supported)`}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                    {(editingQ ? (editForm as any)?.[`option${opt}`] : (qForm as any)[`option${opt}`]) && (
                      <div className="mt-1 px-2 py-1 bg-gray-50 rounded-lg border border-gray-200">
                        <LatexText text={editingQ ? (editForm as any)?.[`option${opt}`] || "" : (qForm as any)[`option${opt}`] || ""} className="text-xs text-gray-700" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4">
                <div className="flex-1 w-full sm:w-auto">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Correct Answer</label>
                  <select
                    value={editingQ ? editForm?.correctAnswer : qForm.correctAnswer}
                    onChange={(e) => editingQ ? setEditForm({ ...editForm, correctAnswer: e.target.value }) : setQForm({ ...qForm, correctAnswer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                    {["A", "B", "C", "D"].map((o) => <option key={o} value={o}>Option {o}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button type="submit" disabled={qLoading}
                    className="flex-1 sm:flex-none px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
                    {qLoading ? (editingQ ? "Updating..." : "Adding...") : (editingQ ? "Update" : "Add")}
                  </button>
                  {editingQ && (
                    <button type="button" onClick={() => { setEditingQ(null); setEditForm(null); }}
                      className="flex-1 sm:flex-none px-5 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 lg:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {questions.length > 0 && (
                  <input
                    type="checkbox"
                    checked={selectedIds.size === questions.length && questions.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                )}
                <h3 className="text-base font-bold text-gray-900">
                  Questions ({questions.length})
                  {selectedIds.size > 0 && <span className="text-indigo-600 font-normal ml-2">({selectedIds.size} selected)</span>}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {selectedIds.size > 0 && (
                  <button onClick={handleBulkDelete} className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete Selected ({selectedIds.size})
                  </button>
                )}
                {questions.length > 0 && (
                  <button onClick={handlePrint} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print All
                  </button>
                )}
              </div>
            </div>
            {questions.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">No questions added yet.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {questions.map((q, i) => (
                  <div key={q.id} className={`px-5 lg:px-6 py-4 hover:bg-gray-50 transition-colors ${selectedIds.has(q.id) ? "bg-indigo-50" : ""}`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(q.id)}
                        onChange={() => toggleSelect(q.id)}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mt-1 flex-shrink-0"
                      />
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900"><LatexText text={q.questionText} /></p>
                        {q.options && Array.isArray(q.options) && (
                          <div className="mt-2 space-y-1">
                            {["A", "B", "C", "D"].map((l, oi) => {
                              if (!q.options[oi]) return null;
                              const isCorrect = q.correctAnswer === q.options[oi];
                              return (
                                <p key={l} className={`text-xs ${isCorrect ? "text-emerald-700 font-medium" : "text-gray-600"}`}>
                                  <span className="font-mono mr-1">{l}.</span> <LatexText text={q.options[oi]} />
                                  {isCorrect && <span className="ml-1 text-emerald-500">&#10003;</span>}
                                </p>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{q.type?.replace("_", " ")}</span>
                        <button onClick={() => startEdit(q)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDeleteQ(q.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "import" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-gray-900">Import Questions</h3>
              <button onClick={() => downloadTemplate("questions")} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download CSV Template
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Upload a CSV, XLSX, or JSON file. CSV columns: <code className="bg-gray-100 px-1 rounded">questiontext, type, optiona, optionb, optionc, optiond, correctanswer</code>. Use letters (A/B/C/D) or full text for correctanswer.
            </p>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-indigo-300 transition-colors">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-600 mb-1">Drop your file here or click to browse</p>
              <p className="text-xs text-gray-400 mb-4">Supported: CSV, XLSX, JSON</p>
              <input type="file" accept=".csv,.xlsx,.xls,.json" onChange={handleFileChange}
                className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              {bulkFile && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <span className="text-xs text-gray-600">{bulkFile.name}</span>
                  <button onClick={handleBulk} disabled={bulkLoading}
                    className="px-5 py-2 bg-indigo-600 text-white text-xs font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
                    {bulkLoading ? "Importing..." : "Upload & Import"}
                  </button>
                </div>
              )}
              {bulkMsg && <p className={`text-xs mt-3 ${bulkMsg.includes("failed") || bulkMsg.includes("error") ? "text-red-600" : "text-emerald-600"}`}>{bulkMsg}</p>}
            </div>
          </div>

          {bulkPreview.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-3">Preview ({bulkPreview.length} question{bulkPreview.length !== 1 ? "s" : ""})</h3>
              <p className="text-xs text-gray-500 mb-4">This is how your questions will appear after import.</p>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {bulkPreview.map((q, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900"><LatexText text={q.questionText || "(empty)"} /></p>
                        <div className="mt-2 space-y-1">
                          {["A", "B", "C", "D"].map((l, oi) => {
                            const opt = [q.optionA, q.optionB, q.optionC, q.optionD][oi];
                            if (!opt) return null;
                            const isCorrect = q.correctAnswer === l || q.correctAnswer === opt;
                            return (
                              <p key={l} className={`text-xs ${isCorrect ? "text-emerald-700 font-medium" : "text-gray-600"}`}>
                                <span className="font-mono mr-1">{l}.</span> <LatexText text={opt} />
                                {isCorrect && <span className="ml-1 text-emerald-500">&#10003;</span>}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "settings" && settingsForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-gray-900">Test Settings</h3>
          {settingsMsg && (
            <div className={`text-sm px-4 py-2 rounded-xl ${settingsMsg.includes("saved") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{settingsMsg}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
              <input type="text" value={settingsForm.title} onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Duration (min)</label>
              <input type="number" value={settingsForm.duration} onChange={(e) => setSettingsForm({ ...settingsForm, duration: e.target.value })} min="1"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea value={settingsForm.description} onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })} rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input type="datetime-local" value={settingsForm.startDate} onChange={(e) => setSettingsForm({ ...settingsForm, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input type="datetime-local" value={settingsForm.endDate} onChange={(e) => setSettingsForm({ ...settingsForm, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
          <div className="space-y-2">
            {[
              { key: "shuffleQuestions", label: "Shuffle Questions" },
              { key: "shuffleOptions", label: "Shuffle Options" },
              { key: "autoMark", label: "Automatic Marking" },
              { key: "showLeaderboard", label: "Show Leaderboard" },
              { key: "enableCalculator", label: "Enable Calculator" },
              { key: "immediateResult", label: "Release Results Immediately" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl cursor-pointer">
                <span className="text-sm text-gray-700">{label}</span>
                <button type="button" onClick={() => {
                  const next = !settingsForm[key];
                  setSettingsForm({ ...settingsForm, [key]: next });
                  if (next) setSettingsForm((prev: any) => ({ ...prev, scheduledReleaseAt: "" }));
                }}
                  className={`relative w-10 h-5 rounded-full transition-colors ${settingsForm[key] ? "bg-indigo-600" : "bg-gray-300"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settingsForm[key] ? "translate-x-5" : ""}`} />
                </button>
              </label>
            ))}
            {!settingsForm.immediateResult && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Scheduled Release Date</label>
                <input type="datetime-local" value={settingsForm.scheduledReleaseAt || ""} onChange={(e) => setSettingsForm({ ...settingsForm, scheduledReleaseAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                <p className="text-xs text-gray-400 mt-1">Results will automatically release at this date/time.</p>
              </div>
            )}
          </div>
          <button onClick={handleSaveSettings} disabled={savingSettings}
            className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {savingSettings ? "Saving..." : "Save Settings"}
          </button>
        </div>
      )}

      {activeTab === "live" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Live Test Status</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-500">Auto-refreshing every 5s</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="bg-indigo-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-indigo-600">{submissionCount}</p>
                <p className="text-xs text-gray-600 mt-1">Submissions</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{participants.filter((p: any) => p.status === "completed").length}</p>
                <p className="text-xs text-gray-600 mt-1">Completed</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-600">{participants.filter((p: any) => p.percentage != null).length > 0 ? Math.round(participants.filter((p: any) => p.percentage != null).reduce((a: number, p: any) => a + (p.percentage || 0), 0) / participants.filter((p: any) => p.percentage != null).length) : 0}%</p>
                <p className="text-xs text-gray-600 mt-1">Avg Score</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 lg:px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Recent Submissions</h3>
            </div>
            {participants.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">No submissions yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                      <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Department</th>
                      <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                      <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Percentage</th>
                      <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {participants.map((p: any) => {
                      const name = p.student?.fullName || p.participant?.fullName || "Unknown";
                      const email = p.student?.email || p.participant?.email || "";
                      const dept = p.student?.department || p.participant?.department || "-";
                      return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 lg:px-6 py-3">
                          <p className="text-sm font-medium text-gray-900">{name}</p>
                          <p className="text-xs text-gray-500">{email}</p>
                        </td>
                        <td className="px-4 lg:px-6 py-3 text-sm text-gray-600 hidden sm:table-cell">{dept}</td>
                        <td className="px-4 lg:px-6 py-3 text-sm font-semibold text-gray-900">{p.score ?? "-"}</td>
                        <td className="px-4 lg:px-6 py-3">
                          <span className={`text-sm font-bold ${(p.percentage || 0) >= 50 ? "text-emerald-600" : "text-red-600"}`}>
                            {p.percentage != null ? `${p.percentage}%` : "Pending"}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-3 text-xs text-gray-500 hidden md:table-cell">{new Date(p.submittedAt).toLocaleTimeString()}</td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "leaderboard" && (
        <LeaderboardView testId={params.id as string} />
      )}
    </div>
  );
}

function LeaderboardView({ testId }: { testId: string }) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testTitle, setTestTitle] = useState("");

  useEffect(() => {
    fetch(`/api/leaderboard?testId=${testId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
          setTestTitle(data.testTitle);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [testId]);

  if (loading) return <div className="text-center py-10 text-gray-400 text-sm">Loading leaderboard...</div>;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 lg:px-6 py-4 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-900">Leaderboard - {testTitle}</h3>
      </div>
      {leaderboard.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">No data available.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Rank</th>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Email</th>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leaderboard.map((entry: any, idx: number) => (
                <tr key={idx} className={`hover:bg-gray-50 transition-colors ${idx < 3 ? "bg-amber-50/50" : ""}`}>
                  <td className="px-4 lg:px-6 py-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-gray-200 text-gray-600" : idx === 2 ? "bg-orange-100 text-orange-700" : "text-gray-400"}`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-3 text-sm font-medium text-gray-900">{entry.name}</td>
                  <td className="px-4 lg:px-6 py-3 text-sm text-gray-500 hidden sm:table-cell">{entry.email}</td>
                  <td className="px-4 lg:px-6 py-3 text-sm font-semibold text-gray-900">{entry.score}</td>
                  <td className="px-4 lg:px-6 py-3">
                    <span className={`text-sm font-bold ${entry.percentage >= 50 ? "text-emerald-600" : "text-red-600"}`}>{entry.percentage}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
