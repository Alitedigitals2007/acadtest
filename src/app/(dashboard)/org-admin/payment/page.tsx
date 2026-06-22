"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PRICING_PLANS, TEST_ADDONS, STUDENT_ADDONS } from "@/types";

declare global {
  interface Window {
    PaystackPop: new () => {
      newTransaction: (config: {
        key: string;
        email: string;
        amount: number;
        ref: string;
        onSuccess: (txn: { reference: string }) => void;
        onCancel: () => void;
      }) => void;
    };
  }
}

export default function OrgAdminPayment() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedTestAddon, setSelectedTestAddon] = useState<any>(null);
  const [selectedStudentAddon, setSelectedStudentAddon] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [paystackReady, setPaystackReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("acadtest_user");
    if (!stored) { router.push("/login"); return; }
    const u = JSON.parse(stored);
    setUser(u);
    if (u.organizationId) {
      fetch(`/api/organizations/${u.organizationId}`)
        .then((r) => r.json())
        .then((data) => setOrg(data.organization))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    if (!document.querySelector('script[src*="/v2/inline.js"]')) {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v2/inline.js";
      script.onload = () => setPaystackReady(true);
      script.onerror = () => setPaystackReady(false);
      document.body.appendChild(script);
    } else {
      setPaystackReady(true);
    }
  }, [router]);

  const totalAmount = (selectedPlan?.price || 0) + (selectedTestAddon?.price || 0) + (selectedStudentAddon?.price || 0);

  const handlePay = async () => {
    if (!selectedPlan || !user) return;
    if (!paystackReady) { alert("Payment gateway still loading. Please wait a moment."); return; }
    if (!process.env.NEXT_PUBLIC_PAYSTACK_KEY) { alert("Paystack key not configured. Contact admin."); return; }
    setPaying(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: user.organizationId,
          amount: totalAmount,
          email: user.email,
          package: selectedPlan.name + (selectedTestAddon ? ` + ${selectedTestAddon.name}` : "") + (selectedStudentAddon ? ` + ${selectedStudentAddon.name}` : ""),
        }),
      });
      const data = await res.json();
      if (!data.reference) {
        alert(data.error || "Payment initialization failed. Please try again.");
        setPaying(false);
        return;
      }

      const popup = new window.PaystackPop();
      popup.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_KEY,
        email: user.email,
        amount: Math.round(totalAmount * 100),
        ref: data.reference,
        onSuccess: (txn) => {
          fetch(`/api/payments?reference=${txn.reference}`)
            .then((r) => r.json())
            .then((d) => {
              if (d.message) { setSuccess(true); setTimeout(() => router.push("/org-admin"), 2000); }
              else alert("Payment verified but activation failed: " + (d.error || "Unknown error"));
            })
            .catch(() => alert("Verification failed. Contact support with reference: " + txn.reference))
            .finally(() => setPaying(false));
        },
        onCancel: () => { setPaying(false); },
      });
    } catch (e) {
      console.error("handlePay error:", e);
      alert("Payment failed. Check console (F12) for details.");
      setPaying(false);
    }
  };

  const handleAddonPay = async () => {
    if (!user) return;
    if (!paystackReady) { alert("Payment gateway still loading. Please wait a moment."); return; }
    if (!process.env.NEXT_PUBLIC_PAYSTACK_KEY) { alert("Paystack key not configured. Contact admin."); return; }
    setPaying(true);
    const addonTotal = (selectedTestAddon?.price || 0) + (selectedStudentAddon?.price || 0);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: user.organizationId,
          amount: addonTotal,
          email: user.email,
          package: (selectedTestAddon ? selectedTestAddon.name : "") + (selectedStudentAddon ? ` + ${selectedStudentAddon.name}` : ""),
        }),
      });
      const data = await res.json();
      if (!data.reference) { alert(data.error || "Failed to initialize."); setPaying(false); return; }

      const popup = new window.PaystackPop();
      popup.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_KEY,
        email: user.email,
        amount: Math.round(addonTotal * 100),
        ref: data.reference,
        onSuccess: (txn) => {
          fetch(`/api/payments?reference=${txn.reference}`)
            .then(() => { setSuccess(true); setTimeout(() => router.refresh(), 2000); })
            .catch(() => {})
            .finally(() => setPaying(false));
        },
        onCancel: () => { setPaying(false); },
      });
    } catch (e) {
      console.error("handleAddonPay error:", e);
      alert("Payment failed. Check console (F12) for details.");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
      </div>
    );
  }

  if (org?.status === "active") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Organization Active</h2>
          <p className="text-gray-600 text-sm mb-6">Your organization is already active. You can manage your subscription below.</p>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-left mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Current Limits</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Tests:</span> <span className="font-medium">{org.testsUsed}/{org.testLimit}</span> {org.bonusTests ? <span className="text-indigo-500">+{org.bonusTests} bonus</span> : ""}</div>
              <div><span className="text-gray-500">Students:</span> <span className="font-medium">{org.studentsUsed}/{org.studentLimit}</span> {org.bonusStudents ? <span className="text-indigo-500">+{org.bonusStudents} bonus</span> : ""}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Buy Add-Ons</h3>
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Test Add-Ons</p>
              <div className="grid sm:grid-cols-3 gap-3">
                {TEST_ADDONS.map((a) => (
                  <button key={a.name} onClick={() => setSelectedTestAddon(selectedTestAddon?.name === a.name ? null : a)}
                    className={`p-3 rounded-xl border text-left transition-all ${selectedTestAddon?.name === a.name ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500" : "border-gray-200 hover:border-indigo-200"}`}>
                    <p className="text-sm font-semibold text-gray-900">{a.name}</p>
                    <p className="text-xs text-gray-500">+{a.tests} tests</p>
                    <p className="text-sm font-bold text-indigo-600 mt-1">₦{a.price?.toLocaleString()}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Student Add-Ons</p>
              <div className="grid sm:grid-cols-3 gap-3">
                {STUDENT_ADDONS.map((a) => (
                  <button key={a.name} onClick={() => setSelectedStudentAddon(selectedStudentAddon?.name === a.name ? null : a)}
                    className={`p-3 rounded-xl border text-left transition-all ${selectedStudentAddon?.name === a.name ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500" : "border-gray-200 hover:border-indigo-200"}`}>
                    <p className="text-sm font-semibold text-gray-900">{a.name}</p>
                    <p className="text-xs text-gray-500">+{a.students} students</p>
                    <p className="text-sm font-bold text-indigo-600 mt-1">₦{a.price?.toLocaleString()}</p>
                  </button>
                ))}
              </div>
            </div>
            {(selectedTestAddon || selectedStudentAddon) && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Total</span>
                  <span className="text-lg font-bold text-indigo-600">₦{((selectedTestAddon?.price || 0) + (selectedStudentAddon?.price || 0)).toLocaleString()}</span>
                </div>
                <button onClick={handleAddonPay} disabled={paying || (!selectedTestAddon && !selectedStudentAddon)}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-blue-600 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200">
                  {paying ? "Processing..." : "Pay Now"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Activate Your Organization</h1>
        <p className="text-gray-500 text-sm">Choose a plan to activate your organization and start creating tests.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PRICING_PLANS.map((plan, i) => (
          <button key={plan.name} onClick={() => setSelectedPlan(selectedPlan?.name === plan.name ? null : plan)}
            className={`relative bg-white rounded-2xl border p-5 text-left transition-all ${
              selectedPlan?.name === plan.name ? "border-indigo-500 ring-2 ring-indigo-200 shadow-lg" : "border-gray-200 hover:border-indigo-200 shadow-sm"
            }`}>
            {i === 2 && <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-[10px] font-semibold px-3 py-0.5 rounded-full">Popular</div>}
            <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
            <p className="text-2xl font-bold text-indigo-600 mt-2">₦{plan.price.toLocaleString()}</p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center gap-2 text-xs text-gray-600">
                <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {plan.tests} Tests
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-600">
                <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {plan.students.toLocaleString()} Students
              </li>
            </ul>
          </button>
        ))}
      </div>

      {selectedPlan && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-900">Add-Ons <span className="text-sm font-normal text-gray-400">(optional)</span></h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {TEST_ADDONS.map((a) => (
              <button key={a.name} onClick={() => setSelectedTestAddon(selectedTestAddon?.name === a.name ? null : a)}
                className={`p-4 rounded-xl border text-left transition-all ${selectedTestAddon?.name === a.name ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500" : "border-gray-200 hover:border-indigo-200"}`}>
                <p className="text-sm font-semibold text-gray-900">{a.name}</p>
                <p className="text-xs text-gray-500">+{a.tests} tests</p>
                <p className="text-sm font-bold text-indigo-600 mt-1">₦{a.price?.toLocaleString()}</p>
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {STUDENT_ADDONS.map((a) => (
              <button key={a.name} onClick={() => setSelectedStudentAddon(selectedStudentAddon?.name === a.name ? null : a)}
                className={`p-4 rounded-xl border text-left transition-all ${selectedStudentAddon?.name === a.name ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500" : "border-gray-200 hover:border-indigo-200"}`}>
                <p className="text-sm font-semibold text-gray-900">{a.name}</p>
                <p className="text-xs text-gray-500">+{a.students} students</p>
                <p className="text-sm font-bold text-indigo-600 mt-1">₦{a.price?.toLocaleString()}</p>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">Plan: <span className="font-semibold text-gray-900">{selectedPlan.name}</span></p>
                <p className="text-xs text-gray-400">{selectedPlan.tests} tests, {selectedPlan.students.toLocaleString()} students</p>
              </div>
              <span className="text-2xl font-bold text-gray-900">₦{totalAmount.toLocaleString()}</span>
            </div>
            <button onClick={handlePay} disabled={paying || !paystackReady}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-blue-600 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200">
              {paying ? "Processing..." : `Pay ₦${totalAmount.toLocaleString()} with Paystack`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
