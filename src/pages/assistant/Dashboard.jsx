import React from "react";

export default function DashboardAsisten() {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden mt-16 sm:mt-6">
      {/* === FULL BLACK BACKGROUND === */}
      <div className="fixed inset-0 -z-50 bg-black" />

      {/* Page container (tetap pakai lg:ml-56) */}
      <div className="w-full max-w-6xl mx-auto px-4 py-8 lg:ml-56 text-slate-100">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Dashboard Asisten
          </h1>
          <p className="mt-1 text-slate-400">
            Selamat datang 👋 — Pilih laboratorium untuk melakukan pelaporan
          </p>
        </div>

        {/* PERANGKAT LABORATORIUM */}
        <section className="mt-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
            PERANGKAT LABORATORIUM
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <CardPerangkat
              lab="LAB-609"
              href="/perangkatlab?lab=609"
              subtitle="Hardware & Praktikum"
              tone="blue"
            />
            <CardPerangkat
              lab="LAB-610"
              href="/perangkatlab?lab=610"
              subtitle="Hardware & Praktikum"
              tone="cyan"
            />
          </div>
        </section>

        {/* PELAPORAN */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
            PELAPORAN PERANGKAT LABORATORIUM
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <QuickAction
              href="/lab609"
              title="LAB-609"
              desc="Kelas praktikum: Merakit Komputer, BIOS & Partisi, Jaringan Komputer, Troubleshooting"
              badge="Hardware"
            />
            <QuickAction
              href="/lab610"
              title="LAB-610"
              desc="Kelas praktikum: Merakit Komputer, BIOS & Partisi, Jaringan Komputer, Troubleshooting"
              tone="secondary"
              badge="Hardware"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------------- Components ---------------- */

function QuickAction({ href, title, desc, tone = "primary", badge }) {
  const tones = {
    primary:
      "bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:shadow-lg",
    secondary:
      "bg-gradient-to-br from-sky-500 to-cyan-500 text-white hover:shadow-lg",
    outline:
      "bg-slate-900/70 text-slate-100 border border-white/10 hover:bg-slate-900",
  };

  return (
    <a
      href={href}
      role="button"
      className={`group w-full rounded-2xl p-5 transition transform hover:-translate-y-0.5 ${tones[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold leading-tight">{title}</h3>
          <p className="mt-1 text-sm opacity-90">{desc}</p>
        </div>
        {badge && (
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold tracking-wide">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-4 inline-flex items-center gap-2 text-sm opacity-90">
        <span className="underline decoration-white/40 group-hover:decoration-white">
          Buka
        </span>
        <svg
          className="size-4 translate-x-0 group-hover:translate-x-0.5 transition-transform"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M7 17L17 7M17 7H9M17 7v8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </a>
  );
}

/* CardPerangkat tanpa jumlah, kontras di hitam */
function CardPerangkat({ lab, href, subtitle, tone = "blue" }) {
  const toneGrad =
    tone === "cyan"
      ? "from-cyan-500 to-sky-500"
      : tone === "indigo"
      ? "from-indigo-500 to-purple-500"
      : "from-blue-600 to-indigo-600";

  return (
    <a
      href={href}
      role="button"
      className="group block w-full rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur shadow-sm hover:shadow-md transition overflow-hidden"
    >
      <div className={`h-2 w-full bg-gradient-to-r ${toneGrad}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{lab}</h3>
            {subtitle && (
              <p className="text-xs mt-0.5 text-slate-400">{subtitle}</p>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ring-white/10 group-hover:bg-slate-800 transition">
            Buka
            <svg
              className="size-3.5 translate-x-0 group-hover:translate-x-0.5 transition-transform"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M7 17L17 7M17 7H9M17 7v8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </a>
  );
}
