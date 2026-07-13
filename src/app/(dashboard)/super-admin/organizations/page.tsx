"use client";
import React, { useEffect, useState } from "react";

export default function SuperAdminOrganizations() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionOrg, setActionOrg] = useState<any>(null);
  const [actionType, setActionType] = useState("");
  const [actionValue, setActionValue] = useState("");

  const fetchOrgs = () => {
    fetch("/api/organizations")
      .then((r) => r.json())
      .then((data) => setOrgs(data.organizations || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrgs() }, []);

  const handleAction = async () => {
    if (!actionOrg) return;
    await fetch(`/api/organizations/${actionOrg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [actionType]: actionType.includes("Limit") || actionType.includes("bonus") ? parseInt(actionValue) : actionValue }),
    });
    setActionOrg(null);
    setActionValue("");
    fetchOrgs();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Organizations</h2>
        <p className="text-sm text-gray-500">{orgs.length} total organizations</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Organization</th>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Code</th>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Tests</th>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Students</th>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Date</th>
                <th className="text-right px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orgs.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 lg:px-6 py-4">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[160px] lg:max-w-none">{org.name}</p>
                    <p className="text-xs text-gray-500">{org.email}</p>
                  </td>
                  <td className="px-4 lg:px-6 py-4 hidden sm:table-cell">
                    <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded-md">{org.code}</span>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      org.status === "active" ? "bg-emerald-100 text-emerald-700" :
                      org.status === "suspended" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>{org.status}</span>
                  </td>
                  <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                    {org.testsUsed || 0}/{org.testLimit || 0}
                    {org.bonusTests ? <span className="text-xs text-indigo-500 ml-1">+{org.bonusTests}</span> : ""}
                  </td>
                  <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                    {org.studentsUsed || 0}/{org.studentLimit || 0}
                    {org.bonusStudents ? <span className="text-xs text-indigo-500 ml-1">+{org.bonusStudents}</span> : ""}
                  </td>
                  <td className="px-4 lg:px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">{new Date(org.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 lg:px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      {org.status !== "active" && <button onClick={() => { setActionOrg(org); setActionType("status"); setActionValue("active"); handleAction(); }} className="px-2.5 py-2 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">Activate</button>}
                      {org.status !== "suspended" && <button onClick={() => { setActionOrg(org); setActionType("status"); setActionValue("suspended"); handleAction(); }} className="px-2.5 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Suspend</button>}
                      {org.status === "suspended" && <button onClick={() => { setActionOrg(org); setActionType("status"); setActionValue("active"); handleAction(); }} className="px-2.5 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">Restore</button>}
                      <button onClick={() => { setActionOrg(org); setActionType("bonusTests"); setActionValue("5"); }} className="px-2.5 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">+Tests</button>
                      <button onClick={() => { setActionOrg(org); setActionType("bonusStudents"); setActionValue("100"); }} className="px-2.5 py-2 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">+Students</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {actionOrg && actionType.includes("bonus") && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => { setActionOrg(null); setActionValue(""); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Add {actionType === "bonusTests" ? "Tests" : "Students"}</h3>
              <p className="text-sm text-gray-500 mb-4">Organization: <strong>{actionOrg.name}</strong></p>
              <input type="number" value={actionValue} onChange={(e) => setActionValue(e.target.value)} placeholder="Quantity" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-4" />
              <div className="flex gap-3">
                <button onClick={() => { setActionOrg(null); setActionValue(""); }} className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                <button onClick={handleAction} className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors">Apply</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
