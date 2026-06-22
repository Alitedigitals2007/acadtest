"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title: string;
  user?: { name?: string; email?: string; role?: string } | null;
}

export default function Header({ title, user }: HeaderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("acadtest_user");
    setOpen(false);
    router.push("/login");
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="text-white font-bold text-xs">A</span>
          </div>
          <h1 className="text-sm font-bold text-gray-900 truncate">{title}</h1>
        </div>
        {user && (
          <button onClick={() => setOpen(true)} className="flex items-center gap-2 p-1.5 -mr-1.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-gray-900 leading-tight">{user.name || "User"}</p>
              <p className="text-[10px] text-gray-400 capitalize">{user.role?.replace("_", " ")}</p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>
          </button>
        )}
      </header>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="px-6 pt-3 pb-2 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center text-white text-lg font-bold">
                  {(user?.name || "U").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-gray-900 truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
              </div>
            </div>
            <div className="px-3 py-2">
              <div className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-500">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {user?.role?.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </div>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
            <div className="pb-8" />
          </div>
        </div>
      )}
    </>
  );
}
