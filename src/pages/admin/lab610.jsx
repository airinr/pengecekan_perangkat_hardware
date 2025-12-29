/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { Table } from "../../components/DefaultTable";

const STATUS_COMPLETE = "Lengkap";
const STATUS_INCOMPLETE = "Tidak Lengkap";

const API_BASE = import.meta.env.VITE_API_URL || "";
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

// Kode Lab 610 (tetap dikirim sebagai ?lab=…)
const LAB_ID = "LAB00002";

// Mapping PATH -> KODE PRAKTIKUM (pakai /lab610_*)
const PRAKTIKUM_CODES = {
  "/lab610_merakit_pc": "PRTK00001",
  "/lab610_bios_partisi": "PRTK00002",
  "/lab610_jarkom": "PRTK00003",
  "/lab610_troubleshooting": "PRTK00004",
};

// Bangun URL dengan urutan query PASTI: ?kode=…&lab=…
const toUrl = (path, kode, lab) =>
  `${path}?kode=${encodeURIComponent(kode || "")}&lab=${encodeURIComponent(
    lab || ""
  )}`;

export default function Lab610() {
  const navigate = useNavigate();

  // ======= State data utama =======
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ======= UX helpers =======
  const [q, setQ] = useState(""); // pencarian nama perangkat
  const [sortKey, setSortKey] = useState("no"); // default index asc
  const [sortDir, setSortDir] = useState("asc"); // asc | desc

  // ======= Barang (untuk Add & Deskripsi) =======
  const [barangOptions, setBarangOptions] = useState([]);
  const [barangLoading, setBarangLoading] = useState(false);
  const [barangErr, setBarangErr] = useState("");

  // ======= Modal Tambah/Edit =======
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("add"); // add | edit
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    idBarang: "",
    nama: "",
    jumlahNormal: "",
    jumlahRusak: "",
    status: STATUS_COMPLETE,
  });

  // ✅ ======= Modal Konfirmasi Reports (SAMA DENGAN LAB609) =======
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // ✅ UX: animasi & ESC close (SAMA)
  const confirmRef = useRef(null);
  useEffect(() => {
    if (!showConfirm) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowConfirm(false);
        setSelectedRow(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    setTimeout(() => confirmRef.current?.focus?.(), 0);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showConfirm]);

  const onChangeForm = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };
  const resetForm = () =>
    setForm({
      idBarang: "",
      nama: "",
      jumlahNormal: "",
      jumlahRusak: "",
      status: STATUS_COMPLETE,
    });

  // ======= Modal Deskripsi =======
  const [showDesc, setShowDesc] = useState(false);
  const [descContent, setDescContent] = useState({ nama: "", deskripsi: "" });

  // ======= Normalizer barang (tambahkan deskripsiBarang) =======
  const normalizeBarang = (b) => {
    const idBarang =
      b?.idBarang ?? b?.barangId ?? b?.id ?? b?._id ?? b?.kode ?? "";
    const namaBarang =
      b?.namaBarang ?? b?.nama ?? b?.name ?? b?.label ?? String(idBarang);
    const deskripsiBarang =
      b?.deskripsiBarang ??
      b?.deskripsi ??
      b?.description ??
      b?.keterangan ??
      "";
    return {
      idBarang: String(idBarang || "").trim(),
      namaBarang: String(namaBarang || "").trim(),
      deskripsiBarang: String(deskripsiBarang || "").trim(),
    };
  };

  // ======= Ambil daftar barang =======
  const fetchBarangOptions = useCallback(async () => {
    setBarangLoading(true);
    setBarangErr("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/barang`, {
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
          "Gagal memuat daftar barang";
        throw new Error(msg);
      }
      const payload = await res.json();
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.barang)
        ? payload.barang
        : [];
      const opts = list.map(normalizeBarang).filter((o) => o.idBarang);
      opts.sort((a, b) => a.namaBarang.localeCompare(b.namaBarang));
      setBarangOptions(opts);
    } catch (e) {
      console.error(e);
      setBarangErr(e?.message || "Gagal memuat daftar barang.");
      setBarangOptions([]);
    } finally {
      setBarangLoading(false);
    }
  }, []);

  // ======= Map cepat idBarang -> detail (untuk Deskripsi) =======
  const barangById = useMemo(() => {
    const m = {};
    for (const o of barangOptions) m[o.idBarang] = o;
    return m;
  }, [barangOptions]);

  // ======= Filter barang yang belum ditambahkan ke lab =======
  const selectableBarang = useMemo(() => {
    const existing = new Set(
      rows.map((r) => String(r.idBarang || "").trim()).filter(Boolean)
    );
    return barangOptions.filter(
      (b) => !existing.has(String(b.idBarang || "").trim())
    );
  }, [barangOptions, rows]);

  useEffect(() => {
    if (mode !== "add" || !form.idBarang) return;
    const stillExists = selectableBarang.some(
      (b) => b.idBarang === form.idBarang
    );
    if (!stillExists) setForm((f) => ({ ...f, idBarang: "" }));
  }, [mode, selectableBarang, form.idBarang]);

  // ======= Fetch data perangkat lab =======
  const abortRef = useRef(null);
  const fetchLabData = useCallback(async () => {
    setLoading(true);
    setError("");

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/datalab/getdatalab/${LAB_ID}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...NGROK_HEADERS,
        },
        signal: controller.signal,
      });
      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({})))?.message ||
          "Gagal memuat data lab";
        throw new Error(msg);
      }

      const payload = await res.json();
      const list = Array.isArray(payload?.data) ? payload.data : [];

      const mapped = list.map((item, idx) => {
        const idBarang = item?.idBarang ?? null;
        const nama =
          item?.barangModel?.namaBarang ?? item?.namaBarang ?? idBarang ?? "-";
        const jumlahNormal = Number(item?.jumlahNormal ?? 0);
        const jumlahRusak = Number(item?.jumlahRusak ?? 0);

        // ✅ Total = Normal - Rusak
        const jumlah =
          (Number.isFinite(jumlahNormal) ? jumlahNormal : 0) -
          (Number.isFinite(jumlahRusak) ? jumlahRusak : 0);

        const status = jumlahRusak > 0 ? STATUS_INCOMPLETE : STATUS_COMPLETE;
        return {
          id: `srv-${idx}`,
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
      if (err?.name !== "AbortError") {
        console.error(err);
        setError(err?.message || "Gagal memuat data.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabData();
    return () => abortRef.current && abortRef.current.abort();
  }, [fetchLabData]);

  // ======= Derived data (filter + sort + re-index) =======
  const filteredSortedRows = useMemo(() => {
    let out = rows;
    if (q.trim()) {
      const key = q.toLowerCase();
      out = out.filter((r) => (r?.nama || "").toLowerCase().includes(key));
    }
    const mul = sortDir === "asc" ? 1 : -1;
    out = [...out].sort((a, b) => {
      const va = a?.[sortKey];
      const vb = b?.[sortKey];
      if (typeof va === "number" && typeof vb === "number")
        return (va - vb) * mul;
      return String(va ?? "").localeCompare(String(vb ?? "")) * mul;
    });
    return out.map((r, i) => ({ ...r, no: i + 1 }));
  }, [rows, q, sortKey, sortDir]);

  const incompleteRows = useMemo(
    () => filteredSortedRows.filter((r) => r.status === STATUS_INCOMPLETE),
    [filteredSortedRows]
  );

  const totals = useMemo(() => {
    const base = filteredSortedRows.reduce(
      (acc, r) => {
        acc.normal += Number(r.jumlahNormal || 0);
        acc.rusak += Number(r.jumlahRusak || 0);
        return acc;
      },
      { normal: 0, rusak: 0 }
    );
    return {
      normal: base.normal,
      rusak: base.rusak,
      total: filteredSortedRows.length,
    };
  }, [filteredSortedRows]);

  // ======= Actions =======
  const openEdit = (row) => {
    setMode("edit");
    setEditingId(row.id);
    setForm({
      idBarang: row.idBarang || "",
      nama: row.nama ?? "",
      jumlahNormal:
        row.jumlahNormal !== undefined ? String(row.jumlahNormal) : "",
      jumlahRusak: row.jumlahRusak !== undefined ? String(row.jumlahRusak) : "",
      status: row.status ?? STATUS_COMPLETE,
    });
    setShowModal(true);
  };

  const openDesc = useCallback(
    async (row) => {
      if (!barangOptions.length && !barangLoading) {
        await fetchBarangOptions();
      }
      const info = barangById[String(row?.idBarang || "")] || {};

      const nama =
        row?.nama ||
        info?.namaBarang ||
        String(row?.idBarang || "Tidak diketahui");
      const deskripsi = info?.deskripsiBarang || "—";

      setDescContent({ nama, deskripsi });
      setShowDesc(true);
    },
    [barangOptions.length, barangLoading, fetchBarangOptions, barangById]
  );

  const onSubmitAdd = async (e) => {
    e.preventDefault();
    const idBarang = String(form.idBarang || "").trim();
    if (!idBarang) return alert("Silakan pilih Barang terlebih dahulu.");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/datalab/addDataLab`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...NGROK_HEADERS,
        },
        body: JSON.stringify({ idBarang, idLab: LAB_ID }),
      });
      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({})))?.message ||
          "Gagal menambah barang ke lab";
        throw new Error(msg);
      }
      await fetchLabData();
      setShowModal(false);
      resetForm();
      setMode("add");
    } catch (err) {
      console.error(err);
      alert(err?.message || "Gagal menambah data (POST).");
    }
  };

  const onSubmitEdit = async (e) => {
    e.preventDefault();
    if (!form.idBarang)
      return alert("idBarang kosong. Data tidak valid untuk update.");

    const jn = Number(form.jumlahNormal);
    const jr = Number(form.jumlahRusak);
    if (!Number.isFinite(jn) || jn < 0)
      return alert("Jumlah Normal tidak valid.");
    if (!Number.isFinite(jr) || jr < 0)
      return alert("Jumlah Rusak tidak valid.");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/datalab/updateDataLab/${LAB_ID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...NGROK_HEADERS,
        },
        body: JSON.stringify([
          { idBarang: form.idBarang, jumlahNormal: jn, jumlahRusak: jr },
        ]),
      });
      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({})))?.message ||
          "Gagal mengubah data lab";
        throw new Error(msg);
      }

      // ✅ Total = Normal - Rusak
      const total = jn - jr;

      const status = jr > 0 ? STATUS_INCOMPLETE : STATUS_COMPLETE;
      setRows((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? { ...r, jumlahNormal: jn, jumlahRusak: jr, jumlah: total, status }
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

  const markResolved = async (row) => {
    // ✅ kalau "resolved", Rusak jadi 0, Normal tetap seperti normal,
    // dan Total = Normal - Rusak
    const jn = Number(row.jumlahNormal ?? 0);
    const newNormal = Number.isFinite(jn) ? jn : 0;
    const newRusak = 0;

    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? {
              ...r,
              jumlahNormal: newNormal,
              jumlahRusak: newRusak,
              jumlah: newNormal - newRusak, // ✅
              status: STATUS_COMPLETE,
            }
          : r
      )
    );

    try {
      if (!row.idBarang) return;
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/datalab/updateDataLab/${LAB_ID}`, {
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
    } catch (e) {
      console.error(e);
      alert(e?.message || "Gagal menyimpan tindak lanjut.");
    }
  };

  // ======= Kolom tabel =======
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
              onClick={() => openDesc(row)}
              className="rounded-md bg-violet-600/90 px-3 py-1 text-xs text-white hover:bg-violet-500"
              title="Lihat deskripsi barang"
            >
              Deskripsi
            </button>

            <button
              onClick={() => openEdit(row)}
              className="rounded-md bg-blue-600/90 px-3 py-1 text-xs text-white hover:bg-blue-500"
            >
              Edit
            </button>
          </div>
        ),
      },
    ],
    [openDesc]
  );

  // ======= Export CSV (mengikuti filter + sort + reindex) =======
  const exportCSV = () => {
    const header = [
      "No",
      "Nama",
      "Jumlah Normal",
      "Jumlah Rusak",
      "Total",
      "Status",
    ];
    const lines = [header.join(",")];
    filteredSortedRows.forEach((r) => {
      lines.push(
        [r.no, r.nama, r.jumlahNormal, r.jumlahRusak, r.jumlah, r.status].join(
          ","
        )
      );
    });
    const blob = new Blob(["\uFEFF" + lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lab610_perangkat.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8 lg:ml-56 mt-16 sm:mt-6">
      {/* ===== Pilih kategori untuk laporan ===== */}
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
          const path = e.target.value; // /lab610_*
          if (!path) return;
          const kode = PRAKTIKUM_CODES[path] || "";
          const next = toUrl(path, kode, LAB_ID); // ?kode=...&lab=...
          navigate(next);
        }}
        className="mb-6 block w-full appearance-none rounded-lg border border-white/15 bg-slate-900/60 px-3 lg:px-8 py-2 pr-10 text-sm md:text-base text-slate-100"
      >
        <option value="" disabled>
          Pilih kategori
        </option>
        <option value="/lab610_merakit_pc">Merakit Komputer</option>
        <option value="/lab610_bios_partisi">Bios dan Partisi</option>
        <option value="/lab610_jarkom">Jaringan Komputer</option>
        <option value="/lab610_troubleshooting">Troubleshooting</option>
      </select>

      {/* ===== Header + Actions ===== */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Perangkat Laboratorium 610</h1>
          <p className="text-sm text-slate-400">
            Pantau stok dan kondisi perangkat per laboratorium.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={async () => {
              setMode("add");
              setEditingId(null);
              resetForm();
              if (!barangOptions.length && !barangLoading)
                await fetchBarangOptions();
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-blue-500 active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-blue-400/60"
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
            Tambah Perangkat
          </button>
          <button
            onClick={fetchLabData}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-slate-600 active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-slate-400/60"
            aria-busy={loading}
          >
            {loading ? "Memuat…" : "Refresh"}
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-emerald-600 active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* ===== Alerts ===== */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          <div className="font-semibold">Gagal memuat</div>
          <div className="opacity-90">{error}</div>
        </div>
      )}

      {/* ===== Quick Stats (mengikuti filter) ===== */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="text-xs text-slate-400">Total Perangkat</div>
          <div className="text-2xl font-semibold">{totals.total}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="text-xs text-slate-400">Normal</div>
          <div className="text-2xl font-semibold text-green-300">
            {totals.normal}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="text-xs text-slate-400">Rusak/Hilang</div>
          <div className="text-2xl font-semibold text-yellow-300">
            {totals.rusak}
          </div>
        </div>
      </div>

      {/* ===== Controls ===== */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama perangkat…"
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600 sm:w-80"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Sort by:</label>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200"
          >
            <option value="no">No</option>
            <option value="nama">Nama</option>
            <option value="jumlahNormal">Jumlah Normal</option>
            <option value="jumlahRusak">Jumlah Rusak</option>
            <option value="jumlah">Total</option>
            <option value="status">Status</option>
          </select>
          <button
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200"
            title="Urutan"
            aria-label="Urutan"
          >
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {/* ===== Tabel utama ===== */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 rounded-2xl bg-slate-900/60 backdrop-blur-sm" />
        )}
        <Table columns={columns} data={filteredSortedRows} />
      </div>

      {/* ===== Reports (otomatis muncul kalau ada yang rusak) ===== */}
      {incompleteRows.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-1 text-2xl font-bold">Reports</h2>
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
                          checked={false}
                          onChange={(e) => {
                            if (!e.target.checked) return;

                            // ✅ buka modal konfirmasi (SAMA)
                            setSelectedRow(row);
                            setShowConfirm(true);

                            // reset checkbox (karena checkbox ini tidak pakai state)
                            e.target.checked = false;
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

      {/* ✅ ===== Modal Konfirmasi Perbaikan (SAMA PESAN & UI) ===== */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity"
            onClick={() => {
              setShowConfirm(false);
              setSelectedRow(null);
            }}
          />

          {/* Card */}
          <div
            ref={confirmRef}
            tabIndex={-1}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl outline-none
                       animate-[pop_.16s_ease-out]"
            style={{ transformOrigin: "center" }}
          >
            <style>{`
              @keyframes pop {
                0% { opacity: 0; transform: translateY(8px) scale(.98); }
                100% { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>

            {/* Header gradient */}
            <div className="bg-gradient-to-r from-blue-600/30 via-indigo-600/20 to-violet-600/30 px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-blue-500/20 text-blue-300 grid place-items-center ring-1 ring-white/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>

                  <div>
                    <h3
                      id="confirm-title"
                      className="text-lg font-semibold text-white"
                    >
                      Konfirmasi Perbaikan
                    </h3>
                    <p className="text-xs text-slate-300">
                      Pastikan data yang Anda input sudah benar.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowConfirm(false);
                    setSelectedRow(null);
                  }}
                  className="rounded-xl p-2 text-slate-200/80 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  aria-label="Tutup"
                  title="Tutup (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed text-slate-200">
                Apakah Anda yakin{" "}
                <span className="font-semibold text-white">
                  semua perangkat sudah diperbaiki / ditindaklanjuti
                </span>
                ?
              </p>

              {/* Info perangkat */}
              {selectedRow && (
                <div className="mt-4 rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
                  <div className="text-[11px] text-slate-400">Perangkat</div>
                  <div className="mt-1 text-sm font-semibold text-slate-100">
                    {selectedRow.nama}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Rusak/Hilang:{" "}
                    <span className="font-semibold text-yellow-300">
                      {selectedRow.jumlahRusak}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-3 text-[11px] text-slate-400">
                Tips: Klik luar popup atau tekan{" "}
                <span className="font-semibold">Esc</span> untuk membatalkan.
              </div>

              {/* Footer buttons */}
              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirm(false);
                    setSelectedRow(null);
                  }}
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/15"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedRow) markResolved(selectedRow);
                    setShowConfirm(false);
                    setSelectedRow(null);
                  }}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                >
                  Ya, Sudah
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal Tambah / Edit ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {mode === "add" ? "Tambah Perangkat" : "Edit Perangkat"}
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
              {mode === "add" && (
                <>
                  {barangErr && (
                    <div className="mb-2 rounded-md border border-amber-400/40 bg-amber-400/10 p-2 text-xs text-amber-200">
                      {barangErr}
                    </div>
                  )}
                  <label className="mb-1 block text-sm text-slate-300">
                    Pilih Barang
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="idBarang"
                      value={form.idBarang}
                      onChange={onChangeForm}
                      disabled={barangLoading || selectableBarang.length === 0}
                      className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-slate-100 disabled:opacity-60"
                      required
                    >
                      <option value="">
                        {barangLoading
                          ? "Memuat daftar barang…"
                          : selectableBarang.length === 0
                          ? "Semua barang sudah terdaftar"
                          : "— pilih barang —"}
                      </option>
                      {selectableBarang.map((opt) => (
                        <option key={opt.idBarang} value={opt.idBarang}>
                          {opt.namaBarang}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={fetchBarangOptions}
                      className="shrink-0 rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-600"
                      title="Refresh daftar barang"
                    >
                      Refresh
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    * Hanya barang yang belum terdaftar di lab ditampilkan.
                  </p>
                </>
              )}

              {mode === "edit" && (
                <>
                  <div>
                    <label className="mb-1 block text-sm text-slate-300">
                      Nama (informasi)
                    </label>
                    <input
                      name="nama"
                      value={form.nama}
                      readOnly
                      className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-slate-400"
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
                </>
              )}

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

      {/* ===== Modal Deskripsi Barang ===== */}
      {showDesc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowDesc(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Deskripsi Barang
              </h3>
              <button
                onClick={() => setShowDesc(false)}
                className="rounded-lg p-1 text-slate-300 hover:bg-white/10"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <div className="text-xs text-slate-400">Nama</div>
                <div className="text-slate-100 font-medium">
                  {descContent.nama || "—"}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400 mb-1">Deskripsi</div>
                <div className="whitespace-pre-wrap rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                  {descContent.deskripsi || "—"}
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Sumber: <code>/barang</code> (field{" "}
                  <code>deskripsiBarang</code> / <code>deskripsi</code>).
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDesc(false)}
                className="rounded-xl bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
