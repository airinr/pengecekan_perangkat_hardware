// Tabel generik: responsif mobile + filter teks & tanggal
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table } from "./DataTable";

/** Utility untuk bikin kolom Status dengan styling konsisten */
// eslint-disable-next-line react-refresh/only-export-components
export function makeStatusColumn({
  key = "status",
  header = "Status",
  labels = { complete: "Lengkap", incomplete: "Tidak Lengkap" },
} = {}) {
  return {
    key,
    header,
    render: (v) => {
      const cls =
        v === labels.complete
          ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
          : v === labels.incomplete
          ? "bg-rose-500/15 text-rose-300 ring-rose-500/30"
          : "bg-slate-500/15 text-slate-300 ring-slate-500/30";
      return (
        <span
          className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}
        >
          {v}
        </span>
      );
    },
  };
}

/** Utility: turunkan status dari selisih dua field angka */
// eslint-disable-next-line react-refresh/only-export-components
export function statusFromDiff({
  from = "jml_awal",
  to = "jml_akhir",
  labels = { complete: "Lengkap", incomplete: "Tidak Lengkap" },
} = {}) {
  return (row) => {
    const awal = Number(row[from]) || 0;
    const akhir = Number(row[to]) || 0;
    return {
      ...row,
      status: awal > akhir ? labels.incomplete : labels.complete,
    };
  };
}

/** Halaman tabel generik dengan UI/UX modern */
export default function TablePage({
  title,
  addRoute,
  addLabel = "+ Tambah Data",
  columns,
  rows = [],
  note = "*Berikut merupakan laporan terakhir",
  containerClassName = "py-4 sm:py-6 lg:ml-56 lg:pl-5",
  enableSearch = true,
  searchPlaceholder = "Cari data…",
  dateKey = "tgl",
  searchKeys,
}) {
  const navigate = useNavigate();

  // ====== STATE FILTER ======
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const derivedSearchKeys = useMemo(() => {
    if (Array.isArray(searchKeys) && searchKeys.length > 0) return searchKeys;
    if (Array.isArray(columns)) {
      return columns.map((c) => c?.key).filter((k) => k && k !== "status");
    }
    return [];
  }, [searchKeys, columns]);

  const parseDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime())
      ? null
      : new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const fromDate = useMemo(
    () => (dateFrom ? parseDate(dateFrom) : null),
    [dateFrom],
  );
  const toDate = useMemo(() => (dateTo ? parseDate(dateTo) : null), [dateTo]);

  // Filter helper
  const textMatch = (row) => {
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return derivedSearchKeys.some((k) =>
      String(row?.[k] ?? "")
        .toLowerCase()
        .includes(needle),
    );
  };

  const dateMatch = (row) => {
    if (!fromDate && !toDate) return true;
    const raw = row?.[dateKey] ?? row?.tgl ?? row?.tanggal;
    const d = parseDate(raw);
    if (!d) return false;
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  };

  const filteredRows = useMemo(() => {
    const arr = Array.isArray(rows) ? rows : [];
    return arr.filter((r) => textMatch(r) && dateMatch(r));
  }, [rows, q, fromDate, toDate, derivedSearchKeys, dateKey]);

  const isFiltered = Boolean(q || dateFrom || dateTo);

  const clearFilters = () => {
    setQ("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className={containerClassName}>
      {/* Header Bar */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {title}
          </h1>
          {note && (
            <p className="mt-1 text-xs text-slate-400">
              {note}
            </p>
          )}
        </div>

        {addRoute && (
          <button
            type="button"
            onClick={() => navigate(addRoute)}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md active:scale-95 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{addLabel}</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      {enableSearch && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Pencarian
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 pl-9 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            </div>

            {/* Dari Tanggal */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sampai Tanggal */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!isFiltered}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 text-xs sm:text-sm font-medium text-slate-200 transition active:scale-95"
              >
                Reset Filter
              </button>
            </div>
          </div>

          {/* Result Info Pill */}
          <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Menampilkan <strong className="text-white">{filteredRows.length}</strong> dari {rows.length} catatan
            </span>
            {isFiltered && (
              <span className="text-blue-400 font-medium">Filter aktif</span>
            )}
          </div>
        </div>
      )}

      {/* Main Table */}
      <Table columns={columns} data={filteredRows} />
    </div>
  );
}
