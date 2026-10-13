import { API_BASE } from "@/lib/apiClient";
import { STATUS_COMPLETE, STATUS_INCOMPLETE } from "./constants";

export function toAbsoluteUrl(v) {
  if (!v || typeof v !== "string") return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("/")) return `${API_BASE}${v}`;
  return `${API_BASE}/${v}`;
}

const norm = (s) => String(s || "").trim().toUpperCase();

export function getLabCode(h) {
  return (
    h?.idlab ??
    h?.labId ??
    h?.kode_lab ??
    h?.lab_code ??
    h?.labCode ??
    h?.lab?.id ??
    h?.lab?.code ??
    h?.idLab ??
    ""
  );
}

export function isSameLab(h, labCode) {
  return norm(getLabCode(h)) === norm(labCode);
}

export function getHistoryId(h) {
  return (
    h?.idHistory ??
    h?.idhistory ??
    h?.id_history ??
    h?.history_id ??
    h?.historyId ??
    h?.id ??
    h?.kode ??
    h?.code ??
    null
  );
}

export function getUserName(h) {
  return (
    h?.userModel?.nama ||
    h?.user?.nama ||
    h?.user?.name ||
    h?.asisten ||
    h?.assistant ||
    h?.user_name ||
    h?.userName ||
    ""
  );
}

export function getClassName(h) {
  return (
    h?.kelas ??
    h?.Kelas ??
    h?.nama_kelas ??
    h?.kelas_nama ??
    h?.class ??
    h?.className ??
    h?.kelasPraktikum ??
    h?.kelasModel?.namaKelas ??
    ""
  );
}

export function getDosenName(h) {
  return (
    h?.dosenModel?.namaDosen ??
    h?.dosen?.nama ??
    h?.namaDosen ??
    h?.dosen_name ??
    h?.lecturer ??
    ""
  );
}

export function computeStatus(details) {
  if (!Array.isArray(details) || details.length === 0)
    return STATUS_INCOMPLETE;
  for (const d of details) {
    const awal = Number(d?.jumlahAwal ?? 0);
    const akhir = Number(d?.jumlahAkhir ?? 0);
    const rusak = Number(d?.jumlahRusak ?? 0);
    if (rusak > 0 || akhir < awal) return STATUS_INCOMPLETE;
  }
  return STATUS_COMPLETE;
}

export function escapeCsv(value) {
  const v = value == null ? "" : String(value);
  return `"${v.replace(/"/g, '""')}"`;
}

export function downloadCsv(filename, header, rows) {
  const lines = [header.map(escapeCsv).join(",")];
  for (const row of rows) lines.push(row.map(escapeCsv).join(","));
  const blob = new Blob([lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function filterRowsByDateRange(rows, dateKey, startStr, endStr) {
  let start = startStr ? new Date(startStr) : null;
  let end = endStr ? new Date(endStr) : null;
  if (end) end.setHours(23, 59, 59, 999);
  return rows.filter((row) => {
    if (!row[dateKey]) return false;
    const d = new Date(row[dateKey]);
    if (Number.isNaN(d.getTime())) return false;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });
}

export function getCurrentUserName() {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u?.username || u?.name || "";
  } catch {
    return "";
  }
}

export function getTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getNowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function humanizeError(raw = "") {
  const msg = String(raw || "").toLowerCase();
  if (msg.includes("failed to fetch") || msg.includes("network"))
    return "Gagal terhubung ke server. Periksa koneksi internet atau coba lagi sebentar lagi.";
  if (msg.includes("timeout"))
    return "Server terlalu lama merespons. Coba kirim lagi.";
  if (msg.includes("unauthorized") || msg.includes("401"))
    return "Sesi login berakhir atau tidak valid. Silakan login ulang.";
  if (msg.includes("403"))
    return "Akses ditolak. Akun Anda tidak punya izin untuk aksi ini.";
  if (msg.includes("404"))
    return "Data atau layanan tidak ditemukan. Pastikan URL benar.";
  if (msg.includes("413"))
    return "File terlalu besar. Kompres/perkecil foto dulu lalu coba lagi.";
  if (msg.includes("500"))
    return "Terjadi kesalahan di server. Coba beberapa saat lagi.";
  if (msg.includes("tanggal"))
    return "Tanggal wajib diisi. Pilih tanggal pelaksanaan terlebih dahulu.";
  if (msg.includes("dosen")) return "Pilih dosen terlebih dahulu.";
  if (msg.includes("kelas")) return "Pilih kelas terlebih dahulu.";
  if (msg.includes("waktu")) return "Isi waktu mulai terlebih dahulu (HH:MM).";
  if (msg.includes("dataalat") || msg.includes("idbarang"))
    return "Isi minimal satu item peralatan dengan ID Barang dan Jumlah Akhir.";
  if (msg.includes("tindak lanjut") || msg.includes("tindaklanjut"))
    return "Tindak lanjut wajib diisi. Tuliskan rencana perbaikan atau penggantian.";
  if (msg.includes("catatan"))
    return "Catatan wajib diisi untuk perangkat yang jumlah akhirnya berbeda dari jumlah awal.";
  if (
    msg.includes("photopraktikum") ||
    msg.includes("photo praktikum") ||
    msg.includes("photo") ||
    msg.includes("foto")
  )
    return "Foto wajib diisi. Silakan unggah dokumentasi praktikum terlebih dahulu.";
  if (!raw) return "Terjadi kesalahan yang tidak diketahui.";
  return raw;
}
