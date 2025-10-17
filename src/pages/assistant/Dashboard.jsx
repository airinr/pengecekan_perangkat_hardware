import React from "react";

export default function DashboardAsisten() {
  return (
    <div className="container mx-auto px-4 py-8 lg:ml-56">
      <h1 className="text-2xl font-bold mb-4">Dashboard Asisten</h1>
      <p>Selamat datang di dashboard asisten.</p>
      <div className="flex flex-wrap gap-3 pt-6">
        {/* Primary button */}
        <a
          href="/lab609"
          role="button"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70"
        >
          LAB-609
        </a>

        {/* Ghost/Secondary button */}
        <a
          href="/lab610"
          role="button"
          className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10 active:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/40"
        >
          LAB-610
        </a>
      </div>
    </div>
  );
}
