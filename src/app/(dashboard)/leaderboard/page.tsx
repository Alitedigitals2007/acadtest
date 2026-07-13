"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface LeaderboardEntry {
  rank: number;
  name: string;
  email: string;
  department: string;
  score: number;
  percentage: number;
  submittedAt: string;
}

interface LeaderboardData {
  testTitle: string;
  showLeaderboard: boolean;
  leaderboard: LeaderboardEntry[];
}

function LeaderboardContent() {
  const searchParams = useSearchParams();
  const testId = searchParams.get("testId");
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!testId) { setLoading(false); setError("No test specified"); return; }
    fetch(`/api/leaderboard?testId=${testId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.leaderboard) setData(d);
        else setError(d.error || "Failed to load leaderboard");
      })
      .catch(() => setError("Failed to load leaderboard"))
      .finally(() => setLoading(false));
  }, [testId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{error}</p>
        <Link href="/student" className="text-indigo-600 text-sm mt-2 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  if (!data || !data.leaderboard.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No leaderboard data available</p>
        <Link href="/student" className="text-indigo-600 text-sm mt-2 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  const topThree = data.leaderboard.slice(0, 3);
  const rest = data.leaderboard.slice(3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Leaderboard</h2>
          <p className="text-sm text-gray-500">{data.testTitle}</p>
        </div>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-4 mb-8">
        {topThree[1] && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-1 text-lg font-bold text-gray-600">2</div>
            <p className="text-xs font-medium text-gray-700 truncate max-w-[80px]">{topThree[1].name}</p>
            <p className="text-[10px] text-gray-400">{topThree[1].percentage}%</p>
            <div className="w-16 h-16 bg-gray-100 rounded-t-lg mx-auto mt-1 flex items-center justify-center text-lg font-bold text-gray-400">🏆</div>
          </div>
        )}
        {topThree[0] && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-1 text-xl font-bold text-amber-600 border-2 border-amber-400">1</div>
            <p className="text-sm font-bold text-gray-900 truncate max-w-[100px]">{topThree[0].name}</p>
            <p className="text-xs text-amber-600 font-bold">{topThree[0].percentage}%</p>
            <div className="w-20 h-20 bg-amber-50 rounded-t-lg mx-auto mt-1 flex items-center justify-center text-2xl border border-amber-200">🥇</div>
          </div>
        )}
        {topThree[2] && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-1 text-lg font-bold text-orange-600">3</div>
            <p className="text-xs font-medium text-gray-700 truncate max-w-[80px]">{topThree[2].name}</p>
            <p className="text-[10px] text-gray-400">{topThree[2].percentage}%</p>
            <div className="w-16 h-16 bg-orange-50 rounded-t-lg mx-auto mt-1 flex items-center justify-center text-lg font-bold text-orange-400">🥉</div>
          </div>
        )}
      </div>

      {/* Full list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-1">#</div>
          <div className="col-span-4 sm:col-span-3">Name</div>
          <div className="hidden sm:block col-span-2">Email</div>
          <div className="col-span-3 sm:col-span-2">Dept</div>
          <div className="col-span-2 sm:col-span-2 text-right">Score</div>
          <div className="col-span-2 sm:col-span-2 text-right">%</div>
        </div>
        {data.leaderboard.map((entry, idx) => (
          <div key={idx} className={`grid grid-cols-12 gap-2 px-4 py-3 text-xs sm:text-sm border-b border-gray-50 items-center ${idx < 3 ? "bg-amber-50/50" : ""}`}>
            <div className="col-span-1 font-bold text-gray-400">{entry.rank}</div>
            <div className="col-span-4 sm:col-span-3 font-medium text-gray-900 truncate">{entry.name}</div>
            <div className="hidden sm:block col-span-2 text-gray-500 truncate">{entry.email}</div>
            <div className="col-span-3 sm:col-span-2 text-gray-500 truncate">{entry.department}</div>
            <div className="col-span-2 sm:col-span-2 text-right font-medium">{entry.score}</div>
            <div className={`col-span-2 sm:col-span-2 text-right font-bold ${entry.percentage >= 50 ? "text-emerald-600" : "text-red-600"}`}>{entry.percentage}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>}>
      <LeaderboardContent />
    </Suspense>
  );
}