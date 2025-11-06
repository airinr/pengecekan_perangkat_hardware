/* eslint-disable no-unused-vars */
/* eslint-disable no-useless-escape */
/* eslint-disable no-undef */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Table } from "../../components/DefaultTable";

export default function DaftarKelas() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // === CONFIG API ===
  const API_BASE = import.meta.env.VITE_API_URL || "";
  const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

  const KELAS_API = {
    LIST: `${API_BASE}/kelas`,
    CREATE: `${API_BASE}/kelas/addKelas`,
    UPDATE: (id) => `${API_BASE}/kelas/${encodeURIComponent(id)}`,
    DELETE: (id) => `${API_BASE}/kelas/deleteKelas/${encodeURIComponent(id)}`,
    DETAIL: (id) => `${API_BASE}/kelas/${encodeURIComponent(id)}`,
  };

  // === STATE ===
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // search + debounce
  const [qRaw, setQRaw] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(qRaw.trim().toLowerCase()), 220);
    return () => clearTimeout(t);
  }, [qRaw]);

  // === MODAL ===
  const [open, setOpen] = useState(/\/tambah\/?$/.test(pathname));
  const [form, setForm] = useState({ namaKelas: "" });
  const [editingId, setEditingId] = useState(null);
  const isEditing = editingId !== null;

  const [openDetail, setOpenDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailData, setDetailData] = useState(null);

  const modalRef = useRef(null);
  const detailModalRef = useRef(null);
  const reqRef = useRef(0);

  // === Normalizer ===
  const normalizeKelas = (it) => {
    const id =
      it?.idKelas ?? it?.kelasId ?? it?.id ?? it?._id ?? it?.kode ?? "";
    const nama =
      it?.namaKelas ?? it?.nama ?? it?.name ?? it?.kelas ?? it?.label ?? "";
    return { id: String(id).trim(), nama: String(nama).trim() };
  };

  // === FETCH LIST ===
  const fetchKelas = useCallback(async () => {
    const myId = ++reqRef.current;
    setLoading(true);
    if (myId === reqRef.current) {
      setError("");
      setSuccess("");
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(KELAS_API.LIST, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...NGROK_HEADERS,
          Accept: "application/json",
        },
      });
      if (!res.ok) throw new Error("Gagal memuat data kelas");

      const payload = await res.json();
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.kelas)
        ? payload.kelas
        : [];

      const norm = list.map(normalizeKelas).filter((r) => r.nama || r.id);
      norm.sort((a, b) => String(a.nama).localeCompare(String(b.nama)));

      if (myId !== reqRef.current) return;
      setRows(norm);
    } catch (e) {
      if (myId !== reqRef.current) return;
      console.error(e);
      setError(e?.message || "Gagal memuat data.");
    } finally {
      if (myId === reqRef.current) setLoading(false);
    }
  }, [KELAS_API.LIST]);

  useEffect(() => {
    fetchKelas();
  }, [fetchKelas]);

  // buka modal tambah saat URL /tambah
  useEffect(() => {
    if (/\/tambah\/?$/.test(pathname)) {
      setEditingId(null);
      setForm({ namaKelas: "" });
      setOpen(true);
    }
  }, [pathname]);

  // === Modal helpers ===
  const openAddModal = () => {
    setEditingId(null);
    setForm({ namaKelas: "" });
    setOpen(true);
  };
  const openEditModal = (row) => {
    setEditingId(row.id);
    setForm({ namaKelas: row.nama || "" });
    setOpen(true);
  };
  const closeModal = useCallback(() => {
    setOpen(false);
    setForm({ namaKelas: "" });
    setEditingId(null);
    if (/\/tambah\/?$/.test(pathname)) navigate("/kelas", { replace: true });
  }, [navigate, pathname]);

  // klik luar & esc (modal add/edit)
  useEffect(() => {
    function onDown(e) {
      if (open && modalRef.current && !modalRef.current.contains(e.target))
        closeModal();
    }
    function onKey(e) {
      if (open && e.key === "Escape") closeModal();
    }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, closeModal]);

  // === Detail helpers ===
  const openDetailModal = async (row) => {
    setOpenDetail(true);
    setDetailError("");
    setDetailData({ id: row.id, namaKelas: row.nama });
    try {
      setDetailLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(KELAS_API.DETAIL(row.id), {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...NGROK_HEADERS,
          Accept: "application/json",
        },
      });
      if (!res.ok) throw new Error("Gagal memuat detail kelas.");
      const p = await res.json();
      const nama = p?.namaKelas ?? p?.nama ?? p?.name ?? row.nama ?? "";
      setDetailData({ id: row.id, namaKelas: String(nama).trim() });
    } catch (e) {
      console.error(e);
      setDetailError(e?.message || "Gagal memuat detail kelas.");
    } finally {
      setDetailLoading(false);
    }
  };
  const closeDetailModal = () => {
    setOpenDetail(false);
    setDetailLoading(false);
    setDetailError("");
    setDetailData(null);
  };
  // klik luar & esc (modal detail)
  useEffect(() => {
    function onDown(e) {
      if (
        openDetail &&
        detailModalRef.current &&
        !detailModalRef.current.contains(e.target)
      )
        closeDetailModal();
    }
    function onKey(e) {
      if (openDetail && e.key === "Escape") closeDetailModal();
    }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [openDetail]);

  // === TABLE ===
  const columns = useMemo(
    () => [
      { key: "no", header: "#" },
      { key: "nama", header: "Nama Kelas" },
      {
        key: "aksi",
        header: "Aksi",
        render: (_, row) => (
          <button
            type="button"
            onClick={() => handleDelete(row)}
            disabled={deletingId === row.id}
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {deletingId === row.id ? "Menghapus..." : "Hapus"}
          </button>
        ),
      },
    ],
    [deletingId]
  );

  // === FILTERED DATA ===
  const filtered = useMemo(() => {
    const base = rows.filter((r) => {
      if (!q) return true;
      return (r.nama || "").toLowerCase().includes(q);
    });
    return base.map((r, i) => ({ no: i + 1, ...r }));
  }, [rows, q]);

  // === FORM SUBMIT ===
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const nama = String(form.namaKelas || "").trim();
    if (!nama) {
      setError("Nama Kelas wajib diisi.");
      setSuccess("");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        isEditing ? KELAS_API.UPDATE(editingId) : KELAS_API.CREATE,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...NGROK_HEADERS,
          },
          body: JSON.stringify({ namaKelas: nama }),
        }
      );
      if (!res.ok)
        throw new Error(
          isEditing ? "Gagal memperbarui kelas." : "Gagal menambahkan kelas."
        );
      setSuccess(
        isEditing
          ? "Data kelas berhasil diperbarui."
          : "Data kelas berhasil ditambahkan."
      );
      closeModal();
      fetchKelas();
    } catch (e2) {
      console.error(e2);
      setError(e2?.message || "Gagal menyimpan data.");
    } finally {
      setSubmitting(false);
    }
  };

  // === DELETE ===
  const handleDelete = async (row) => {
    if (!row?.id) return;
    const ok = window.confirm(`Hapus kelas "${row.nama}"?`);
    if (!ok) return;

    setDeletingId(row.id);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(KELAS_API.DELETE(row.id), {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...NGROK_HEADERS,
        },
      });
      if (!res.ok) throw new Error("Gagal menghapus kelas.");
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setSuccess(`Kelas "${row.nama}" berhasil dihapus.`);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Gagal menghapus kelas.");
    } finally {
      setDeletingId(null);
    }
  };

  // ========================== UI ==========================
  return (
    <div className="lg:ml-56 lg:w-[calc(100vw-14rem)] w-full">
      {/* Header */}
      <div className="pl-4 pr-2 lg:pr-0 pt-6 pb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Kelas</h1>
          <p className="text-slate-400 text-sm">Kelola daftar kelas.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openAddModal}
            className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            + Tambah Kelas
          </button>
          <button
            type="button"
            onClick={fetchKelas}
            disabled={loading}
            className="rounded-xl bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-600 disabled:opacity-60"
          >
            {loading ? "Muat..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="pl-4 pr-2 lg:pr-0">
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-xs text-slate-400">Total Kelas</div>
            <div className="text-2xl font-semibold text-white">
              {rows.length}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="pl-4 pr-2 lg:pr-0 space-y-2">
        {!!success && (
          <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-200">
            {success}
          </div>
        )}
        {!!error && (
          <div className="rounded-lg border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        )}
      </div>

      {/* Toolbar + Table Card */}
      <div className="pl-4 pr-2 lg:pr-0 pb-4">
        <div className="rounded-none lg:rounded-l-2xl border border-white/10 bg-slate-900/60 backdrop-blur">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-white/10">
            <div className="relative w-full md:max-w-sm">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                🔎
              </span>
              <input
                type="text"
                value={qRaw}
                onChange={(e) => setQRaw(e.target.value)}
                placeholder="Cari Nama Kelas…"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
                aria-label="Kolom pencarian"
              />
            </div>
            <div className="ml-auto text-xs text-slate-400">
              {filtered.length} data ditampilkan
            </div>
          </div>

          {/* Table / Empty */}
          <div className="p-2">
            {filtered.length > 0 ? (
              <div className="overflow-x-auto rounded-none lg:rounded-l-xl">
                <Table columns={columns} data={filtered} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="text-3xl mb-2">📄</div>
                <p className="text-slate-300">Belum ada data kelas.</p>
                <p className="text-slate-500 text-sm">
                  Tambahkan kelas baru atau muat ulang data.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={openAddModal}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    + Tambah Kelas
                  </button>
                  <button
                    onClick={fetchKelas}
                    disabled={loading}
                    className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-60"
                  >
                    {loading ? "Memuat…" : "Refresh"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === Modal Tambah/Edit Kelas === */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            ref={modalRef}
            className="relative z-[101] w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-5 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 id="modal-title" className="text-lg font-semibold text-white">
                {isEditing ? "Edit Kelas" : "Tambah Kelas"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md p-1 text-slate-300 hover:bg-slate-800 hover:text-white"
                aria-label="Tutup"
                title="Tutup"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-3 rounded-lg border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm text-slate-300">
                  Nama Kelas
                </span>
                <input
                  type="text"
                  name="namaKelas"
                  value={form.namaKelas}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, namaKelas: e.target.value }))
                  }
                  placeholder="Mis. IF-5 2025"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
                  required
                />
              </label>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting
                    ? "Menyimpan..."
                    : isEditing
                    ? "Simpan Perubahan"
                    : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === Modal Detail Kelas === */}
      {openDetail && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-detail-title"
          className="fixed inset-0 z-[110] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            ref={detailModalRef}
            className="relative z-[111] w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-5 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2
                id="modal-detail-title"
                className="text-lg font-semibold text-white"
              >
                Detail Kelas
              </h2>
              <button
                type="button"
                onClick={closeDetailModal}
                className="rounded-md p-1 text-slate-300 hover:bg-slate-800 hover:text-white"
                aria-label="Tutup"
                title="Tutup"
              >
                ✕
              </button>
            </div>

            {detailError && (
              <div className="mb-3 rounded-lg border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
                {detailError}
              </div>
            )}

            <div className="space-y-3">
              {detailLoading ? (
                <div className="text-slate-300 text-sm">Memuat…</div>
              ) : (
                <>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <div className="text-xs text-slate-400">Nama Kelas</div>
                      <div className="text-slate-100 font-medium">
                        {detailData?.namaKelas ?? "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">ID/Kode</div>
                      <div className="text-slate-100 font-medium">
                        {detailData?.id ?? "—"}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={closeDetailModal}
                className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600"
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
