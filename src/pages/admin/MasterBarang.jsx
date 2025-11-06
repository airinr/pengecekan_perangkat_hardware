/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

export default function MasterBarang() {
  // ===== State utama =====
  // rows: [{idBarang, namaBarang, deskripsiBarang}]
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===== UX: pencarian, sort, pagination =====
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState("namaBarang"); // namaBarang | no
  const [sortDir, setSortDir] = useState("asc"); // asc | desc
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ===== Add modal =====
  const [showAdd, setShowAdd] = useState(false);
  const [namaBarang, setNamaBarang] = useState("");
  const [deskripsiBarang, setDeskripsiBarang] = useState("");
  const [adding, setAdding] = useState(false);
  const [addErr, setAddErr] = useState("");

  // ===== Delete state =====
  const [deletingId, setDeletingId] = useState(null);

  // ===== Toast sukses =====
  const [successMsg, setSuccessMsg] = useState("");
  const successTimerRef = useRef(null);
  const showSuccess = (msg = "Berhasil") => {
    setSuccessMsg(msg);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessMsg(""), 2200);
  };
  useEffect(
    () => () =>
      successTimerRef.current && clearTimeout(successTimerRef.current),
    []
  );

  // ===== Normalizer payload API =====
  const normalizeBarang = (b) => {
    const idBarang =
      b?.idBarang ?? b?.barangId ?? b?.id ?? b?._id ?? b?.kode ?? "";
    const namaBarang =
      b?.namaBarang ?? b?.nama ?? b?.name ?? b?.label ?? String(idBarang);
    // PENTING: backend pakai deskripsiBarang
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

  // ===== Fetch list barang (Abort-safe) =====
  const abortRef = useRef(null);
  const fetchBarangList = useCallback(async () => {
    setLoading(true);
    setError("");

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/barang`, {
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
          "Gagal memuat daftar barang.";
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
      const mapped = list.map(normalizeBarang).filter((x) => x.idBarang);
      // urut nama asc default
      mapped.sort((a, b) => a.namaBarang.localeCompare(b.namaBarang));
      setRows(mapped);
      setPage(1); // reset ke halaman pertama saat refresh
    } catch (e) {
      if (e?.name !== "AbortError") {
        console.error(e);
        setError(e?.message || "Gagal memuat daftar barang.");
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBarangList();
    return () => abortRef.current && abortRef.current.abort();
  }, [fetchBarangList]);

  // ===== Derived: filter + sort + reindex + paginate =====
  const filteredSorted = useMemo(() => {
    let out = rows;
    if (q.trim()) {
      const key = q.toLowerCase();
      out = out.filter(
        (r) =>
          r.namaBarang.toLowerCase().includes(key) ||
          (r.deskripsiBarang || "").toLowerCase().includes(key)
      );
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

  const totalItems = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageRows = filteredSorted.slice(pageStart, pageStart + pageSize);

  // ===== Actions =====
  const onSort = (key) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const deleteBarang = async (row) => {
    if (!row?.idBarang || deletingId) return;
    const ok = window.confirm(`Hapus barang "${row.namaBarang}"?`);
    if (!ok) return;
    try {
      setDeletingId(row.idBarang);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/barang/deleteBarang/${encodeURIComponent(row.idBarang)}`,
        {
          method: "DELETE",
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
          "Gagal menghapus barang.";
        throw new Error(msg);
      }
      // Optimistic: hapus di client tanpa refetch
      setRows((prev) => prev.filter((r) => r.idBarang !== row.idBarang));
      showSuccess("Berhasil menghapus");
    } catch (e) {
      console.error(e);
      alert(e?.message || "Gagal menghapus barang.");
    } finally {
      setDeletingId(null);
    }
  };

  const onSubmitAdd = async (e) => {
    e.preventDefault();
    const nama = namaBarang.trim();
    const deskrip = deskripsiBarang.trim();

    if (!nama) {
      setAddErr("Nama barang wajib diisi.");
      return;
    }
    if (rows.some((r) => r.namaBarang.toLowerCase() === nama.toLowerCase())) {
      setAddErr("Nama barang sudah ada.");
      return;
    }

    setAddErr("");
    setAdding(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/barang/addBarang`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...NGROK_HEADERS,
        },
        // KIRIM DUA FIELD: deskripsiBarang & deskripsi
        body: JSON.stringify({
          namaBarang: nama,
          deskripsiBarang: deskrip,
          deskripsi: deskrip,
        }),
      });

      // (opsional) bantu debug:
      // const debugPayload = await res.clone().json().catch(() => null);
      // console.log("RESP:", debugPayload);

      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({})))?.message ||
          "Gagal menambahkan barang.";
        throw new Error(msg);
      }

      setShowAdd(false);
      setNamaBarang("");
      setDeskripsiBarang("");
      await fetchBarangList();
      showSuccess("Berhasil menambah");
    } catch (e) {
      console.error(e);
      setAddErr(e?.message || "Gagal menambahkan barang.");
    } finally {
      setAdding(false);
    }
  };

  // ===== Export CSV (mengikuti filter + sort) =====
  const exportCSV = () => {
    const header = ["No", "ID Barang", "Nama Barang", "Deskripsi"];
    const lines = [header.join(",")];
    filteredSorted.forEach((r) =>
      lines.push(
        [
          r.no,
          r.idBarang,
          `"${String(r.namaBarang).replace(/"/g, '""')}"`,
          `"${String(r.deskripsiBarang || "").replace(/"/g, '""')}"`,
        ].join(",")
      )
    );
    const blob = new Blob(["\uFEFF" + lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `master_barang.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_10%,rgba(59,130,246,0.10),transparent)]" />
      </div>

      <div className="container mx-auto px-4 py-8 lg:ml-56">
        {/* Toast */}
        {Boolean(successMsg) && (
          <div className="fixed right-4 top-4 z-[9999] rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-200 shadow-lg backdrop-blur">
            {successMsg}
          </div>
        )}

        {/* Header */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Master Barang</h1>
            <p className="text-slate-300">
              Kelola daftar barang (tambah / hapus).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setNamaBarang("");
                setDeskripsiBarang("");
                setAddErr("");
                setShowAdd(true);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              + Tambah Data Barang
            </button>
            <button
              onClick={fetchBarangList}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600"
            >
              Refresh
            </button>
            <button
              onClick={exportCSV}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            <div className="font-semibold">Gagal memuat</div>
            <div className="opacity-90">{error}</div>
          </div>
        )}

        {/* Controls */}
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama/deskripsi barang…"
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600 sm:w-80"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400">Tampil:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}/hal
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-800/80">
              <tr className="text-left">
                {[
                  { key: "no", label: "#", width: "w-16" },
                  { key: "namaBarang", label: "Nama Barang" },
                  { key: "deskripsiBarang", label: "Deskripsi" },
                  { key: "_aksi", label: "Aksi", width: "w-40 text-right" },
                ].map((c) => (
                  <th
                    key={c.key}
                    className={`px-4 py-3 text-slate-200 ${c.width || ""}`}
                    {...(c.key !== "_aksi" && c.key !== "deskripsiBarang"
                      ? {
                          role: "button",
                          onClick: () =>
                            onSort(c.key === "no" ? "no" : "namaBarang"),
                          title: "Klik untuk sort",
                          "aria-sort":
                            sortKey === (c.key === "no" ? "no" : "namaBarang")
                              ? sortDir === "asc"
                                ? "ascending"
                                : "descending"
                              : "none",
                        }
                      : {})}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.label}
                      {c.key !== "_aksi" &&
                        c.key !== "deskripsiBarang" &&
                        sortKey === (c.key === "no" ? "no" : "namaBarang") && (
                          <span>{sortDir === "asc" ? "↑" : "↓"}</span>
                        )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6">
                    <div className="h-8 w-40 animate-pulse rounded bg-slate-700/40" />
                  </td>
                </tr>
              )}

              {!loading &&
                pageRows.map((row) => (
                  <tr
                    key={row.idBarang}
                    className="border-t border-slate-800/60"
                  >
                    <td className="px-4 py-2 text-slate-100">{row.no}</td>
                    <td className="px-4 py-2 text-slate-100">
                      {row.namaBarang}
                    </td>
                    <td className="px-4 py-2 text-slate-300">
                      <span className="line-clamp-2">
                        {row.deskripsiBarang || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end">
                        <button
                          onClick={() => deleteBarang(row)}
                          disabled={deletingId === row.idBarang}
                          className="rounded-md bg-rose-600/90 px-3 py-1 text-xs text-white hover:bg-rose-500 disabled:opacity-60"
                          title="Hapus barang"
                        >
                          {deletingId === row.idBarang ? "Menghapus…" : "Hapus"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && pageRows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-slate-300"
                  >
                    Belum ada data barang.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: info & pagination */}
        <div className="mt-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="text-xs text-slate-400">
            Menampilkan{" "}
            <span className="text-slate-200">{pageRows.length}</span> dari{" "}
            <span className="text-slate-200">{totalItems}</span> data
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-xs text-slate-300">
              Hal {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

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
                  Nama Barang <span className="text-rose-400">*</span>
                </label>
                <input
                  value={namaBarang}
                  onChange={(e) => setNamaBarang(e.target.value)}
                  placeholder="Contoh: Tinta Printer"
                  className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  Deskripsi
                </label>
                <textarea
                  value={deskripsiBarang}
                  onChange={(e) => setDeskripsiBarang(e.target.value)}
                  placeholder="Contoh: Ini tinta dari cumi"
                  rows={3}
                  className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
              </div>

              {addErr && <div className="text-xs text-red-300">{addErr}</div>}

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
              Menambahkan barang ke <strong>master daftar barang</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
