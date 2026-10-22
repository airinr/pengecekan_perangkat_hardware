import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Table } from "@/components/ui/DataTable";
import { apiGet, apiPut } from "@/lib/apiClient";
import {
  LABS,
  STATUS_COMPLETE,
  STATUS_INCOMPLETE,
  labCodeFromShort,
  perangkatPath,
} from "@/features/praktikum/constants";
import { downloadCsv } from "@/features/praktikum/helpers";

export default function PerangkatLab() {
  const { labId } = useParams();
  const navigate = useNavigate();

  const lab = LABS[String(labId)];
  if (!lab) return <Navigate to="/dashboard_asisten" replace />;
  const LAB_CODE = labCodeFromShort(labId);
  const labName = lab.name;

  return (
    <PerangkatLabView
      key={LAB_CODE}
      LAB_CODE={LAB_CODE}
      labId={labId}
      labName={labName}
      onChangeLab={(next) => navigate(perangkatPath(next))}
    />
  );
}

function PerangkatLabView({ LAB_CODE, labId, labName, onChangeLab }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState("no");
  const [sortDir, setSortDir] = useState("asc");

  const fetchAbortRef = useRef(null);
  const fetchLabData = useCallback(async () => {
    setLoading(true);
    setError("");
    if (fetchAbortRef.current) fetchAbortRef.current.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    try {
      const payload = await apiGet(`/datalab/getdatalab/${LAB_CODE}`, {
        signal: controller.signal,
      });
      const list = Array.isArray(payload?.data) ? payload.data : [];
      setRows(
        list.map((item, idx) => {
          const idBarang = item?.idBarang ?? null;
          const nama =
            item?.barangModel?.namaBarang ?? item?.namaBarang ?? idBarang ?? "-";
          const jumlahNormal = Number(item?.jumlahNormal ?? 0);
          const jumlahRusak = Number(item?.jumlahRusak ?? 0);
          const jumlah =
            (Number.isFinite(jumlahNormal) ? jumlahNormal : 0) +
            (Number.isFinite(jumlahRusak) ? jumlahRusak : 0);
          return {
            id: idBarang ?? `row-${idx}`,
            no: idx + 1,
            idBarang,
            nama,
            jumlahNormal,
            jumlahRusak,
            jumlah,
            status: jumlahRusak > 0 ? STATUS_INCOMPLETE : STATUS_COMPLETE,
          };
        }),
      );
    } catch (err) {
      if (err?.name !== "AbortError") setError(err?.message || "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, [LAB_CODE]);

  useEffect(() => {
    fetchLabData();
    return () => fetchAbortRef.current?.abort();
  }, [fetchLabData]);

  const filteredRows = useMemo(() => {
    let out = rows;
    if (q.trim())
      out = out.filter((r) => (r?.nama || "").toLowerCase().includes(q.toLowerCase()));
    const mul = sortDir === "asc" ? 1 : -1;
    return [...out].sort((a, b) => {
      const va = a?.[sortKey];
      const vb = b?.[sortKey];
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * mul;
      return String(va ?? "").localeCompare(String(vb ?? "")) * mul;
    });
  }, [rows, q, sortKey, sortDir]);

  const totals = useMemo(() => {
    const acc = rows.reduce(
      (acc, r) => {
        acc.normal += Number(r.jumlahNormal || 0);
        acc.rusak += Number(r.jumlahRusak || 0);
        return acc;
      },
      { normal: 0, rusak: 0 },
    );
    return { normal: acc.normal, rusak: acc.rusak, total: rows.length };
  }, [rows]);

  const markResolved = async (row) => {
    const newNormal =
      (Number(row.jumlahNormal ?? 0) || 0) + (Number(row.jumlahRusak ?? 0) || 0);
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? { ...r, jumlahNormal: newNormal, jumlahRusak: 0, jumlah: newNormal, status: STATUS_COMPLETE }
          : r,
      ),
    );
    try {
      if (!row.idBarang) return;
      await apiPut(`/datalab/updateDataLab/${LAB_CODE}`, [
        { idBarang: row.idBarang, jumlahNormal: newNormal, jumlahRusak: 0 },
      ]);
    } catch (e) {
      console.error(e);
      fetchLabData();
    }
  };

  const exportCSV = () => {
    downloadCsv(
      `perangkat_${LAB_CODE}.csv`,
      ["No", "Nama", "Jumlah Normal", "Jumlah Rusak", "Total", "Status"],
      filteredRows.map((r, idx) => [
        idx + 1,
        r.nama,
        r.jumlahNormal,
        r.jumlahRusak,
        r.jumlah,
        r.status,
      ]),
    );
  };

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
                : "bg-yellow-500/15 text-yellow-300 ring-yellow-500/30"
            }`}
          >
            {v}
          </span>
        ),
      },
      {
        key: "aksi",
        header: "Aksi",
        render: (_v, row) =>
          row.status === STATUS_INCOMPLETE ? (
            <button
              type="button"
              onClick={() => markResolved(row)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
            >
              Selesai
            </button>
          ) : (
            "—"
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 lg:ml-56 pt-16 sm:pt-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Perangkat Laboratorium {labName}</h1>
          <p className="text-sm text-slate-400">
            Pantau stok dan kondisi perangkat per laboratorium.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-xl border border-slate-700">
            {["609", "610"].map((lab) => (
              <button
                key={lab}
                type="button"
                onClick={() => onChangeLab(lab)}
                className={`px-3 py-1.5 text-sm ${labId === lab ? "bg-slate-700 text-white" : "bg-slate-900 text-slate-300 hover:bg-slate-800"}`}
                aria-pressed={labId === lab}
              >
                Lab {lab}
              </button>
            ))}
          </div>
          <button
            onClick={fetchLabData}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-slate-600"
            aria-busy={loading}
          >
            {loading ? "Memuat…" : "Refresh"}
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-emerald-600"
          >
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          <div className="font-semibold">Gagal memuat</div>
          <div className="opacity-90">{error}</div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-4">
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3 sm:p-4 backdrop-blur shadow-sm">
          <div className="text-[11px] sm:text-xs text-slate-400">Total Jenis</div>
          <div className="text-lg sm:text-2xl font-bold text-white mt-0.5">{totals.total}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3 sm:p-4 backdrop-blur shadow-sm">
          <div className="text-[11px] sm:text-xs text-slate-400">Normal</div>
          <div className="text-lg sm:text-2xl font-bold text-emerald-400 mt-0.5">{totals.normal}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3 sm:p-4 backdrop-blur shadow-sm">
          <div className="text-[11px] sm:text-xs text-slate-400">Rusak/Hilang</div>
          <div className="text-lg sm:text-2xl font-bold text-rose-400 mt-0.5">{totals.rusak}</div>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama perangkat…"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 pl-9 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
          <label className="text-slate-400">Urutkan:</label>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="no">Index (#)</option>
            <option value="nama">Nama Perangkat</option>
            <option value="jumlahNormal">Jumlah Normal</option>
            <option value="jumlahRusak">Jumlah Rusak</option>
            <option value="jumlah">Total</option>
            <option value="status">Status</option>
          </select>
          <button
            type="button"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-200 transition"
            title="Arah Urutan"
          >
            {sortDir === "asc" ? "↑ A-Z" : "↓ Z-A"}
          </button>
        </div>
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 rounded-2xl bg-slate-900/60 backdrop-blur-sm" />
        )}
        <Table columns={columns} data={filteredRows} />
      </div>
    </div>
  );
}
