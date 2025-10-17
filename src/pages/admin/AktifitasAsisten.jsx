// pages/AktivitasAsisten.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table } from "../../components/DefaultTable";

// --- Data dummy ---
const seed = [
  {
    id: "r1",
    nim: "10123194",
    tanggal: "19/08/2025",
    kelas: "ARS-1",
    asisten: "Airin",
    waktu: "07.00-09.30",
    kelengkapan: "Komputer",
    jml_awal: 10,
    jml_akhir: 9,
    kerusakan: "Keyboard tidak berfungsi (PC-12)",
    tindak_lanjut: "Ganti keyboard minggu ini",
    status: "Tidak Lengkap",
  },
  {
    id: "r2",
    nim: "10123194",
    tanggal: "19/08/2025",
    kelas: "ARS-1",
    asisten: "Airin",
    waktu: "07.00-09.30",
    kelengkapan: "Motherboard",
    jml_awal: 10,
    jml_akhir: 10,
    kerusakan: "-",
    tindak_lanjut: "-",
    status: "Lengkap",
  },
  {
    id: "r3",
    nim: "10123193",
    tanggal: "20/08/2025",
    kelas: "IF-2",
    asisten: "Annisa",
    waktu: "10.00-12.00",
    kelengkapan: "Komputer",
    jml_awal: 12,
    jml_akhir: 12,
    kerusakan: "-",
    tindak_lanjut: "-",
    status: "Lengkap",
  },
];

export default function AktivitasAsisten() {
  const { nim } = useParams();
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [rowsRaw, setRowsRaw] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Fetch dari backend ---
  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      try {
        // const res = await fetch(`/api/asisten/${nim}/aktivitas`);
        // const json = await res.json();
        // if (!ignore) setRowsRaw(json?.data ?? []);

        // Demo tanpa API: filter data dummy berdasarkan nim
        const demo = seed.filter((r) => r.nim === nim);
        if (!ignore) setRowsRaw(demo);
      } catch (e) {
        console.error(e);
        if (!ignore) setRowsRaw([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [nim]);

  // --- Kolom tabel (DefaultTable) ---
  const columns = useMemo(
    () => [
      { key: "no", header: "#" },
      { key: "tanggal", header: "Hari/Tanggal" },
      { key: "kelas", header: "Dosen/Kelas" },
      { key: "asisten", header: "Asisten" },
      { key: "waktu", header: "Waktu" },
      { key: "kelengkapan", header: "Kelengkapan" },
      { key: "jml_awal", header: "Jumlah Awal", align: "right" },
      { key: "jml_akhir", header: "Jumlah Akhir", align: "right" },
      {
        key: "kerusakan",
        header: "Kerusakan",
        render: (v) => (
          <div className="max-w-[26rem] whitespace-pre-line break-words">
            {v}
          </div>
        ),
      },
      {
        key: "tindak_lanjut",
        header: "Tindak Lanjut",
        render: (v) => (
          <div className="max-w-[26rem] whitespace-pre-line break-words">
            {v}
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (v) => (
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset
            ${
              v === "Lengkap"
                ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
                : v === "Tidak Lengkap"
                ? "bg-yellow-500/15 text-yellow-300 ring-yellow-500/30"
                : "bg-slate-500/15 text-slate-300 ring-slate-500/30"
            }`}
          >
            {v}
          </span>
        ),
      },
    ],
    []
  );

  // --- Proses data + pencarian ---
  const rows = useMemo(() => {
    let base = rowsRaw;
    if (q.trim()) {
      const needle = q.toLowerCase();
      base = base.filter(
        (r) =>
          r.tanggal.toLowerCase().includes(needle) ||
          r.kelas.toLowerCase().includes(needle) ||
          r.asisten.toLowerCase().includes(needle) ||
          r.waktu.toLowerCase().includes(needle) ||
          r.kelengkapan.toLowerCase().includes(needle) ||
          String(r.kerusakan).toLowerCase().includes(needle) ||
          String(r.tindak_lanjut).toLowerCase().includes(needle) ||
          r.status.toLowerCase().includes(needle)
      );
    }
    return base.map((r, i) => ({ no: i + 1, ...r }));
  }, [rowsRaw, q]);

  return (
    <div className="p-4 lg:ml-56 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-white">
          Aktivitas Asisten — {nim}
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-100 hover:bg-white/10"
        >
          Kembali
        </button>
      </div>

      {/* Filter/Search */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari (tanggal/kelas/kelengkapan/kerusakan)…"
          className="w-full sm:w-96 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
          aria-label="Pencarian aktivitas"
        />
      </div>

      {/* Tabel */}
      {loading ? (
        <div className="text-slate-300 text-sm">Memuat data…</div>
      ) : (
        <Table columns={columns} data={rows} />
      )}
    </div>
  );
}
