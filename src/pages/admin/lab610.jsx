/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Table } from "../../components/DefaultTable";

const STATUS_COMPLETE = "Lengkap";
const STATUS_INCOMPLETE = "Tidak Lengkap";

// === PRAKTIKUM (dari tabel yang kamu kirim) ===
const PRAKTIKUMS = [
  { idPraktikum: "PRTK00001", namaPraktikum: "Merakit Komputer" },
  { idPraktikum: "PRTK00002", namaPraktikum: "BIOS dan Partisi" },
  { idPraktikum: "PRTK00003", namaPraktikum: "Jaringan Komputer" },
  { idPraktikum: "PRTK00004", namaPraktikum: "Installasi Sistem Operasi" },
];

// Map idPraktikum ke rute tujuan (silakan sesuaikan dengan routing milikmu)
const PRAKTIKUM_ROUTE = {
  PRTK00001: "/lab610_merakit_pc",
  PRTK00002: "/lab610_bios_partisi",
  PRTK00003: "/lab610_jarkom",
  PRTK00004: "/lab610_troubleshooting",
};

// API base
const API_BASE = import.meta.env.VITE_API_URL || "";
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

export default function Lab610() {
  const navigate = useNavigate();

  // Data state
  const [rows, setRows] = useState([]); // diisi dari API
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filter baris tidak lengkap
  const incompleteRows = useMemo(
    () => rows.filter((r) => r.status === STATUS_INCOMPLETE),
    [rows]
  );

  // State checklist untuk tabel bawah
  const [checkedMap, setCheckedMap] = useState({});
  const toggleChecked = (rowKey) =>
    setCheckedMap((m) => ({ ...m, [rowKey]: !m[rowKey] }));

  // Modal Add/Edit Perangkat
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("add"); // 'add' | 'edit'
  const [editingId, setEditingId] = useState(null); // pakai row.id (internal)
  const [form, setForm] = useState({
    idBarang: "", // perlu untuk PUT
    nama: "",
    kategori: "",
    jumlah: "",
    jumlahNormal: "",
    jumlahRusak: "",
    status: STATUS_COMPLETE,
  });

  const onChangeForm = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const resetForm = () =>
    setForm({
      idBarang: "",
      nama: "",
      kategori: "",
      jumlah: "",
      jumlahNormal: "",
      jumlahRusak: "",
      status: STATUS_COMPLETE,
    });

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
  }, [API_BASE]);

  useEffect(() => {
    fetchLabData();
  }, [fetchLabData]);

  // ====== CREATE (lokal) - opsional ======
  const onSubmitAdd = async (e) => {
    e.preventDefault();
    if (!form.nama.trim()) return alert("Nama perangkat wajib diisi.");
    const j = Number(form.jumlah);
    if (!Number.isFinite(j) || j < 0) return alert("Jumlah tidak valid.");

    const nextNo = rows.length > 0 ? Math.max(...rows.map((r) => r.no)) + 1 : 1;
    const newLocal = {
      id: crypto?.randomUUID?.() || `tmp-${Date.now()}`,
      no: nextNo,
      idBarang: "",
      nama: form.nama.trim(),
      jumlahNormal: 0,
      jumlahRusak: 0,
      jumlah: j,
      status:
        form.status === STATUS_INCOMPLETE ? STATUS_INCOMPLETE : STATUS_COMPLETE,
    };
    setRows((prev) => [...prev, newLocal]);
    setShowModal(false);
    resetForm();
  };

  // ====== EDIT (PUT ke server) ======
  const openEdit = (row) => {
    setMode("edit");
    setEditingId(row.id);
    setForm({
      idBarang: row.idBarang || "",
      nama: row.nama ?? "",
      kategori: row.kategori ?? "",
      jumlah: String(row.jumlah ?? ""),
      jumlahNormal:
        row.jumlahNormal !== undefined ? String(row.jumlahNormal) : "",
      jumlahRusak: row.jumlahRusak !== undefined ? String(row.jumlahRusak) : "",
      status: row.status ?? STATUS_COMPLETE,
    });
    setShowModal(true);
  };

  const onSubmitEdit = async (e) => {
    e.preventDefault();

    if (!form.idBarang) {
      alert(
        "idBarang kosong. Data ini tidak berasal dari server atau idBarang tidak tersedia."
      );
      return;
    }

    const jn = Number(form.jumlahNormal);
    const jr = Number(form.jumlahRusak);
    if (!Number.isFinite(jn) || jn < 0)
      return alert("Jumlah Normal tidak valid.");
    if (!Number.isFinite(jr) || jr < 0)
      return alert("Jumlah Rusak tidak valid.");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/datalab/updateDataLab/LAB00002`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...NGROK_HEADERS,
        },
        body: JSON.stringify([
          {
            idBarang: form.idBarang,
            jumlahNormal: jn,
            jumlahRusak: jr,
          },
        ]),
      });

      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({})))?.message ||
          "Gagal mengubah data lab";
        throw new Error(msg);
      }

      const total = jn + jr;
      const status = jr > 0 ? STATUS_INCOMPLETE : STATUS_COMPLETE;

      // Update lokal
      setRows((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? {
                ...r,
                jumlahNormal: jn,
                jumlahRusak: jr,
                jumlah: total,
                status,
              }
            : r
        )
      );

      setShowModal(false);
      resetForm();
      setEditingId(null);
      setMode("add");
    } catch (err) {
      console.error(err);
      alert(err?.message || "Gagal mengubah data (PUT).");
    }
  };

  // ====== HAPUS (lokal) ======
  // const onDeleteRow = async (row) => {
  //   if (!confirm(`Hapus perangkat "${row.nama}"?`)) return;
  //   setRows((prev) => {
  //     const filtered = prev.filter((r) => r.id !== row.id);
  //     return filtered.map((r, idx) => ({ ...r, no: idx + 1 }));
  //   });
  // };

  // ====== KIRIM DATA PRAKTIKUM KE HALAMAN SELANJUTNYA ======
  const goToPraktikum = (idPraktikum) => {
    const data = PRAKTIKUMS.find((p) => p.idPraktikum === idPraktikum);
    const to = PRAKTIKUM_ROUTE[idPraktikum];

    if (!data || !to) return;

    // simpan juga di sessionStorage agar tetap ada saat refresh
    sessionStorage.setItem("selectedPraktikum", JSON.stringify(data));

    // kirim via state
    navigate(to, { state: { praktikum: data } });
  };

  // ====== TANDAI SELESAI (jumlahNormal += jumlahRusak; jumlahRusak = 0) ======
  const markResolved = async (row) => {
    const jn = Number(row.jumlahNormal ?? 0);
    const jr = Number(row.jumlahRusak ?? 0);
    const newNormal =
      (Number.isFinite(jn) ? jn : 0) + (Number.isFinite(jr) ? jr : 0);
    const newRusak = 0;

    // Jika baris lokal (tanpa idBarang server), cukup update state
    if (!row.idBarang) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                jumlahNormal: newNormal,
                jumlahRusak: newRusak,
                jumlah: newNormal, // total = normal + rusak(0)
                status: STATUS_COMPLETE,
              }
            : r
        )
      );
      return;
    }

    // Baris server — PUT
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/datalab/updateDataLab/LAB00002`, {
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
            jumlahNormal: newNormal,
            jumlahRusak: newRusak,
          },
        ]),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Gagal menyimpan tindak lanjut.");
      }

      // Sinkronkan UI
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                jumlahNormal: newNormal,
                jumlahRusak: newRusak,
                jumlah: newNormal,
                status: STATUS_COMPLETE,
              }
            : r
        )
      );
    } catch (e) {
      console.error(e);
      alert(e?.message || "Gagal menyimpan tindak lanjut.");
    }
  };

  // Kolom tabel — Kategori -> Jumlah Normal, tambah Jumlah Rusak
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
      {
        key: "_actions",
        header: "Aksi",
        render: (_v, row) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openEdit(row)}
              className="rounded-md bg-blue-600/90 px-3 py-1 text-xs text-white hover:bg-blue-500"
            >
              Edit
            </button>
            {/* <button
              onClick={() => onDeleteRow(row)}
              className="rounded-md bg-red-600/90 px-3 py-1 text-xs text-white hover:bg-red-500"
            >
              Hapus
            </button> */}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="container mx-auto px-4 py-8 lg:ml-56">
      {/* Pilih Praktikum → kirim data ke halaman berikutnya */}
      <label
        htmlFor="pilih-praktikum"
        className="mb-2 block text-sm font-medium text-slate-200"
      >
        Pilih praktikum untuk melakukan laporan
      </label>

      <select
        id="pilih-praktikum"
        defaultValue=""
        onChange={(e) => {
          const id = e.target.value;
          if (id) goToPraktikum(id);
        }}
        className="mb-6 block w-full appearance-none rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 pr-9 text-sm text-slate-100"
      >
        <option value="" disabled>
          Pilih praktikum
        </option>
        {PRAKTIKUMS.map((p) => (
          <option key={p.idPraktikum} value={p.idPraktikum}>
            {p.namaPraktikum}
          </option>
        ))}
      </select>

      {/* Header + Button Tambah/Refresh */}
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
          <button
            onClick={() => {
              setMode("add");
              setEditingId(null);
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-500 active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-blue-400/60"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Tambah Perangkat (lokal)
          </button>
        </div>
      </div>

      {/* Table utama */}
      <Table columns={columns} data={rows} />

      {/* Tabel bawah otomatis */}
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
                          onChange={() => {
                            const key = row.id || row.no;
                            const next = !checkedMap[key];
                            setCheckedMap((m) => ({ ...m, [key]: next }));

                            // Eksekusi hanya saat berubah menjadi checked
                            if (next) {
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

      {/* Modal Tambah / Edit Perangkat */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {mode === "add" ? "Tambah Perangkat (lokal)" : "Edit Perangkat"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-300 hover:bg-white/10"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={mode === "add" ? onSubmitAdd : onSubmitEdit}
              className="space-y-4"
            >
              {mode === "edit" && (
                <div>
                  <label className="mb-1 block text-sm text-slate-300">
                    ID Barang (server)
                  </label>
                  <input
                    name="idBarang"
                    value={form.idBarang}
                    readOnly
                    className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-slate-400"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  Nama
                </label>
                <input
                  name="nama"
                  value={form.nama}
                  onChange={onChangeForm}
                  className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="Contoh: Motherboard"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-slate-300">
                    Jumlah Normal
                  </label>
                  <input
                    name="jumlahNormal"
                    type="number"
                    min="0"
                    value={form.jumlahNormal}
                    onChange={onChangeForm}
                    className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-300">
                    Jumlah Rusak
                  </label>
                  <input
                    name="jumlahRusak"
                    type="number"
                    min="0"
                    value={form.jumlahRusak}
                    onChange={onChangeForm}
                    className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  Status (tampilan)
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={onChangeForm}
                  className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                >
                  <option value={STATUS_COMPLETE}>{STATUS_COMPLETE}</option>
                  <option value={STATUS_INCOMPLETE}>{STATUS_INCOMPLETE}</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  * Status final menyesuaikan otomatis dari jumlah rusak (rusak
                  &gt; 0 = Tidak Lengkap).
                </p>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowModal(false);
                    if (mode === "edit") {
                      setMode("add");
                      setEditingId(null);
                    }
                  }}
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
