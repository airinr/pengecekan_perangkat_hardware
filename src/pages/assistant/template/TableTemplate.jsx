// src/components/TablePage.jsx (1 tabel, responsif mobile + filter teks & tanggal)
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table } from "../../../components/DefaultTable";

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
          ? "bg-green-500/15 text-green-300 ring-green-500/30"
          : v === labels.incomplete
          ? "bg-yellow-500/15 text-yellow-300 ring-yellow-500/30"
          : "bg-slate-500/15 text-slate-300 ring-slate-500/30";
      return (
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}
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

/** Halaman tabel generik: 1 tabel, tetap tabel di mobile, dengan filter teks & tanggal */
export default function TablePage({
  title,
  addRoute,
  addLabel = "+ Tambah Data",
  columns,
  rows,
  note = "*Berikut merupakan laporan terakhir",
  containerClassName = "py-6 lg:ml-56 lg:pl-5",
  // opsi pencarian
  enableSearch = true,
  searchPlaceholder = "Cari teks...",
  dateKey = "tgl",
  searchKeys,
}) {
  const navigate = useNavigate();

  // ====== STATE FILTER ======
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState(""); // YYYY-MM-DD
  const [dateTo, setDateTo] = useState(""); // YYYY-MM-DD

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
    [dateFrom]
  );
  const toDate = useMemo(() => (dateTo ? parseDate(dateTo) : null), [dateTo]);

  // Filter helper
  const textMatch = (row) => {
    if (!q) return true;
    const needle = q.toLowerCase();
    return derivedSearchKeys.some((k) =>
      String(row?.[k] ?? "")
        .toLowerCase()
        .includes(needle)
    );
  };

  const dateMatch = (row) => {
    if (!fromDate && !toDate) return true;
    const raw = row?.[dateKey] ?? row?.tgl ?? row?.tanggal;
    const d = parseDate(raw);
    if (!d) return false; // jika tidak ada tanggal valid & filter aktif, tidak match
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  };

  // ====== DATA TERFILTER (satu tabel) ======
  const filteredRows = useMemo(() => {
    const arr = Array.isArray(rows) ? rows : [];
    return arr.filter((r) => textMatch(r) && dateMatch(r));
  }, [rows, q, fromDate, toDate, derivedSearchKeys, dateKey]);

  const clearFilters = () => {
    setQ("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className={containerClassName}>
      <div className="mb-4 items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        {addRoute && (
          <button
            type="button"
            onClick={() => navigate(addRoute)}
            className="inline-flex items-center my-5 gap-2 rounded-2xl px-4 py-2 text-sm font-medium shadow-sm bg-slate-900 text-white hover:opacity-90"
          >
            {addLabel}
          </button>
        )}
      </div>

      {note && (
        <p className="mb-3 text-xs italic text-slate-500 dark:text-slate-400">
          {note}
        </p>
      )}

      {/* ==== Filter bar (text & tanggal) ==== */}
      {enableSearch && (
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs text-slate-400">
              Pencarian
            </label>
            <input
              type="text"
              inputMode="text"
              placeholder={searchPlaceholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-600"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 hover:bg-slate-700"
            >
              Reset Filter
            </button>
          </div>
        </div>
      )}

      {/* Satu tabel (tetap tabel di mobile, bisa scroll horizontal) */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
        {/* Set min-width agar kolom tidak pecah; mobile bisa scroll */}
        <div className="min-w-[720px] sm:min-w-full text-xs sm:text-sm">
          <Table columns={columns} data={filteredRows} />
        </div>
      </div>

      <style>{`
        .overflow-x-auto { -webkit-overflow-scrolling: touch; }
      `}</style>
    </div>
  );
}
