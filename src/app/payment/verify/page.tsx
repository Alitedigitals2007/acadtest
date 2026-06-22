"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!reference) { setStatus("error"); setMessage("No payment reference found."); return; }
    fetch(`/api/payments?reference=${reference}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.message) {
          setStatus("success");
          setMessage("Payment successful! Your organization is now active.");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Network error. Contact support.");
      });
  }, [reference]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        {status === "verifying" && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900">Verifying Payment...</h2>
            <p className="text-sm text-gray-500 mt-2">Please wait while we confirm your transaction.</p>
          </div>
        )}
        {status === "success" && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-sm text-gray-600 mb-6">{message}</p>
            <Link href="/org-admin" className="inline-flex px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-blue-600 transition-all shadow-lg shadow-indigo-200">
              Go to Dashboard
            </Link>
          </div>
        )}
        {status === "error" && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-sm text-gray-600 mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <Link href="/org-admin/payment" className="px-5 py-2.5 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors">Try Again</Link>
              <Link href="/org-admin" className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm rounded-xl hover:bg-gray-200 transition-colors">Dashboard</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentVerify() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
