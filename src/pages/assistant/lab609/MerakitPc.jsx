/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TablePage from "../template/TableTemplate";

const KODE_PRAKTIKUM = "PRTK00001";
const LAB_CODE = "LAB00001";

const API_BASE = import.meta.env.VITE_API_URL || "";
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

const STATUS_COMPLETE = "Lengkap";
const STATUS_INCOMPLETE = "Tidak Lengkap";

// +++ tambah kolom TTD + Nama/Asisten + Status + Aksi
const columns = [
  { key: "no", header: "#" },
  { key: "tgl", header: "Hari/Tanggal" },
  { key: "kelas", header: "Kelas" },
  { key: "waktu", header: "Waktu" },
  { key: "asisten", header: "Nama/Asisten" },
  { key: "ttd", header: "TTD" },
  { key: "tindak_lanjut", header: "Tindak Lanjut" },
  { key: "status", header: "Status" }, // <-- baru
  { key: "aksi", header: "Aksi" },
];

const toUrl = (v) => {
  if (!v || typeof v !== "string") return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("/")) return `${API_BASE}${v}`;
  return `${API_BASE}/${v}`;
};

// ambil kode lab dari berbagai kemungkinan field
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

// ambil id history dari berbagai kemungkinan field backend
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

// ambil nama user/asisten dari berbagai kemungkinan field backend
const getUserName = (h) =>
  h?.userModel?.nama ||
  h?.user?.nama ||
  h?.user?.name ||
  h?.asisten ||
  h?.assistant ||
  h?.user_name ||
  h?.userName ||
  "";

const norm = (s) =>
  String(s || "")
    .trim()
    .toUpperCase();

// --- fungsi bantu untuk nilai status dari detail history
const computeStatus = (details) => {
  if (!Array.isArray(details) || details.length === 0) return STATUS_INCOMPLETE;
  for (const d of details) {
    const awal = Number(d?.jumlahAwal ?? 0);
    const akhir = Number(d?.jumlahAkhir ?? 0);
    const rusak = Number(d?.jumlahRusak ?? 0);
    // aturan sederhana: jika ada yang rusak atau stok akhir kurang dari awal -> tidak lengkap
    if (rusak > 0 || akhir < awal) return STATUS_INCOMPLETE;
  }
  return STATUS_COMPLETE;
};

// fetch detail per history lalu kembalikan status
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
    return STATUS_INCOMPLETE; // jika gagal ambil detail, tandai tidak lengkap
  }
}

export default function MerakitPc() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
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
        if (!res.ok) throw new Error(await res.text());

        const payload = await res.json();
        const raw = Array.isArray(payload?.data) ? payload.data : [];

        // filter by LAB
        const data = raw.filter((h) => norm(getLabCode(h)) === norm(LAB_CODE));

        // Ambil status detail untuk tiap history (parallel)
        const statusList = await Promise.all(
          data.map(async (h) => {
            const hid = getHistoryId(h);
            if (!hid) return STATUS_INCOMPLETE;
            return fetchStatusByHistoryId(hid, token);
          })
        );

        const mapped = data.map((h, i) => {
          const ttdUrl = toUrl(h?.ttd);
          const hid = getHistoryId(h);
          const nama = getUserName(h);

          const goDetail = () => {
            if (!hid) return;
            navigate(`/history_detail/${encodeURIComponent(hid)}`, {
              state: { item: h },
            });
          };

          // badge status
          const status = statusList[i];
          const statusNode = (
            <span
              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                status === STATUS_COMPLETE
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
            kelas: h?.kelas ?? "",
            waktu: h?.waktu ?? "",
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
            status: statusNode, // <-- tampilkan status
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
          };
        });

        if (alive) setRows(mapped);
      } catch (e) {
        console.error(e);
        if (alive) setErr(e?.message || "Gagal memuat histori praktikum");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [navigate]);

  const addHref = `/form_merakit_pc?kode=${encodeURIComponent(
    KODE_PRAKTIKUM
  )}&lab=${encodeURIComponent(LAB_CODE)}`;

  return (
    <TablePage
      title="Perangkat Laboratorium 609 - Merakit PC"
      addRoute={addHref}
      addLabel="+ Tambah Data"
      columns={columns}
      rows={rows}
      note={
        loading
          ? "Memuat histori praktikum…"
          : err
          ? `Error: ${err}`
          : "*Berikut merupakan laporan terakhir (LAB609)"
      }
    />
  );
}
