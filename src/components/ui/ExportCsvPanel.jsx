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
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [msg, setMsg] = useState("");

  const handleExport = (e) => {
    e.preventDefault();
    setMsg("");
    if (!rows || rows.length === 0) {
      setMsg("Tidak ada data untuk diekspor.");
      return;
    }
    const filtered = filterRowsByDateRange(rows, "tgl", start, end);
    if (filtered.length === 0) {
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
    setMsg(`Berhasil mengekspor ${filtered.length} baris ke CSV.`);
  };

  return (
    <div className="mb-6 rounded-xl border border-white/10 bg-slate-900/70 p-4 lg:ml-56 lg:pl-5">
      <h2 className="text-sm font-semibold text-slate-100 mb-3">{title}</h2>
      <form
        onSubmit={handleExport}
        className="flex flex-col gap-3 md:flex-row md:items-end"
      >
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Tanggal mulai
          </label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="block w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Tanggal selesai
          </label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="block w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          />
        </div>
        <div>
          <button
            type="submit"
            className="inline-flex items-center rounded-lg px-4 py-2 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500"
          >
            Export CSV
          </button>
        </div>
      </form>
      {msg && <p className="mt-2 text-xs text-slate-300">{msg}</p>}
    </div>
  );
}
