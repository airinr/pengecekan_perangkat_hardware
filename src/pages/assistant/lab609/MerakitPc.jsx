/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TablePage from "../template/TableTemplate";

const API_BASE = import.meta.env.VITE_API_URL || "";
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

const STATUS_COMPLETE = "Lengkap";
const STATUS_INCOMPLETE = "Tidak Lengkap";

const columns = [
  { key: "no", header: "#" },
  { key: "tgl", header: "Hari/Tanggal" },
  { key: "kelas", header: "Kelas" },
  { key: "waktu", header: "Waktu" },
  { key: "dosen", header: "Dosen" },
  { key: "asisten", header: "Nama/Asisten" },
  { key: "ttd", header: "TTD" },
  { key: "tindak_lanjut", header: "Tindak Lanjut" },
  { key: "status", header: "Status" },
  { key: "aksi", header: "Aksi" },
];

const LAB_NAMES = { LAB00001: "Lab 609", LAB00002: "Lab 610" };
const PRAKTIKUM_NAMES = {
  PRTK00001: "Merakit Komputer",
  PRTK00002: "BIOS & Partisi",
  PRTK00003: "Jaringan Komputer",
  PRTK00004: "Troubleshooting",
};

// 🔹 mapping path <-> kode praktikum (pastikan path ini ada di <Routes/>)
const PATH_TO_KODE = {
  "/lab609_merakit_pc": "PRTK00001",
  "/lab609_bios_partisi": "PRTK00002",
  "/lab609_jarkom": "PRTK00003",
  "/lab609_troubleshooting": "PRTK00004",
};

// ✅ mapping KODE_PRAKTIKUM → PATH FORM (sesuai <Routes/> kamu)
const FORM_ROUTE_BY_KODE = {
  PRTK00001: "/form_merakit_pc",
  PRTK00002: "/form_bios_partisi",
  PRTK00003: "/form_jarkom",
  PRTK00004: "/form_troubleshooting",
};

const toUrl = (v, apiBase) => {
  if (!v || typeof v !== "string") return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("/")) return `${apiBase}${v}`;
  return `${apiBase}/${v}`;
};

const getLabCode = (h) =>
  h?.idlab ??
  h?.labId ??
  h?.kode_lab ??
  h?.lab_code ??
  h?.labCode ??
  h?.lab?.id ??
  h?.lab?.code ??
  h?.idLab ??
  "";

const getHistoryId = (h) =>
  h?.idHistory ??
  h?.idhistory ??
  h?.id_history ??
  h?.history_id ??
  h?.historyId ??
  h?.id ??
  h?.kode ??
  h?.code ??
  null;

const getUserName = (h) =>
  h?.userModel?.nama ||
  h?.user?.nama ||
  h?.user?.name ||
  h?.asisten ||
  h?.assistant ||
  h?.user_name ||
  h?.userName ||
  "";

const getClassName = (h) =>
  h?.kelas ??
  h?.Kelas ??
  h?.nama_kelas ??
  h?.kelas_nama ??
  h?.class ??
  h?.className ??
  h?.kelasPraktikum ??
  h?.kelasModel?.namaKelas ??
  "";

const getDosenName = (h) =>
  h?.dosenModel?.namaDosen ??
  h?.dosen?.nama ??
  h?.namaDosen ??
  h?.dosen_name ??
  h?.lecturer ??
  "";

const norm = (s) =>
  String(s || "")
    .trim()
    .toUpperCase();

const STATUS_COMPLETE_LABEL = "Lengkap";
const STATUS_INCOMPLETE_LABEL = "Tidak Lengkap";

const computeStatus = (details) => {
  if (!Array.isArray(details) || details.length === 0)
    return STATUS_INCOMPLETE_LABEL;
  for (const d of details) {
    const awal = Number(d?.jumlahAwal ?? 0);
    const akhir = Number(d?.jumlahAkhir ?? 0);
    const rusak = Number(d?.jumlahRusak ?? 0);
    if (rusak > 0 || akhir < awal) return STATUS_INCOMPLETE_LABEL;
  }
  return STATUS_COMPLETE_LABEL;
};

async function fetchStatusByHistoryId(hid, token) {
  try {
    const res = await fetch(
      `${API_BASE}/praktikum/getDetailHistory/${encodeURIComponent(hid)}`,
      {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...NGROK_HEADERS,
        },
      }
    );
    if (!res.ok) throw new Error(await res.text());
    const payload = await res.json();
    const details = Array.isArray(payload?.data) ? payload.data : [];
    return computeStatus(details);
  } catch {
    return STATUS_INCOMPLETE_LABEL;
  }
}

export default function MerakitPc() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  // 🔽 state untuk EXPORT CSV
  const [exportStart, setExportStart] = useState("");
  const [exportEnd, setExportEnd] = useState("");
  const [exportMsg, setExportMsg] = useState("");

  // 🔹 Ambil dari query, fallback kalau kosong
  const LAB_CODE = sp.get("lab") || "LAB00001";
  const KODE_PRAKTIKUM = (sp.get("kode") || "PRTK00001").toUpperCase();

  useEffect(() => {
    let alive = true;
    (async () => {
      setRows([]);
      setLoading(true);
      setErr("");
      try {
        const token = localStorage.getItem("token");

        const url = new URL(
          `${API_BASE}/praktikum/getPraktikumHistory/${encodeURIComponent(
            KODE_PRAKTIKUM
          )}`
        );
        url.searchParams.set("lab", LAB_CODE);

        const res = await fetch(url.toString(), {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...NGROK_HEADERS,
          },
        });

        if (!res.ok) {
          if (alive) setRows([]);
          throw new Error(await res.text());
        }

        const payload = await res.json();
        const raw = Array.isArray(payload?.data) ? payload.data : [];
        const data = raw.filter((h) => norm(getLabCode(h)) === norm(LAB_CODE));

        const statusList = await Promise.all(
          data.map(async (h) => {
            const hid = getHistoryId(h);
            if (!hid) return STATUS_INCOMPLETE_LABEL;
            return fetchStatusByHistoryId(hid, token);
          })
        );

        const mapped = data.map((h, i) => {
          const ttdUrl = toUrl(h?.ttd, API_BASE);
          const hid = getHistoryId(h);
          const nama = getUserName(h);

          const goDetail = () => {
            if (!hid) return;
            navigate(`/history_detail/${encodeURIComponent(hid)}`, {
              state: { item: h },
            });
          };

          const status = statusList[i];
          const statusNode = (
            <span
              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                status === STATUS_COMPLETE_LABEL
                  ? "bg-green-500/15 text-green-300 ring-green-500/30"
                  : "bg-rose-500/15 text-rose-300 ring-rose-500/30"
              }`}
            >
              {status}
            </span>
          );

          return {
            no: i + 1,
            tgl: h?.tanggal ?? "",
            kelas: getClassName(h),
            waktu: h?.waktu ?? "",
            dosen: getDosenName(h),
            asisten: nama || "—",
            ttd: ttdUrl ? (
              <a href={ttdUrl} target="_blank" rel="noreferrer">
                <img
                  src={ttdUrl}
                  alt="TTD"
                  className="h-10 w-10 rounded object-cover border border-slate-700"
                />
              </a>
            ) : (
              "—"
            ),
            tindak_lanjut: h?.tindakLanjut ?? "",
            status: statusNode,
            aksi: (
              <button
                type="button"
                onClick={goDetail}
                disabled={!hid}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-slate-700 ${
                  hid
                    ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
                    : "bg-slate-800/50 text-slate-400 cursor-not-allowed"
                }`}
                title={hid ? "Lihat detail history" : "ID tidak tersedia"}
              >
                Detail
              </button>
            ),
            // 🔽 simpan teks status & url ttd mentah untuk kebutuhan export
            statusText: status,
            ttdUrlRaw: ttdUrl,
          };
        });

        if (alive) setRows(mapped);
      } catch (e) {
        console.error(e);
        if (alive) {
          setErr(e?.message || "Gagal memuat histori praktikum");
          setRows([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [navigate, LAB_CODE, KODE_PRAKTIKUM]);

  // 🔽 handler EXPORT CSV dengan rentang tanggal
  const handleExportCsv = (e) => {
    e.preventDefault();
    setExportMsg("");

    if (!rows || rows.length === 0) {
      setExportMsg("Tidak ada data untuk diekspor.");
      return;
    }

    let start = null;
    let end = null;

    if (exportStart) {
      start = new Date(exportStart);
    }
    if (exportEnd) {
      end = new Date(exportEnd);
      end.setHours(23, 59, 59, 999); // supaya inklusif
    }

    const filtered = rows.filter((row) => {
      if (!row.tgl) return false;
      const d = new Date(row.tgl);
      if (Number.isNaN(d.getTime())) return false;

      if (start && d < start) return false;
      if (end && d > end) return false;

      return true;
    });

    if (filtered.length === 0) {
      setExportMsg("Tidak ada data dalam rentang tanggal tersebut.");
      return;
    }

    // header CSV
    const header = [
      "tanggal",
      "kelas",
      "waktu",
      "dosen",
      "asisten",
      "tindak_lanjut",
      "status",
      "ttd_url",
    ];

    const escapeCsv = (value) => {
      const v = value == null ? "" : String(value);
      // ganti " jadi "" lalu bungkus pakai "
      return `"${v.replace(/"/g, '""')}"`;
    };

    const lines = [];
    lines.push(header.map(escapeCsv).join(","));

    filtered.forEach((row) => {
      const line = [
        row.tgl || "",
        row.kelas || "",
        row.waktu || "",
        row.dosen || "",
        typeof row.asisten === "string" ? row.asisten : "",
        row.tindak_lanjut || "",
        row.statusText || "",
        row.ttdUrlRaw || "",
      ].map(escapeCsv);

      lines.push(line.join(","));
    });

    const csvContent = lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const fileName = `histori_${KODE_PRAKTIKUM}_${LAB_CODE}${
      exportStart ? `_${exportStart}` : ""
    }${exportEnd ? `_${exportEnd}` : ""}.csv`;

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportMsg(`Berhasil mengekspor ${filtered.length} baris ke CSV.`);
  };

  // 🔹 Penamaan dinamis
  const labName = LAB_NAMES[LAB_CODE] || LAB_CODE;
  const praktikumName = PRAKTIKUM_NAMES[KODE_PRAKTIKUM] || KODE_PRAKTIKUM;

  // 🔹 Fallback back button
  const fallbackPath =
    LAB_CODE === "LAB00001"
      ? "/lab609"
      : LAB_CODE === "LAB00002"
      ? "/lab610"
      : "/dashboard_asisten";

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(fallbackPath, { replace: true });
  };

  // ===== Dropdown kategori (PATH /lab609_* + ?kode=...&lab=...)
  const handleNavigateCategory = (path) => {
    if (!path) return;
    const kode = PATH_TO_KODE[path] || "";
    const next = `${path}?kode=${encodeURIComponent(
      kode
    )}&lab=${encodeURIComponent(LAB_CODE)}`;
    navigate(next);
  };

  // ✅ tentukan path form berdasarkan KODE_PRAKTIKUM
  const formPath = FORM_ROUTE_BY_KODE[KODE_PRAKTIKUM] || "/form_merakit_pc";
  const addRoute = `${formPath}?kode=${encodeURIComponent(
    KODE_PRAKTIKUM
  )}&lab=${encodeURIComponent(LAB_CODE)}`;

  return (
    <div className="px-4 sm:px-6 lg:px-8 mt-16 sm:mt-6 pb-4">
      {/* Dropdown kategori */}
      <div className="py-6 lg:ml-56 lg:pl-5">
        <label
          htmlFor="topik"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Pilih kategori untuk melakukan laporan
        </label>

        <select
          id="topik"
          defaultValue=""
          onChange={(e) => handleNavigateCategory(e.target.value)}
          className="mb-6 block w-full appearance-none rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 pr-9 text-sm text-slate-100"
        >
          <option value="" disabled>
            Pilih kategori
          </option>
          <option value="/lab609_merakit_pc">Merakit Komputer</option>
          <option value="/lab609_bios_partisi">Bios dan Partisi</option>
          <option value="/lab609_jarkom">Jaringan Komputer</option>
          <option value="/lab609_troubleshooting">Troubleshooting</option>
        </select>
      </div>

      {/* 🔽 FORM EXPORT CSV DENGAN RENTANG TANGGAL */}
      <div className="mb-6 rounded-xl border border-white/10 bg-slate-900/70 p-4 lg:ml-56 lg:pl-5">
        <h2 className="text-sm font-semibold text-slate-100 mb-3">
          Export CSV histori praktikum ({praktikumName} — {labName})
        </h2>
        <form
          onSubmit={handleExportCsv}
          className="flex flex-col gap-3 md:flex-row md:items-end"
        >
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Tanggal mulai
            </label>
            <input
              type="date"
              value={exportStart}
              onChange={(e) => setExportStart(e.target.value)}
              className="block w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Tanggal selesai
            </label>
            <input
              type="date"
              value={exportEnd}
              onChange={(e) => setExportEnd(e.target.value)}
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
        {exportMsg && (
          <p className="mt-2 text-xs text-slate-300">{exportMsg}</p>
        )}
      </div>

      <TablePage
        title={`${praktikumName} — ${labName}`}
        addRoute={addRoute}
        addLabel={`+ Lakukan pelaporan praktikum ${praktikumName}`}
        columns={columns}
        rows={rows}
        note={
          loading
            ? "Memuat histori praktikum…"
            : err
            ? `Error: ${err}`
            : rows.length === 0
            ? "Belum ada histori. Silakan buat laporan pertama."
            : `*Berikut merupakan laporan terakhir (${labName})`
        }
      />
    </div>
  );
}
