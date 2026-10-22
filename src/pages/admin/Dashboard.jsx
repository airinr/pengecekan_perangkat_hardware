import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import jadwalImg from "@/assets/images/jadwal.png";

const LABS = [
  { id: "LAB00001", label: "LAB-609", href: "/admin/lab/609" },
  { id: "LAB00002", label: "LAB-610", href: "/admin/lab/610" },
];

export default function DashboardAdmin() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

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

  return (
    <div className="relative min-h-screen w-full overflow-hidden pt-16 sm:pt-6">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-black">
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      </div>

      {/* Main */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 lg:ml-56">

        {/* Hero */}
        <div className="relative w-full max-w-3xl text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
            Dashboard Admin
          </h1>
          <p className="text-slate-200 mt-3 text-base sm:text-lg">
            Selamat datang di dashboard admin.
          </p>
          <p className="text-slate-400 text-sm">
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
            <Link
              key={lab.id}
              to={lab.href}
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
            </Link>
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

        {/* Jadwal */}
        <div className="mt-10 w-full max-w-4xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 text-center">
            Jadwal
          </h2>
          <div className="flex justify-center">
            <img
              src={jadwalImg}
              alt="Jadwal"
              className="w-full max-w-3xl rounded-2xl border border-white/10 object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
