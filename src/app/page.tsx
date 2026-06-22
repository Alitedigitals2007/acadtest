"use client";
import Link from "next/link";
import { useState } from "react";
import { PRICING_PLANS } from "@/types";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-100 fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <span className="text-white font-bold text-base">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">AcadTest</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <Link href="/exam" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">Take Test</Link>
              <Link href="/participant/login" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">Check Result</Link>
              <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-4 py-2">Login</Link>
              <Link href="/register" className="text-sm font-medium bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-5 py-2.5 rounded-xl hover:from-indigo-700 hover:to-blue-600 transition-all shadow-lg shadow-indigo-200">
                Get Started
              </Link>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-100 pt-4 space-y-3">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-gray-600 hover:text-gray-900 py-2">Features</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-gray-600 hover:text-gray-900 py-2">Pricing</a>
              <Link href="/exam" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-indigo-600 py-2">Take Test</Link>
              <Link href="/participant/login" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-emerald-600 py-2">Check Result</Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-gray-700 py-2">Login</Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-5 py-2.5 rounded-xl text-center">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>

      <section className="relative pt-28 sm:pt-32 lg:pt-40 pb-16 sm:pb-20 lg:pb-28 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-blue-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-indigo-200/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Multi-Tenant CBT Platform
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-6">
            CBT & Assessment
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">Platform for Modern Education</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Create, manage, and assess online tests at scale. Built for schools, universities, and organizations with multi-tenant architecture.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/exam"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-blue-600 transition-all shadow-lg shadow-indigo-200 text-center"
            >
              Take a Test
            </Link>
            <Link
              href="/participant/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 text-center"
            >
              Check Your Result
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-gray-100 text-gray-800 font-medium rounded-xl hover:bg-gray-200 transition-colors text-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 sm:py-20 lg:py-24 px-4 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Why Choose AcadTest?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Everything you need to deliver seamless online assessments</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              { title: "Multi-Tenant Architecture", desc: "Manage multiple organizations from a single dashboard with isolated data and custom configurations.", icon: "🏢" },
              { title: "Advanced Test Engine", desc: "Supports multiple question types, automated marking, time limits, and secure test delivery.", icon: "⚡" },
              { title: "Real-time Analytics", desc: "Track performance with detailed reports, leaderboards, and actionable insights.", icon: "📊" },
              { title: "Bulk Operations", desc: "Upload students and questions in bulk using CSV, Excel, or JSON formats.", icon: "📁" },
              { title: "Secure & Scalable", desc: "Built with Next.js and PostgreSQL, ensuring security, speed, and scalability.", icon: "🔒" },
              { title: "Public & Private Tests", desc: "Create tests accessible via public codes for external candidates or private for registered students.", icon: "🌐" },
            ].map((f) => (
              <div key={f.title} className="group bg-white p-6 lg:p-8 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-16 sm:py-20 lg:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Choose the plan that fits your organization&apos;s needs</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING_PLANS.map((plan, i) => (
              <div key={plan.name} className={`relative bg-white border rounded-2xl p-6 lg:p-8 transition-all duration-300 hover:shadow-xl ${i === 2 ? 'border-indigo-200 shadow-lg shadow-indigo-50 ring-1 ring-indigo-100' : 'border-gray-200 hover:border-indigo-100'}`}>
                {i === 2 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {plan.tests >= 200 ? "For large institutions" : plan.tests >= 75 ? "For growing organizations" : plan.tests >= 30 ? "For small teams" : "For getting started"}
                </p>
                <p className="text-4xl font-bold text-gray-900 mb-6">
                  ₦{plan.price.toLocaleString()}
                  <span className="text-base font-normal text-gray-400">/once</span>
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {plan.tests} Tests
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Up to {plan.students.toLocaleString()} Students
                  </li>
                </ul>
                <Link
                  href="/register"
                  className={`block text-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${i === 2 ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white hover:from-indigo-700 hover:to-blue-600 shadow-lg shadow-indigo-200' : 'bg-gray-50 text-gray-800 hover:bg-gray-100'}`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 px-4 bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Powered by Prepium</h2>
          <p className="text-lg text-indigo-200/80 mb-10 max-w-2xl mx-auto">
            AcadTest is built on the Prepium platform — a comprehensive educational technology ecosystem helping students prepare for examinations and improve academic performance.
          </p>
          <a
            href="https://theprepium.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-700 font-medium rounded-xl hover:bg-indigo-50 transition-colors shadow-xl"
          >
            Learn More About Prepium
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </section>

      <footer className="bg-gray-950 text-gray-400 py-12 sm:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-base">A</span>
                </div>
                <span className="text-lg font-bold text-white">AcadTest</span>
              </div>
              <p className="text-sm leading-relaxed">Multi-tenant CBT and assessment platform for modern education.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="https://theprepium.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Prepium</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2.5 text-sm">
                <li>support@acadtest.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            &copy; {new Date().getFullYear()} AcadTest. All rights reserved. Powered by Prepium.
          </div>
        </div>
      </footer>
    </div>
  );
}
