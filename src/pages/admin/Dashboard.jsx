/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "";
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

const LABS = [
  { id: "LAB00001", label: "LAB-609", href: "/admin/lab609" },
  { id: "LAB00002", label: "LAB-610", href: "/admin/lab610" },
];

export default function DashboardAdmin() {
  const [loading, setLoading] = useState(false);
  const [barangLoading, setBarangLoading] = useState(false);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const showSuccess = (msg = "Berhasil") => {
    setSuccessMsg(msg);
    window.clearTimeout(showSuccess._t);
    showSuccess._t = window.setTimeout(() => setSuccessMsg(""), 2500);
  };

  const fetchDamaged = useCallback(async () => {
    try {
      setLoading(true);
      // panggil API lain kalau perlu
    } catch (e) {
      setErr(e?.message || "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDamaged();
  }, [fetchDamaged]);

  const BG_URL =
    "https://i.pinimg.com/736x/00/00/00/000000000000000000000000000000.jpg";

  return (
    <div className="relative min-h-screen w-screen overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-black">
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      </div>

      {/* Main */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 lg:ml-56">
        {/* Toast */}
        {Boolean(successMsg) && (
          <div className="fixed right-4 top-4 z-[9999] rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-200 shadow-lg backdrop-blur">
            {successMsg}
          </div>
        )}

        {/* Hero */}
        <div className="relative w-full max-w-3xl text-center mb-10">
          {/* Refresh button (BLUE) */}
          <div className="absolute right-0 top-0">
            <button
              type="button"
              onClick={() => {
                fetchDamaged();
                showSuccess("Disegarkan");
              }}
              className="rounded-lg border border-blue-400/30 bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60 disabled:opacity-60"
              disabled={loading || barangLoading}
            >
              {loading || barangLoading ? "Memuat…" : "Refresh"}
            </button>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
            Dashboard Admin
          </h1>
          <p className="text-slate-200 mt-3 text-lg">
            Selamat datang di dashboard admin.
          </p>
          <p className="text-slate-400">
            Pilih salah satu laboratorium untuk melihat detail.
          </p>
        </div>

        {(loading || err) && (
          <div className="mb-4 text-sm text-slate-300">
            {loading && "Memuat…"}
            {err && <span className="text-red-300 ml-2">Error: {err}</span>}
          </div>
        )}

        {/* Quick nav cards (BLUE) */}
        <div className="grid gap-4 md:grid-cols-3 w-full max-w-4xl">
          {LABS.map((lab) => (
            <a
              key={lab.id}
              href={lab.href}
              className="group relative overflow-hidden rounded-2xl border border-blue-400/20 bg-blue-500/[0.08] p-5 text-left transition hover:bg-blue-500/[0.16] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/40"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-blue-300/90">
                    Laboratorium
                  </div>
                  <div className="mt-1 text-lg font-semibold text-white">
                    {lab.label}
                  </div>
                </div>
                <div
                  aria-hidden
                  className="rounded-xl border border-blue-300/30 bg-blue-400/20 px-3 py-1 text-xs text-blue-50 transition group-hover:translate-x-0.5"
                >
                  Buka →
                </div>
              </div>
              <div className="mt-3 text-sm text-blue-100/80">
                Lihat perangkat, stok, dan aktivitas lab {lab.label}.
              </div>
            </a>
          ))}

          {/* Kelola Barang card (BLUE) */}
          <Link
            to="/admin/barang"
            className="group relative overflow-hidden rounded-2xl border border-blue-400/20 bg-blue-500/[0.10] p-5 transition hover:bg-blue-500/[0.18] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-blue-300/90">
                  Master
                </div>
                <div className="mt-1 text-lg font-semibold text-white">
                  Kelola Barang
                </div>
              </div>
              <div
                aria-hidden
                className="rounded-xl border border-blue-300/30 bg-blue-400/20 px-3 py-1 text-xs text-blue-50 transition group-hover:translate-x-0.5"
              >
                Buka →
              </div>
            </div>
            <div className="mt-3 text-sm text-blue-100/85">
              Tambah atau hapus item pada master daftar barang.
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
