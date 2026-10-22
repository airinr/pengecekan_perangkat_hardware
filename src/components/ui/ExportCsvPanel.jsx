import { useState } from "react";
import {
  downloadCsv,
  filterRowsByDateRange,
} from "@/features/praktikum/helpers";

const CSV_HEADER = [
  "tanggal",
  "kelas",
  "waktu",
  "dosen",
  "asisten",
  "tindak_lanjut",
  "status",
  "ttd_url",
];

export default function ExportCsvPanel({
  title,
  rows,
  labCode,
  kodePraktikum,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleExport = (e) => {
    e.preventDefault();
    setMsg("");
    if (!rows || rows.length === 0) {
      setIsSuccess(false);
      setMsg("Tidak ada data untuk diekspor.");
      return;
    }
    const filtered = filterRowsByDateRange(rows, "tgl", start, end);
    if (filtered.length === 0) {
      setIsSuccess(false);
      setMsg("Tidak ada data dalam rentang tanggal tersebut.");
      return;
    }
    downloadCsv(
      `histori_${kodePraktikum}_${labCode}${start ? `_${start}` : ""}${end ? `_${end}` : ""}.csv`,
      CSV_HEADER,
      filtered.map((row) => [
        row.tgl || "",
        row.kelas || "",
        row.waktu || "",
        row.dosen || "",
        typeof row.asisten === "string" ? row.asisten : "",
        row.tindak_lanjut || "",
        row.statusText || "",
        row.ttdUrl || "",
      ]),
    );
    setIsSuccess(true);
    setMsg(`Berhasil mengunduh ${filtered.length} baris data ke format CSV.`);
  };

  return (
    <div className="mb-4 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur lg:ml-56 lg:pl-5 overflow-hidden transition-all">
      {/* Collapsible Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 grid place-items-center border border-emerald-500/20">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-semibold text-slate-100">
              {title || "Ekspor Data Histori ke File CSV"}
            </h2>
            <p className="text-[11px] text-slate-400">
              {isOpen ? "Klik untuk menutup panel filter ekspor" : "Klik untuk membuka filter rentang tanggal ekspor"}
            </p>
          </div>
        </div>

        <svg
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="p-4 pt-1 border-t border-white/5 animate-fade-in">
          <form
            onSubmit={handleExport}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tanggal Mulai (Opsional)
              </label>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="block w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tanggal Selesai (Opsional)
              </label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="block w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Unduh File CSV</span>
              </button>
            </div>
          </form>

          {msg && (
            <div
              className={`mt-3 p-2.5 rounded-xl text-xs font-medium border ${
                isSuccess
                  ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                  : "border-rose-500/30 bg-rose-500/15 text-rose-200"
              }`}
            >
              {msg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
