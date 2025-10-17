/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Table } from "../../components/DefaultTable";

const STATUS_COMPLETE = "Lengkap";
const STATUS_INCOMPLETE = "Tidak Lengkap";

// API base
const API_BASE = import.meta.env.VITE_API_URL || "";
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

export default function Lab610() {
  const navigate = useNavigate();

  // Data state
  const [rows, setRows] = useState([]); // diisi dari API
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filter baris tidak lengkap (untuk tabel bawah)
  const incompleteRows = useMemo(
    () => rows.filter((r) => r.status === STATUS_INCOMPLETE),
    [rows]
  );

  // State checklist untuk tabel bawah
  const [checkedMap, setCheckedMap] = useState({});
  const toggleChecked = (rowKey) =>
    setCheckedMap((m) => ({ ...m, [rowKey]: !m[rowKey] }));

  // ========= Ambil data dari /datalab/getdatalab/LAB00002 =========
  const fetchLabData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/datalab/getdatalab/LAB00002`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...NGROK_HEADERS,
        },
      });

      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({})))?.message ||
          "Gagal memuat data lab";
        throw new Error(msg);
      }

      const payload = await res.json();
      const list = Array.isArray(payload?.data) ? payload.data : [];

      // Map ke bentuk tabel — simpan jumlahNormal & jumlahRusak di root
      const mapped = list.map((item, idx) => {
        const idBarang = item?.idBarang ?? null;
        const nama =
          item?.barangModel?.namaBarang ?? item?.namaBarang ?? idBarang ?? "-";

        const jumlahNormal = Number(item?.jumlahNormal ?? 0);
        const jumlahRusak = Number(item?.jumlahRusak ?? 0);
        const jumlah =
          (Number.isFinite(jumlahNormal) ? jumlahNormal : 0) +
          (Number.isFinite(jumlahRusak) ? jumlahRusak : 0);

        const status = jumlahRusak > 0 ? STATUS_INCOMPLETE : STATUS_COMPLETE;

        return {
          id: `srv-${idx}`, // internal row id
          no: idx + 1,
          idBarang,
          nama,
          jumlahNormal,
          jumlahRusak,
          jumlah,
          status,
        };
      });

      setRows(mapped);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabData();
  }, [fetchLabData]);

  // ====== TINDAK LANJUT (ceklist): set rusak=0, total=normal, status=Lengkap ======
  const getJumlahNormal = (r) =>
    Number.isFinite(Number(r.jumlahNormal)) ? Number(r.jumlahNormal) : 0;

  const markResolved = async (row) => {
    const jn = getJumlahNormal(row);

    // Optimistic update di UI
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? { ...r, jumlahRusak: 0, jumlah: jn, status: STATUS_COMPLETE }
          : r
      )
    );

    // (Opsional) Simpan ke server bila row dari server (punya idBarang)
    try {
      if (!row.idBarang) return;
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/datalab/updateDataLab/LAB00001`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...NGROK_HEADERS,
        },
        body: JSON.stringify([
          {
            idBarang: row.idBarang,
            jumlahNormal: jn,
            jumlahRusak: 0,
          },
        ]),
      });
      if (!res.ok) {
        console.error("Gagal PUT tindak lanjut:", await res.text());
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Kolom tabel utama (tanpa kolom Aksi)
  const columns = useMemo(
    () => [
      { key: "no", header: "#" },
      { key: "nama", header: "Nama" },
      { key: "jumlahNormal", header: "Jumlah Normal" },
      { key: "jumlahRusak", header: "Jumlah Rusak" },
      { key: "jumlah", header: "Total" },
      {
        key: "status",
        header: "Status",
        render: (v) => (
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
              v === STATUS_COMPLETE
                ? "bg-green-500/15 text-green-300 ring-green-500/30"
                : v === STATUS_INCOMPLETE
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

  return (
    <div className="container mx-auto px-4 py-8 lg:ml-56">
      {/* Pilih kategori (opsional, tetap ada seperti sebelumnya) */}
      <label
        htmlFor="topik"
        className="mb-2 block text-sm font-medium text-slate-200"
      >
        Pilih kategori untuk melakukan laporan
      </label>

      <select
        id="topik"
        defaultValue=""
        onChange={(e) => {
          const to = e.target.value;
          if (to) navigate(to);
        }}
        className="mb-6 block w-full appearance-none rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 pr-9 text-sm text-slate-100"
      >
        <option value="" disabled>
          Pilih kategori
        </option>
        <option value="/lab610_merakit_pc">Merakit Komputer</option>
        <option value="/lab610_bios_partisi">Bios dan Partisi</option>
        <option value="/lab610_jarkom">Jaringan Komputer</option>
        <option value="/lab610_troubleshooting">Troubleshooting</option>
      </select>

      {/* Header + Button Refresh (hapus tombol Tambah) */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Perangkat Laboratorium 610</h1>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-xs text-slate-400 animate-pulse">
              Loading…
            </span>
          )}
          {error && (
            <span className="text-xs text-red-300">Error: {error}</span>
          )}
          <button
            onClick={fetchLabData}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-600 active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-slate-400/60"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tabel utama (tanpa kolom Aksi) */}
      <Table columns={columns} data={rows} />

      {/* Tabel bawah otomatis – tetap ada untuk tindak lanjut dengan checkbox */}
      {incompleteRows.length > 0 && (
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-1">Reports</h2>
          <p className="mb-4 text-sm text-slate-300">
            Berikut merupakan data perangkat yang rusak/hilang
          </p>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800">
                <tr className="text-left">
                  <th className="px-4 py-3 text-slate-200">#</th>
                  <th className="px-4 py-3 text-slate-200">Nama</th>
                  <th className="px-4 py-3 text-slate-200">Jumlah Normal</th>
                  <th className="px-4 py-3 text-slate-200">Jumlah Rusak</th>
                  <th className="px-4 py-3 text-slate-200">Total</th>
                  <th className="px-4 py-3 text-slate-200">Status</th>
                  <th className="px-4 py-3 text-slate-200">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {incompleteRows.map((row) => (
                  <tr
                    key={row.id || row.no}
                    className="border-t border-slate-800"
                  >
                    <td className="px-4 py-2">{row.no}</td>
                    <td className="px-4 py-2">{row.nama}</td>
                    <td className="px-4 py-2">{row.jumlahNormal}</td>
                    <td className="px-4 py-2">{row.jumlahRusak}</td>
                    <td className="px-4 py-2">{row.jumlah}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-yellow-500/15 text-yellow-300 ring-yellow-500/30">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-blue-600"
                          checked={!!checkedMap[row.id || row.no]}
                          disabled={row.status === STATUS_COMPLETE}
                          onChange={(e) => {
                            const key = row.id || row.no;
                            const checked = e.target.checked;
                            setCheckedMap((m) => ({ ...m, [key]: checked }));
                            if (checked) {
                              // tandai sudah ditindaklanjuti
                              markResolved(row);
                            }
                          }}
                        />
                        <span className="text-xs text-slate-300">
                          Selesai / sudah ditindaklanjuti
                        </span>
                      </label>
                    </td>
                  </tr>
                ))}
                {incompleteRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-slate-400"
                    >
                      Tidak ada data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
