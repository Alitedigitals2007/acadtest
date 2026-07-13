"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

interface TestInfo {
  id: string;
  title: string;
}

interface ResultData {
  id: string;
  score: number | null;
  percentage: number | null;
  status: string;
  submittedAt: string;
  test: { title: string };
}

export default function PublicResult() {
  const params = useParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [testInfo, setTestInfo] = useState<TestInfo | null>(null);
  const [results, setResults] = useState<ResultData[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!email) { setError("Please enter your email"); return; }
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const testRes = await fetch(`/api/public?code=${params.code}`);
      const testData = await testRes.json();
      if (testData.test) {
        setTestInfo({ id: testData.test.id, title: testData.test.title });
        const resRes = await fetch(`/api/results?testId=${testData.test.id}`);
        const resData = await resRes.json();
        const filtered = (resData.results || []).filter(
          (r: { student?: { email: string } }) =>
            (r.student && r.student.email.toLowerCase() === email.toLowerCase()) ||
            false
        );
        setResults(filtered);
      } else {
        setError("Test not found");
      }
    } catch {
      setError("Failed to fetch results");
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Result</h2>
          <p className="text-gray-500 mb-6">Enter your email to view your result for code: <strong>{params.code}</strong></p>
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
          )}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 mb-6">
            <Input
              className="w-full sm:w-auto"
              label="Your Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Button className="w-full sm:w-auto" onClick={handleSearch} loading={loading}>Search</Button>
          </div>

          {searched && !loading && (
            <div>
              {testInfo && (
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{testInfo.title}</h3>
              )}
              {results.length === 0 ? (
                <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-lg text-sm">
                  No results found for this email address.
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((r) => (
                    <div key={r.id} className="bg-blue-50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-blue-700 font-medium">{r.test.title}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          r.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}>{r.status}</span>
                      </div>
                      <div className="flex gap-6">
                        <div>
                          <p className="text-xs text-blue-600">Score</p>
                          <p className="text-xl font-bold text-blue-900">{r.score !== null ? r.score : "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600">Percentage</p>
                          <p className="text-xl font-bold text-blue-900">{r.percentage !== null ? `${r.percentage}%` : "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600">Date</p>
                          <p className="text-sm font-medium text-blue-900">{new Date(r.submittedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
