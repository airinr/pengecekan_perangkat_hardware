/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const DEFAULT_ITEMS = [
  "Crimping Tools",
  "LAN Tester",
  "Pengupas Kabel",
  "Gunting",
];

const API_BASE = import.meta.env.VITE_API_URL || "";
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

// helper: ambil nama user dari localStorage
const getCurrentUserName = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u?.username || u?.name || "";
  } catch {
    return "";
  }
};

export default function FormJarkom() {
  // Ambil dari query: ?kode=PRTKxxxxx&lab=LABxxxxx
  const [searchParams] = useSearchParams();
  const labCode = searchParams.get("lab") || "";
  const kodePraktikum = searchParams.get("kode") || "";

  const [header, setHeader] = useState({
    tanggal: "",
    dosen: "",
    kelas: "",
    asisten: getCurrentUserName(), // <-- auto dari akun login
    waktuMulai: "",
    waktuSelesai: "",
  });

  const [rows, setRows] = useState(
    DEFAULT_ITEMS.map((name, i) => ({
      id: i + 1,
      name,
      idBarang: "", // akan diisi dari datalab
      awal: "", // jumlahNormal dari datalab
      akhir: "",
      kerusakan: "",
    }))
  );

  const [tindakLanjut, setTindakLanjut] = useState("");

  // Foto praktikum
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState("");

  const onPickTtd = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };
  const clearTtd = () => {
    setFotoFile(null);
    setFotoPreview("");
  };

  const handleRowChange = (id, key, value) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: value } : r))
    );
  };

  // ===== Prefill dari /datalab/getdatalab/{lab} =====
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

      // Peta namaBarang(lowercase) -> { idBarang, awal } | awal = jumlahNormal
      const nameToInfo = new Map();
      list.forEach((it) => {
        const nama = (it?.barangModel?.namaBarang || "").trim().toLowerCase();
        const idBarang = (it?.idBarang || "").trim();
        const jn = Number(it?.jumlahNormal ?? 0);
        if (nama && idBarang)
          nameToInfo.set(nama, {
            idBarang,
            awal: Number.isFinite(jn) ? jn : 0,
          });
      });

      setRows((prev) =>
        prev.map((r) => {
          const info = nameToInfo.get(r.name.trim().toLowerCase());
          if (!info) return r;
          return { ...r, idBarang: info.idBarang, awal: info.awal };
        })
      );
    } catch (err) {
      console.error(err);
      setPrefillError(err?.message || "Gagal memuat data lab.");
    } finally {
      setLoadingPrefill(false);
    }
  }, [labCode]);

  useEffect(() => {
    fetchDatalab();
  }, [fetchDatalab]);

  // Sinkronkan nama asisten dari localStorage saat mount jika state kosong
  useEffect(() => {
    const nm = getCurrentUserName();
    if (nm && !header.asisten) {
      setHeader((h) => ({ ...h, asisten: nm }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Submit ke /praktikum/addPraktikum/{lab}/{kode} =====
  const onSubmit = async (e) => {
    e.preventDefault();

    if (!labCode) return alert("Kode lab (lab) tidak ditemukan di URL.");
    if (!kodePraktikum)
      return alert("Kode praktikum (kode) tidak ditemukan di URL.");
    if (!header.tanggal) return alert("Tanggal wajib diisi.");
    if (!header.kelas) return alert("Kelas wajib diisi.");
    if (!header.dosen) return alert("Dosen wajib diisi.");
    if (!header.waktuMulai) return alert("Waktu (mulai) wajib diisi.");

    // dataAlat: gunakan key jumlahAkhir (sesuai backend)
    const dataAlat = rows
      .map((r) => ({
        idBarang: (r.idBarang || "").trim(),
        jumlahAkhir: Number.isFinite(Number(r.akhir)) ? Number(r.akhir) : 0,
      }))
      .filter((x) => x.idBarang); // idBarang wajib ada, jumlahAkhir boleh 0

    if (dataAlat.length === 0) {
      alert("Isi minimal 1 ID Barang (BRNG...) dan jumlah akhirnya.");
      return;
    }

    const fd = new FormData();
    fd.append("waktu", header.waktuMulai);
    fd.append("kelas", header.kelas);
    fd.append("tanggal", header.tanggal);
    fd.append("dosen", header.dosen);
    fd.append("tindakLanjut", tindakLanjut || "");
    fd.append("asisten", header.asisten || getCurrentUserName()); // <-- kirimkan asisten
    if (fotoFile) fd.append("photoPraktikum", fotoFile);
    fd.append("dataAlat", JSON.stringify(dataAlat));

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/praktikum/addPraktikum/${labCode}/${kodePraktikum}`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: fd,
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Gagal menyimpan laporan.");
      }

      alert("Laporan praktikum berhasil dikirim.");
      // reset ringan
      setTindakLanjut("");
      setFotoFile(null);
      setFotoPreview("");
      setRows((prev) => prev.map((r) => ({ ...r, akhir: "", kerusakan: "" })));
    } catch (err) {
      console.error(err);
      alert(err?.message || "Gagal menyimpan laporan.");
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="min-h-screen text-slate-100 py-8 lg:ml-56 lg:pl-5"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold">Form Pengecekan Lab Hardware</h1>
        <p className="block text-sm font-medium mb-5">
          Praktikum Jaringan Komputer —{" "}
          <span className="opacity-80">
            Lab: {labCode || "-"} | Kode: {kodePraktikum || "-"}
          </span>
        </p>

        {(loadingPrefill || prefillError) && (
          <div className="mb-4 text-xs">
            {loadingPrefill && (
              <span className="text-slate-400">Memuat data awal dari lab…</span>
            )}
            {prefillError && (
              <span className="text-red-300">Error: {prefillError}</span>
            )}
          </div>
        )}

        {/* Header form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
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
            <label className="block text-sm font-medium mb-1">Dosen</label>
            <input
              type="text"
              value={header.dosen}
              onChange={(e) =>
                setHeader((h) => ({ ...h, dosen: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-600"
              placeholder="cth: Pak Budi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Kelas</label>
            <input
              type="text"
              value={header.kelas}
              onChange={(e) =>
                setHeader((h) => ({ ...h, kelas: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-600"
              placeholder="cth: ARS1-S1"
            />
          </div>

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
        </div>

        {/* Waktu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              Waktu Mulai
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
              Waktu Selesai
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
                <th className="px-4 py-3 w-40 text-slate-200">
                  ID Barang (BRNG…)
                </th>
                <th className="px-4 py-3 w-36 text-slate-200">Jumlah Awal</th>
                <th className="px-4 py-3 w-36 text-slate-200">Jumlah Akhir</th>
                <th className="px-4 py-3 w-64 text-slate-200">Kerusakan</th>
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
                      placeholder="auto dari jumlahNormal"
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
                      placeholder="cth: LAN Tester error"
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
              onChange={onPickTtd}
              className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-slate-100 file:hover:bg-slate-700 hover:cursor-pointer text-slate-300"
            />
            {fotoPreview && (
              <div className="mt-3">
                <div className="text-xs text-slate-400 mb-1">Preview:</div>
                <img
                  src={fotoPreview}
                  alt="Preview TTD"
                  className="h-40 w-auto rounded-lg border border-slate-800 object-contain bg-slate-900"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={clearTtd}
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
            className="rounded-2xl px-5 py-2.5 text-sm font-medium shadow-sm bg.white text-slate-900 hover:opacity-90"
          >
            Simpan
          </button>
        </div>
      </div>
    </form>
  );
}
