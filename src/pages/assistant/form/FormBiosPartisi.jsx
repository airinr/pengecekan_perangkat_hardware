/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "";
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

// ====== KONFIG FORM BIOS & PARTISI ======
const PRAKTIKUM_CODE = "PRTK00002";
const DEFAULT_ITEMS = ["Flashdisk", "Komputer"]; // sesuaikan item cek BIOS & Partisi

const LAB_NAMES = { LAB00001: "Lab 609", LAB00002: "Lab 610" };
const PRAKTIKUM_NAMES = {
  PRTK00001: "Merakit Komputer",
  PRTK00002: "BIOS dan Partisi",
  PRTK00003: "Jaringan Komputer",
  PRTK00004: "Troubleshooting",
};

// ===== Terjemahkan error teknis → bahasa manusia =====
const humanizeError = (raw = "") => {
  const msg = String(raw || "").toLowerCase();

  // jaringan/server umum
  if (msg.includes("failed to fetch") || msg.includes("network"))
    return "Tidak bisa terhubung ke server. Cek koneksi internet atau coba lagi sebentar lagi.";
  if (msg.includes("timeout"))
    return "Server lama merespons. Silakan coba kirim ulang.";
  if (msg.includes("unauthorized") || msg.includes("401"))
    return "Sesi login sudah habis atau tidak valid. Silakan login ulang.";
  if (msg.includes("403"))
    return "Akses ditolak. Akun Anda tidak punya izin untuk aksi ini.";
  if (msg.includes("404"))
    return "Layanan tidak ditemukan. Pastikan URL API sudah benar.";
  if (msg.includes("413"))
    return "File foto terlalu besar. Kompres/ perkecil foto lalu kirim lagi.";
  if (msg.includes("500"))
    return "Ada masalah di server. Coba beberapa saat lagi.";

  // validasi form (kata kunci longgar biar gampang dipanggil)
  if (msg.includes("tanggal")) return "Tanggal wajib diisi.";
  if (msg.includes("iddosen") || msg.includes("dosen"))
    return "Pilih dosen terlebih dahulu.";
  if (msg.includes("idkelas") || msg.includes("kelas"))
    return "Pilih kelas terlebih dahulu.";
  if (msg.includes("waktu")) return "Isi waktu mulai (HH:MM) terlebih dahulu.";
  if (msg.includes("dataalat") || msg.includes("idbarang"))
    return "Isi minimal satu peralatan: ID Barang dan Jumlah Akhir.";

  // ✅ Terjemahan khusus error foto (frontend & backend)
  if (
    msg.includes("photopraktikum") ||
    msg.includes("photo praktikum") ||
    msg.includes("photo") ||
    msg.includes("foto")
  )
    return "Foto wajib di isi. Silakan unggah dokumentasi praktikum terlebih dahulu.";

  // fallback
  return raw || "Terjadi kesalahan yang tidak diketahui.";
};

// helper: ambil nama user dari localStorage
const getCurrentUserName = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u?.username || u?.name || "";
  } catch {
    return "";
  }
};

// helper tanggal hari ini (YYYY-MM-DD)
const getTodayDate = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// helper waktu sekarang (HH:MM)
const getNowTime = () => {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mi}`;
};

export default function FormBiosPartisi() {
  // Ambil dari query: ?kode=PRTK00002&lab=LAB0000X
  const [sp] = useSearchParams();
  const labCode = sp.get("lab") || "";
  const kodePraktikum = (sp.get("kode") || PRAKTIKUM_CODE).toUpperCase();

  // ===== Header form =====
  const [header, setHeader] = useState({
    tanggal: getTodayDate(),
    idDosen: "", // ✅ kirim idDosen
    idKelas: "", // ✅ kirim idKelas
    asisten: getCurrentUserName(),
    waktuMulai: getNowTime(), // UI: HH:MM → akan dikirim HH:MM:SS
    waktuSelesai: "",
  });

  // ===== Popup Error State =====
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const openError = (msg) => {
    setErrorMsg(humanizeError(msg));
    setShowError(true);
  };
  const closeError = () => setShowError(false);

  // Tahun ajar & semester (untuk filter kelas)
  const [tahunAjar, setTahunAjar] = useState("2025");
  const [semester, setSemester] = useState("Ganjil");

  // ===== Rows kelengkapan =====
  const [rows, setRows] = useState(
    DEFAULT_ITEMS.map((name, i) => ({
      id: i + 1,
      name,
      idBarang: "",
      awal: "",
      akhir: "",
      kerusakan: "",
    }))
  );

  const [tindakLanjut, setTindakLanjut] = useState("");

  // ===== Foto praktikum =====
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const onPickFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };
  const clearFoto = () => {
    setFotoFile(null);
    setFotoPreview("");
  };

  const handleRowChange = (id, key, value) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: value } : r))
    );
  };

  // =========================
  // Prefill dari /datalab/getdatalab/{lab}
  // =========================
  const [loadingPrefill, setLoadingPrefill] = useState(false);
  const [prefillError, setPrefillError] = useState("");

  const fetchDatalab = useCallback(async () => {
    if (!labCode) return;
    setLoadingPrefill(true);
    setPrefillError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/datalab/getdatalab/${labCode}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...NGROK_HEADERS,
        },
      });
      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({})))?.message ||
          "Gagal memuat data lab";
        throw new Error(msg);
      }
      const payload = await res.json();
      const list = Array.isArray(payload?.data) ? payload.data : [];

      const nameToInfo = new Map();
      list.forEach((it) => {
        const nama = (it?.barangModel?.namaBarang || "").trim().toLowerCase();
        const idBarang = (it?.idBarang || "").trim();
        const jn = Number(it?.jumlah ?? 0);
        const jr = Number(it?.jumlahRusak ?? 0);
        if (nama && idBarang) nameToInfo.set(nama, { idBarang, jn, jr });
      });

      setRows((prev) =>
        prev.map((r) => {
          const info = nameToInfo.get(r.name.trim().toLowerCase());
          if (!info) return r;
          return { ...r, idBarang: info.idBarang, awal: info.jn };
        })
      );
    } catch (err) {
      console.error(err);
      setPrefillError(err?.message || "Gagal memuat data lab.");
      openError(err?.message);
    } finally {
      setLoadingPrefill(false);
    }
  }, [labCode]);

  useEffect(() => {
    fetchDatalab();
  }, [fetchDatalab]);

  // =========================
  // Dosen (GET /dosen) -> simpan {id, label}
  // =========================
  const [dosenOptions, setDosenOptions] = useState([]); // {id, label}[]
  const [dosenLoading, setDosenLoading] = useState(false);
  const [dosenErr, setDosenErr] = useState("");

  const parseDosen = (d) => {
    const id = d?.idDosen || d?.kodeDosen || d?.id || d?.kode || "";
    const label = d?.namaDosen || d?.nama || d?.name || d?.fullName || "";
    return { id: String(id || "").trim(), label: String(label || "").trim() };
  };

  const fetchDosen = useCallback(async () => {
    setDosenLoading(true);
    setDosenErr("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/dosen`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...NGROK_HEADERS,
        },
      });
      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({})))?.message ||
          "Gagal memuat dosen.";
        throw new Error(msg);
      }
      const payload = await res.json();
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.dosen)
        ? payload.dosen
        : [];
      const parsed = list.map(parseDosen).filter((x) => x.id && x.label);

      // unique by id + sort label
      const uniqMap = new Map();
      parsed.forEach((x) => {
        if (!uniqMap.has(x.id)) uniqMap.set(x.id, x);
      });
      const uniq = Array.from(uniqMap.values()).sort((a, b) =>
        a.label.localeCompare(b.label)
      );
      setDosenOptions(uniq);
    } catch (e) {
      console.error(e);
      setDosenErr(e?.message || "Gagal memuat dosen.");
      setDosenOptions([]);
      openError(e?.message);
    } finally {
      setDosenLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDosen();
  }, [fetchDosen]);

  // =========================
  // Kelas by Dosen (GET /dosenKelas/getKelas) -> simpan {id, label}
  // =========================
  const [kelasOptions, setKelasOptions] = useState([]); // {id, label}[]
  const [kelasLoading, setKelasLoading] = useState(false);
  const [kelasErr, setKelasErr] = useState("");

  const fetchKelasByDosen = useCallback(
    async (idDosen, tahunAjarParam, semesterParam) => {
      if (!idDosen) {
        setKelasOptions([]);
        setHeader((h) => ({ ...h, idKelas: "" }));
        return;
      }
      setKelasLoading(true);
      setKelasErr("");
      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams({
          namaDosen: dosenOptions.find((d) => d.id === idDosen)?.label || "",
          tahunAjar: tahunAjarParam || tahunAjar,
          semester: semesterParam || semester,
        });
        const res = await fetch(
          `${API_BASE}/dosenKelas/getKelas?${params.toString()}`,
          {
            method: "GET",
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
            "Gagal memuat kelas dosen.";
          throw new Error(msg);
        }
        const payload = await res.json();
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.kelas)
          ? payload.kelas
          : [];

        const parsed = list
          .map((k) => ({
            id: k?.idKelas || k?.kodeKelas || k?.id || "",
            label: k?.namaKelas || k?.kelas || k?.label || "",
          }))
          .filter((x) => x.id && x.label);

        setKelasOptions(parsed);
        setHeader((h) =>
          parsed.some((k) => k.id === h.idKelas) ? h : { ...h, idKelas: "" }
        );
      } catch (e) {
        console.error(e);
        setKelasErr(e?.message || "Gagal memuat kelas dosen.");
        setKelasOptions([]);
        setHeader((h) => ({ ...h, idKelas: "" }));
        openError(e?.message);
      } finally {
        setKelasLoading(false);
      }
    },
    [API_BASE, tahunAjar, semester, dosenOptions]
  );

  // Re-fetch kelas saat idDosen/tahun/semester berubah
  useEffect(() => {
    if (header.idDosen) {
      fetchKelasByDosen(header.idDosen, tahunAjar, semester);
    } else {
      setKelasOptions([]);
      setHeader((h) => ({ ...h, idKelas: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [header.idDosen, tahunAjar, semester]);

  // isi otomatis nama asisten
  useEffect(() => {
    const nm = getCurrentUserName();
    if (nm && !header.asisten) setHeader((h) => ({ ...h, asisten: nm }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // Submit laporan
  // =========================
  const onSubmit = async (e) => {
    e.preventDefault();

    if (!labCode) return openError("LAB tidak ditemukan di URL.");
    if (!kodePraktikum)
      return openError("KODE praktikum tidak ditemukan di URL.");

    // Validasi → tampil via popup
    if (!header.tanggal) return openError("tanggal");
    if (!header.idDosen) return openError("idDosen");
    if (!header.idKelas) return openError("idKelas");
    if (!header.waktuMulai) return openError("waktu");

    // ✅ Foto wajib diisi (frontend)
    if (!fotoFile) return openError("foto");

    const dataAlat = rows
      .map((r) => ({
        idBarang: (r.idBarang || "").trim(),
        jumlahAkhir: Number.isFinite(Number(r.akhir)) ? Number(r.akhir) : 0,
      }))
      .filter((x) => x.idBarang);

    if (dataAlat.length === 0) return openError("dataAlat");

    const waktuWithSeconds =
      header.waktuMulai.length === 5
        ? `${header.waktuMulai}:00`
        : header.waktuMulai;

    const fd = new FormData();
    fd.append("waktu", waktuWithSeconds);
    fd.append("idKelas", header.idKelas);
    fd.append("tanggal", header.tanggal);
    fd.append("idDosen", header.idDosen);
    fd.append("tindakLanjut", tindakLanjut || "");
    fd.append("asisten", header.asisten || getCurrentUserName());
    if (fotoFile) fd.append("photoPraktikum", fotoFile);
    fd.append("dataAlat", JSON.stringify(dataAlat));

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/praktikum/addPraktikum/${labCode}/${kodePraktikum}`,
        {
          method: "POST",
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: fd,
        }
      );

      if (!res.ok) {
        let text = "";
        try {
          text = await res.text();
        } catch {}
        throw new Error(text || `HTTP ${res.status}`);
      }

      alert("Laporan praktikum berhasil dikirim.");
      setTindakLanjut("");
      setFotoFile(null);
      setFotoPreview("");
      setRows((prev) => prev.map((r) => ({ ...r, akhir: "", kerusakan: "" })));
    } catch (err) {
      console.error(err);
      openError(err?.message || "Gagal menyimpan laporan.");
    }
  };

  const labName = LAB_NAMES[labCode] || labCode || "-";
  const praktikumName = PRAKTIKUM_NAMES[kodePraktikum] || kodePraktikum || "-";

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="min-h-screen text-slate-100 py-8 lg:ml-56 mt-16 sm:mt-6"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">Form Pengecekan Lab Hardware</h1>
          <p className="block text-sm font-medium mb-5">
            Praktikum {praktikumName} —{" "}
            <span className="opacity-80">
              Lab: {labName} | Praktikum: {praktikumName}
            </span>
          </p>

          {(loadingPrefill || prefillError) && (
            <div className="mb-4 text-xs">
              {loadingPrefill && (
                <span className="text-slate-400">
                  Memuat data awal dari lab…
                </span>
              )}
              {prefillError && (
                <span className="text-red-300">Error: {prefillError}</span>
              )}
            </div>
          )}

          {/* Header form */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium mb-1">
                Hari / Tanggal
              </label>
              <input
                type="date"
                value={header.tanggal}
                onChange={(e) =>
                  setHeader((h) => ({ ...h, tanggal: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Tahun Ajar
              </label>
              <input
                type="text"
                value={tahunAjar}
                onChange={(e) => setTahunAjar(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-600"
                placeholder="2025"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-600"
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>

            {/* Dosen */}
            <div>
              <label className="block text-sm font-medium mb-1">Dosen</label>
              <select
                value={header.idDosen}
                onChange={(e) =>
                  setHeader((h) => ({
                    ...h,
                    idDosen: e.target.value,
                    idKelas: "",
                  }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-600"
              >
                <option value="">
                  {dosenLoading ? "Memuat dosen…" : "Pilih dosen…"}
                </option>
                {dosenOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
              {(dosenErr || dosenLoading) && (
                <p className="mt-1 text-[11px] text-slate-400">
                  {dosenErr ? (
                    <span className="text-red-300">Error: {dosenErr}</span>
                  ) : (
                    " "
                  )}
                </p>
              )}
            </div>

            {/* Kelas */}
            <div>
              <label className="block text-sm font-medium mb-1">Kelas</label>
              <select
                value={header.idKelas}
                onChange={(e) =>
                  setHeader((h) => ({ ...h, idKelas: e.target.value }))
                }
                disabled={!header.idDosen}
                className={`w-full rounded-lg border ${
                  header.idDosen
                    ? "border-slate-700"
                    : "border-slate-800 opacity-60"
                } bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-600`}
              >
                <option value="">
                  {!header.idDosen
                    ? "Pilih dosen dulu"
                    : kelasLoading
                    ? "Memuat kelas…"
                    : "Pilih kelas…"}
                </option>
                {kelasOptions.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
              {(kelasErr || kelasLoading) && (
                <p className="mt-1 text-[11px]">
                  {kelasErr ? (
                    <span className="text-red-300">Error: {kelasErr}</span>
                  ) : (
                    " "
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Asisten & Waktu */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Asisten</label>
              <input
                type="text"
                value={header.asisten}
                readOnly
                title="Diisi otomatis dari akun yang login"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-600"
                placeholder="Nama asisten (otomatis)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Waktu (mulai)
              </label>
              <input
                type="time"
                value={header.waktuMulai}
                onChange={(e) =>
                  setHeader((h) => ({ ...h, waktuMulai: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Waktu selesai
              </label>
              <input
                type="time"
                value={header.waktuSelesai}
                onChange={(e) =>
                  setHeader((h) => ({ ...h, waktuSelesai: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-600"
              />
            </div>
          </div>

          {/* Tabel Kelengkapan */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800">
                <tr className="text-left">
                  <th className="px-4 py-3 w-12 text-slate-200">No</th>
                  <th className="px-4 py-3 text-slate-200">Kelengkapan</th>
                  <th className="px-4 py-3 w-40 text-slate-200">ID Barang</th>
                  <th className="px-4 py-3 w-28 text-slate-200">Jumlah Awal</th>
                  <th className="px-4 py-3 w-28 text-slate-200">
                    Jumlah Akhir
                  </th>
                  <th className="px-4 py-3 w-64 text-slate-200">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.id} className="border-t border-slate-800">
                    <td className="px-4 py-2">{idx + 1}</td>
                    <td className="px-4 py-2">{r.name}</td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={r.idBarang}
                        onChange={(e) =>
                          handleRowChange(r.id, "idBarang", e.target.value)
                        }
                        className="w-full rounded-md border border-slate-700 bg-slate-950 text-slate-100 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-slate-600"
                        placeholder="BRNG00011"
                        disabled
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={0}
                        value={r.awal}
                        onChange={(e) =>
                          handleRowChange(r.id, "awal", e.target.value)
                        }
                        className="w-full rounded-md border border-slate-700 bg-slate-950 text-slate-100 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-slate-600"
                        placeholder="auto dari data lab"
                        disabled
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={0}
                        value={r.akhir}
                        onChange={(e) =>
                          handleRowChange(r.id, "akhir", e.target.value)
                        }
                        className="w-full rounded-md border border-slate-700 bg-slate-950 text-slate-100 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-slate-600"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={r.kerusakan}
                        onChange={(e) =>
                          handleRowChange(r.id, "kerusakan", e.target.value)
                        }
                        className="w-full rounded-md border border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-400 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-slate-600"
                        placeholder="cth: Komputer mati total"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tindak lanjut & Foto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Tindak lanjut
              </label>
              <textarea
                rows={4}
                value={tindakLanjut}
                onChange={(e) => setTindakLanjut(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-600"
                placeholder="Rencana perbaikan / penggantian…"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Foto Praktikum
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onPickFoto}
                className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-slate-100
                           file:hover:bg-slate-700 hover:cursor-pointer text-slate-300"
              />
              {fotoPreview && (
                <div className="mt-3">
                  <div className="text-xs text-slate-400 mb-1">Preview:</div>
                  <img
                    src={fotoPreview}
                    alt="Preview"
                    className="h-40 w-auto rounded-lg border border-slate-800 object-contain bg-slate-900"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={clearFoto}
                      className="rounded-2xl px-3 py-1.5 text-xs font-medium ring-1 ring-slate-700 hover:bg-slate-900"
                    >
                      Hapus Foto
                    </button>
                  </div>
                </div>
              )}
              <p className="mt-2 text-xs text-slate-400">
                Field dikirim sebagai <code>photoPraktikum</code> (multipart).
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center gap-3">
            <button
              type="submit"
              className="rounded-2xl px-5 py-2.5 text-sm font-medium shadow-sm bg-white text-slate-900 hover:opacity-90"
            >
              Simpan
            </button>
          </div>
        </div>
      </form>

      {/* ===== Error Modal ===== */}
      {showError && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
          onKeyDown={(e) => e.key === "Escape" && closeError()}
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closeError}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-2xl border border-red-400/20 bg-slate-900 p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-red-300">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm1 14h-2v-2h2v2Zm0-4h-2V6h2v6Z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-red-200">
                  Terjadi Kesalahan
                </h3>
                <p className="mt-1 text-sm text-slate-200 leading-relaxed">
                  {errorMsg}
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeError}
                    className="rounded-xl px-3 py-1.5 text-sm font-medium ring-1 ring-slate-600 hover:bg-slate-800"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
