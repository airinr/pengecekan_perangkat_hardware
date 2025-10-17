/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Table } from "../../components/DefaultTable";

const API_BASE = import.meta.env.VITE_API_URL || "";
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

const LABS = [
  { id: "LAB00001", label: "LAB-609" },
  { id: "LAB00002", label: "LAB-610" },
];

export default function DashboardAdmin() {
  const columns = useMemo(
    () => [
      { key: "no", header: "#" },
      { key: "tanggal", header: "Tanggal" },
      { key: "lab", header: "Lab" },
      { key: "asisten", header: "Asisten" },
      {
        key: "status",
        header: "Status",
        render: (v) => (
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset
            ${
              v === "Selesai"
                ? "bg-green-500/15 text-green-300 ring-green-500/30"
                : v === "Proses"
                ? "bg-yellow-500/15 text-yellow-300 ring-yellow-500/30"
                : "bg-slate-500/15 text-slate-300 ring-slate-500/30"
            }`}
          >
            {v}
          </span>
        ),
      },
      {
        key: "kerusakan",
        header: "Kerusakan",
        render: (v) => {
          const items = String(v)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          return (
            <ul className="list-disc pl-5 space-y-1 max-w-[28rem] whitespace-pre-line break-words leading-relaxed">
              {items.map((it, i) => (
                <li key={i}>{it}</li>
              ))}
            </ul>
          );
        },
      },
      { key: "jumlah_rusak", header: "Jumlah Rusak", align: "right" },
      {
        key: "aksi",
        header: "",
        render: (_, row) => (
          <div className="flex justify-end">
            <a
              href={`/reports/${row.id}`}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white bg-slate-700 hover:bg-slate-600"
            >
              Lihat
            </a>
          </div>
        ),
      },
    ],
    []
  );

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // --- state untuk modal Tambah Data
  const [showAdd, setShowAdd] = useState(false);
  const [namaBarang, setNamaBarang] = useState("");
  const [adding, setAdding] = useState(false);
  const [addErr, setAddErr] = useState("");

  const fetchDamaged = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const token = localStorage.getItem("token");
      const results = await Promise.all(
        LABS.map(async (lab) => {
          const res = await fetch(
            `${API_BASE}/datalab/getdatalab/${encodeURIComponent(lab.id)}`,
            {
              headers: {
                Accept: "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...NGROK_HEADERS,
              },
            }
          );
          if (!res.ok) {
            const msg =
              (await res.json().catch(() => ({})))?.message ||
              `Gagal memuat data ${lab.label}`;
            throw new Error(msg);
          }
          const payload = await res.json();
          const list = Array.isArray(payload?.data) ? payload.data : [];
          const damaged = list.filter((it) => Number(it?.jumlahRusak ?? 0) > 0);

          return damaged.map((it) => {
            const idBarang = it?.idBarang ?? "";
            const nama =
              it?.barangModel?.namaBarang || it?.namaBarang || idBarang || "-";
            const jumlahRusak = Number(it?.jumlahRusak ?? 0);

            return {
              id: `${lab.id}-${idBarang}`,
              tanggal: "–",
              lab: lab.label,
              asisten: "–",
              status: "Proses",
              kerusakan: `${nama} rusak (${jumlahRusak})`,
              jumlah_rusak: jumlahRusak,
            };
          });
        })
      );

      const flat = results.flat();
      const withNo = flat.map((row, idx) => ({ no: idx + 1, ...row }));
      setData(withNo);
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Gagal memuat data rusak.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchDamaged();
    })();
  }, [fetchDamaged]);

  // --- submit tambah data (nama barang saja)
  const onSubmitAdd = async (e) => {
    e.preventDefault();
    const nama = namaBarang.trim();
    if (!nama) {
      setAddErr("Nama barang wajib diisi.");
      return;
    }
    setAddErr("");
    setAdding(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/datalab/addDataLab`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...NGROK_HEADERS,
        },
        body: JSON.stringify({ namaBarang: nama }),
      });
      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({})))?.message ||
          "Gagal menambahkan data.";
        throw new Error(msg);
      }
      setShowAdd(false);
      setNamaBarang("");
      await fetchDamaged(); // refresh
    } catch (e) {
      console.error(e);
      setAddErr(e?.message || "Gagal menambahkan data.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 lg:ml-56">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Admin</h1>
          <p>Selamat datang di dashboard admin.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchDamaged}
            className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Memuat…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Tombol LAB */}
      <div className="flex flex-wrap gap-3 pt-2">
        <a
          href="/admin/lab609"
          role="button"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70"
        >
          LAB-609
        </a>
        <a
          href="/admin/lab610"
          role="button"
          className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10 active:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/40"
        >
          LAB-610
        </a>
      </div>

      {/* ⬇️ Tambah Data dipindah ke bawah tombol LAB */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => {
            setNamaBarang("");
            setAddErr("");
            setShowAdd(true);
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          + Tambah Data
        </button>
      </div>

      {/* Info status fetch */}
      <div className="mt-4 text-sm">
        {loading && <span className="text-slate-400">Memuat…</span>}
        {err && <span className="text-red-300 ml-2">Error: {err}</span>}
      </div>

      {/* (Opsional) tampilkan tabel bila diperlukan */}
      {/* <Table columns={columns} data={data} /> */}

      {/* Modal Tambah Data */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowAdd(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Tambah Data</h3>
              <button
                onClick={() => setShowAdd(false)}
                className="rounded-lg p-1 text-slate-300 hover:bg-white/10"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            <form onSubmit={onSubmitAdd} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  Nama Barang
                </label>
                <input
                  value={namaBarang}
                  onChange={(e) => setNamaBarang(e.target.value)}
                  placeholder="Contoh: Gunting"
                  className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  autoFocus
                />
                {addErr && (
                  <div className="mt-1 text-xs text-red-300">{addErr}</div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {adding ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>

            <p className="mt-3 text-[11px] text-slate-400">
              Data otomatis masuk ke 2 lab(LAB609 dan LAB610).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
