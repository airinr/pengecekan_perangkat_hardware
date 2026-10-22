import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { apiGet, apiUpload } from "@/lib/apiClient";
import {
  FORM_ITEMS_BY_CODE,
  labCodeFromShort,
  labNameFromCode,
  praktikumCodeFromSlug,
  praktikumNameFromCode,
} from "@/features/praktikum/constants";
import {
  getCurrentUserName,
  getNowTime,
  getTodayDate,
  humanizeError,
} from "@/features/praktikum/helpers";
import { showErrorAlert, showSuccessAlert } from "@/lib/swal";

export default function PraktikumForm() {
  const { labId, slug } = useParams();
  const labCode = labCodeFromShort(labId);
  const kodePraktikum = praktikumCodeFromSlug(slug);

  if (!labCode || !kodePraktikum) {
    return <Navigate to="/dashboard_asisten" replace />;
  }
  return (
    <PraktikumFormView
      key={`${labCode}-${kodePraktikum}`}
      labCode={labCode}
      kodePraktikum={kodePraktikum}
    />
  );
}

function PraktikumFormView({ labCode, kodePraktikum }) {
  const defaultItems = useMemo(
    () => FORM_ITEMS_BY_CODE[kodePraktikum] ?? [],
    [kodePraktikum],
  );

  const [header, setHeader] = useState({
    tanggal: getTodayDate(),
    idDosen: "",
    idKelas: "",
    asisten: getCurrentUserName(),
    waktuMulai: getNowTime(),
    waktuSelesai: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const openError = (msg) => {
    showErrorAlert("Laporan Belum Lengkap", humanizeError(msg));
  };

  const [tahunAjar, setTahunAjar] = useState(() =>
    String(new Date().getFullYear()),
  );
  const [semester, setSemester] = useState("Ganjil");

  const [rows, setRows] = useState(() =>
    defaultItems.map((name, i) => ({
      id: i + 1,
      name,
      idBarang: "",
      awal: "",
      akhir: "",
      kerusakan: "",
    })),
  );
  const [tindakLanjut, setTindakLanjut] = useState("");

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
      prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)),
    );
  };

  // Helper untuk ubah jumlah akhir dengan stepper
  const handleStepCount = (id, delta) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const current = Number(r.akhir !== "" ? r.akhir : r.awal || 0);
        const next = Math.max(0, current + delta);
        return { ...r, akhir: next };
      }),
    );
  };

  // Quick Action Mobile: Set semua jumlah akhir = jumlah awal
  const handleSetAllComplete = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        akhir: r.awal !== "" ? r.awal : "",
        kerusakan: "",
      })),
    );
  };

  // Prefill data lab dari server
  const [loadingPrefill, setLoadingPrefill] = useState(false);
  const [prefillError, setPrefillError] = useState("");

  const fetchDatalab = useCallback(async () => {
    if (!labCode) return;
    setLoadingPrefill(true);
    setPrefillError("");
    try {
      const payload = await apiGet(`/datalab/getdatalab/${labCode}`);
      const list = Array.isArray(payload?.data) ? payload.data : [];
      const nameToInfo = new Map();
      list.forEach((it) => {
        const nama = (it?.barangModel?.namaBarang || "").trim().toLowerCase();
        const idBarang = (it?.idBarang || "").trim();
        const jn = Number(it?.jumlah ?? 0);
        if (nama && idBarang) nameToInfo.set(nama, { idBarang, jn });
      });
      setRows((prev) =>
        prev.map((r) => {
          const info = nameToInfo.get(r.name.trim().toLowerCase());
          if (!info) return r;
          return { ...r, idBarang: info.idBarang, awal: info.jn };
        }),
      );
    } catch (err) {
      setPrefillError(err?.message || "Gagal memuat data lab.");
      openError(err?.message);
    } finally {
      setLoadingPrefill(false);
    }
  }, [labCode]);

  useEffect(() => {
    fetchDatalab();
  }, [fetchDatalab]);

  // Fetch daftar dosen
  const [dosenOptions, setDosenOptions] = useState([]);
  const [dosenLoading, setDosenLoading] = useState(false);
  const [dosenErr, setDosenErr] = useState("");

  const fetchDosen = useCallback(async () => {
    setDosenLoading(true);
    setDosenErr("");
    try {
      const payload = await apiGet("/dosen");
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
      const parsed = list
        .map((d) => ({
          id: String(d?.idDosen || d?.kodeDosen || d?.id || d?.kode || "").trim(),
          label: String(
            d?.namaDosen || d?.nama || d?.name || d?.fullName || "",
          ).trim(),
        }))
        .filter((x) => x.id && x.label);
      const uniq = Array.from(new Map(parsed.map((x) => [x.id, x])).values()).sort(
        (a, b) => a.label.localeCompare(b.label),
      );
      setDosenOptions(uniq);
    } catch (e) {
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

  // Fetch kelas per dosen
  const [kelasOptions, setKelasOptions] = useState([]);
  const [kelasLoading, setKelasLoading] = useState(false);
  const [kelasErr, setKelasErr] = useState("");

  const fetchKelasByDosen = useCallback(
    async (idDosen) => {
      if (!idDosen) {
        setKelasOptions([]);
        setHeader((h) => ({ ...h, idKelas: "" }));
        return;
      }
      setKelasLoading(true);
      setKelasErr("");
      try {
        const params = new URLSearchParams({
          namaDosen: dosenOptions.find((d) => d.id === idDosen)?.label || "",
          tahunAjar,
          semester,
        });
        const payload = await apiGet(`/dosenKelas/getKelas?${params.toString()}`);
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
        const parsed = list
          .map((k) => ({
            id: String(k?.idKelas || k?.kodeKelas || k?.id || "").trim(),
            label: String(k?.namaKelas || k?.kelas || k?.label || "").trim(),
          }))
          .filter((x) => x.id && x.label);
        setKelasOptions(parsed);
        setHeader((h) =>
          parsed.some((k) => k.id === h.idKelas) ? h : { ...h, idKelas: "" },
        );
      } catch (e) {
        setKelasErr(e?.message || "Gagal memuat kelas dosen.");
        setKelasOptions([]);
        setHeader((h) => ({ ...h, idKelas: "" }));
        openError(e?.message);
      } finally {
        setKelasLoading(false);
      }
    },
    [tahunAjar, semester, dosenOptions],
  );

  useEffect(() => {
    if (header.idDosen) fetchKelasByDosen(header.idDosen);
    else {
      setKelasOptions([]);
      setHeader((h) => ({ ...h, idKelas: "" }));
    }
  }, [header.idDosen, tahunAjar, semester, fetchKelasByDosen]);

  useEffect(() => {
    const nm = getCurrentUserName();
    if (nm) setHeader((h) => (h.asisten ? h : { ...h, asisten: nm }));
  }, []);

  // Ringkasan status item praktikum
  const stats = useMemo(() => {
    let filled = 0;
    let complete = 0;
    let problem = 0;
    rows.forEach((r) => {
      if (r.akhir !== "") {
        filled++;
        const awalNum = Number(r.awal || 0);
        const akhirNum = Number(r.akhir);
        if (akhirNum >= awalNum && !r.kerusakan?.trim()) {
          complete++;
        } else {
          problem++;
        }
      }
    });
    return {
      total: rows.length,
      filled,
      complete,
      problem,
      isAllFilled: filled === rows.length,
    };
  }, [rows]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!labCode) return openError("LAB tidak ditemukan di URL.");
    if (!kodePraktikum) return openError("KODE praktikum tidak ditemukan di URL.");
    if (!header.tanggal) return openError("tanggal");
    if (!header.idDosen) return openError("Pilih dosen pembina praktikum.");
    if (!header.idKelas) return openError("Pilih kelas praktikum.");
    if (!header.waktuMulai) return openError("Isi waktu mulai praktikum.");
    if (!tindakLanjut.trim())
      return openError("Tindak lanjut wajib diisi sebelum mengirim laporan.");

    const adaCatatanKurang = rows.some(
      (r) =>
        r.idBarang &&
        r.akhir !== "" &&
        Number(r.akhir) !== Number(r.awal) &&
        !r.kerusakan?.trim(),
    );
    if (adaCatatanKurang) return openError("catatan");

    if (!fotoFile)
      return openError("Foto dokumentasi praktikum wajib diunggah.");

    const dataAlat = rows
      .map((r) => ({
        idBarang: (r.idBarang || "").trim(),
        jumlahAkhir: Number.isFinite(Number(r.akhir)) ? Number(r.akhir) : 0,
        catatan: r.kerusakan || "",
      }))
      .filter((x) => x.idBarang);

    if (dataAlat.length === 0)
      return openError(
        "Tidak ada data barang yang terhubung. Tunggu hingga data lab selesai dimuat.",
      );

    const waktuWithSeconds =
      header.waktuMulai.length === 5
        ? `${header.waktuMulai}:00`
        : header.waktuMulai;

    const fd = new FormData();
    fd.append("waktu", waktuWithSeconds);
    fd.append("idKelas", header.idKelas);
    fd.append("tanggal", header.tanggal);
    fd.append("idDosen", header.idDosen);
    fd.append("tindakLanjut", tindakLanjut.trim());
    fd.append("asisten", header.asisten || getCurrentUserName());
    if (fotoFile) fd.append("photoPraktikum", fotoFile);
    fd.append("dataAlat", JSON.stringify(dataAlat));

    setSubmitting(true);
    try {
      await apiUpload(`/praktikum/addPraktikum/${labCode}/${kodePraktikum}`, fd);
      await showSuccessAlert(
        "Laporan Berhasil Terkirim!",
        "Data pemeriksaan praktikum telah tersimpan di sistem.",
      );
      setTindakLanjut("");
      setFotoFile(null);
      setFotoPreview("");
      setRows((prev) => prev.map((r) => ({ ...r, akhir: "", kerusakan: "" })));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      openError(err?.message || "Gagal menyimpan laporan praktikum.");
    } finally {
      setSubmitting(false);
    }
  };

  const praktikumName = praktikumNameFromCode(kodePraktikum);
  const labName = labNameFromCode(labCode);

  return (
    <div className="min-h-screen text-slate-100 pb-28 pt-16 sm:pt-6 lg:ml-56">
      <form onSubmit={onSubmit} className="mx-auto max-w-5xl px-3 sm:px-6 lg:px-8">

        {/* Header Title Section */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600/30 text-blue-300 border border-blue-500/30">
              {labName}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-600/30 text-purple-300 border border-purple-500/30">
              {praktikumName}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Form Pelaporan Praktikum
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Pengecekan fisik perangkat hardware setelah sesi praktikum selesai.
          </p>

          {(loadingPrefill || prefillError) && (
            <div className="mt-2 text-xs">
              {loadingPrefill && (
                <span className="text-blue-300 flex items-center gap-1">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Menyelaraskan data stok lab…
                </span>
              )}
              {prefillError && (
                <span className="text-red-300">Gagal sinkron data: {prefillError}</span>
              )}
            </div>
          )}
        </div>

        {/* 1. KARTU INFORMASI PRAKTIKUM (Mobile-Friendly Form Fields) */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-5 shadow-sm backdrop-blur mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Informasi Praktikum
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Hari / Tanggal */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Hari / Tanggal <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={header.tanggal}
                onChange={(e) => setHeader((h) => ({ ...h, tanggal: e.target.value }))}
                className="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tahun Ajar */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Tahun Ajar <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={tahunAjar}
                onChange={(e) => setTahunAjar(e.target.value)}
                placeholder="2026"
                className="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Semester */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Semester <span className="text-rose-400">*</span>
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>

            {/* Dosen Pembina */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Dosen Pembina <span className="text-rose-400">*</span>
              </label>
              <select
                value={header.idDosen}
                onChange={(e) =>
                  setHeader((h) => ({ ...h, idDosen: e.target.value, idKelas: "" }))
                }
                className="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{dosenLoading ? "Memuat dosen…" : "— Pilih Dosen —"}</option>
                {dosenOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
              {dosenErr && (
                <p className="mt-1 text-[11px] text-rose-300">Error: {dosenErr}</p>
              )}
            </div>

            {/* Kelas */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Kelas <span className="text-rose-400">*</span>
              </label>
              <select
                value={header.idKelas}
                onChange={(e) => setHeader((h) => ({ ...h, idKelas: e.target.value }))}
                disabled={!header.idDosen}
                className={`w-full h-11 rounded-xl border ${header.idDosen ? "border-slate-700 bg-slate-950" : "border-slate-800 bg-slate-900/50 opacity-60"
                  } px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">
                  {!header.idDosen
                    ? "Pilih dosen dulu"
                    : kelasLoading
                      ? "Memuat kelas…"
                      : "— Pilih Kelas —"}
                </option>
                {kelasOptions.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
              {kelasErr && (
                <p className="mt-1 text-[11px] text-rose-300">Error: {kelasErr}</p>
              )}
            </div>

            {/* Asisten */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nama Asisten
              </label>
              <input
                type="text"
                value={header.asisten}
                readOnly
                title="Diisi otomatis dari akun login"
                className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950/70 text-slate-400 px-3 text-sm cursor-not-allowed"
                placeholder="Nama asisten (Terisi Otomatis)"
              />
            </div>

            {/* Waktu Mulai */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Waktu Mulai <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setHeader((h) => ({ ...h, waktuMulai: getNowTime() }))
                  }
                  className="text-[11px] text-blue-400 hover:text-blue-300 underline"
                >
                  Set Sekarang
                </button>
              </div>
              <input
                type="time"
                value={header.waktuMulai}
                onChange={(e) => setHeader((h) => ({ ...h, waktuMulai: e.target.value }))}
                className="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Waktu Selesai */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Waktu Selesai
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setHeader((h) => ({ ...h, waktuSelesai: getNowTime() }))
                  }
                  className="text-[11px] text-blue-400 hover:text-blue-300 underline"
                >
                  Set Sekarang
                </button>
              </div>
              <input
                type="time"
                value={header.waktuSelesai}
                onChange={(e) => setHeader((h) => ({ ...h, waktuSelesai: e.target.value }))}
                className="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 2. SECTION DAFTAR PERANGKAT / KELENGKAPAN */}
        <div className="mb-6">
          {/* Header Section Peralatan + Tombol Pintas Set Lengkap */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                Pemeriksaan Perangkat ({rows.length} Item)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pastikan jumlah akhir dihitung teliti sebelum praktikan meninggalkan lab.
              </p>
            </div>

            {/* Tombol Pintas Cepat (Mobile lifesaver!) */}
            <button
              type="button"
              onClick={handleSetAllComplete}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md active:scale-95 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>Isi Semua Lengkap (Sama dg Awal)</span>
            </button>
          </div>

          {/* ========================================================
              MOBILE VIEW: Card-Based Layout (Mudah disentuh & cepat)
             ======================================================== */}
          <div className="space-y-3 md:hidden">
            {rows.map((r, idx) => {
              const awalNum = Number(r.awal || 0);
              const isSet = r.akhir !== "";
              const akhirNum = isSet ? Number(r.akhir) : null;
              const isDiff = isSet && akhirNum < awalNum;
              const isComplete = isSet && akhirNum >= awalNum && !r.kerusakan?.trim();

              return (
                <div
                  key={r.id}
                  className={`rounded-2xl border p-4 transition-all shadow-sm ${isDiff
                      ? "border-rose-500/50 bg-rose-950/20"
                      : isComplete
                        ? "border-emerald-500/30 bg-slate-900/90"
                        : "border-white/10 bg-slate-900/80"
                    }`}
                >
                  {/* Baris Nama & Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-[11px] font-bold text-slate-300 grid place-items-center">
                          {idx + 1}
                        </span>
                        <h3 className="text-base font-semibold text-white">
                          {r.name}
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono mt-0.5 block pl-7">
                        {r.idBarang || "—"}
                      </span>
                    </div>

                    {/* Status Badge */}
                    {isDiff ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40">
                        ⚠ Selisih {akhirNum - awalNum}
                      </span>
                    ) : isComplete ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40">
                        ✓ Lengkap
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-400">
                        Belum Diisi
                      </span>
                    )}
                  </div>

                  {/* Kontrol Stepper & Input Jumlah */}
                  <div className="bg-slate-950/60 rounded-xl p-3 border border-white/5 mb-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span>
                        Stok Awal: <strong className="text-white text-sm">{r.awal !== "" ? r.awal : "—"}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRowChange(r.id, "akhir", r.awal)}
                        disabled={r.awal === ""}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium underline disabled:opacity-50"
                      >
                        Sama dg Awal
                      </button>
                    </div>

                    {/* Stepper Touch Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStepCount(r.id, -1)}
                        className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-lg font-bold flex items-center justify-center active:scale-90 transition border border-white/10"
                        aria-label="Kurangi"
                      >
                        -
                      </button>

                      <input
                        type="number"
                        min={0}
                        value={r.akhir}
                        onChange={(e) => handleRowChange(r.id, "akhir", e.target.value)}
                        placeholder={r.awal !== "" ? String(r.awal) : "0"}
                        className="flex-1 h-11 text-center rounded-xl border border-slate-700 bg-slate-900 text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <button
                        type="button"
                        onClick={() => handleStepCount(r.id, 1)}
                        className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-lg font-bold flex items-center justify-center active:scale-90 transition border border-white/10"
                        aria-label="Tambah"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Input Catatan / Kerusakan (Di-highlight jika ada masalah) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-300">
                        Catatan Kerusakan / Keterangan{" "}
                        {isDiff && <span className="text-rose-400 font-bold">*</span>}
                      </label>
                      {r.kerusakan && (
                        <button
                          type="button"
                          onClick={() => handleRowChange(r.id, "kerusakan", "")}
                          className="text-[11px] text-slate-400 hover:text-white"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={r.kerusakan}
                      onChange={(e) => handleRowChange(r.id, "kerusakan", e.target.value)}
                      placeholder={
                        isDiff
                          ? "Wajib dijelaskan: cth. hilang 1 unit / port rusak"
                          : "Catatan opsional (cth. kondisi baik)"
                      }
                      className={`w-full rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${isDiff
                          ? "border border-rose-500/70 bg-rose-950/40 focus:ring-rose-500"
                          : "border border-slate-800 bg-slate-950 focus:ring-blue-500"
                        }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================
              DESKTOP VIEW: Tabel Lebar Responsif
             ======================================================== */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/80 shadow-sm backdrop-blur">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800/80 text-left">
                <tr>
                  <th className="px-4 py-3.5 w-12 text-slate-300 font-semibold">#</th>
                  <th className="px-4 py-3.5 text-slate-300 font-semibold">Kelengkapan</th>
                  <th className="px-4 py-3.5 w-36 text-slate-300 font-semibold">ID Barang</th>
                  <th className="px-4 py-3.5 w-28 text-slate-300 font-semibold">Stok Awal</th>
                  <th className="px-4 py-3.5 w-40 text-slate-300 font-semibold">Jumlah Akhir</th>
                  <th className="px-4 py-3.5 text-slate-300 font-semibold">Catatan Kerusakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((r, idx) => {
                  const awalNum = Number(r.awal || 0);
                  const isSet = r.akhir !== "";
                  const isDiff = isSet && Number(r.akhir) < awalNum;

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-white/5 transition ${isDiff ? "bg-rose-950/20" : ""
                        }`}
                    >
                      <td className="px-4 py-3 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-white">{r.name}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {r.idBarang || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200">
                          {r.awal !== "" ? r.awal : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            value={r.akhir}
                            onChange={(e) => handleRowChange(r.id, "akhir", e.target.value)}
                            placeholder={r.awal !== "" ? String(r.awal) : "0"}
                            className="w-24 h-9 text-center rounded-lg border border-slate-700 bg-slate-950 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRowChange(r.id, "akhir", r.awal)}
                            title="Set sama dengan jumlah awal"
                            className="px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            =
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={r.kerusakan}
                          onChange={(e) => handleRowChange(r.id, "kerusakan", e.target.value)}
                          placeholder={isDiff ? "Wajib diisi jika ada selisih" : "Keterangan opsional"}
                          className={`w-full rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${isDiff
                              ? "border border-rose-500 bg-rose-950/40 focus:ring-rose-500"
                              : "border border-slate-700 bg-slate-950 focus:ring-blue-500"
                            }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. TINDAK LANJUT & FOTO DOKUMENTASI (Mobile First) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Tindak Lanjut Card */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-5 shadow-sm backdrop-blur">
            <label className="block text-sm font-semibold text-slate-200 mb-1">
              Tindak Lanjut <span className="text-rose-400">*</span>
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Tulis rencana tindakan atau rekomendasi perbaikan untuk lab.
            </p>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                "Semua alat lengkap & kondisi baik",
                "Perlu penggantian kabel minggu depan",
                "1 unit PC perlu pengecekan lanjutan",
              ].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setTindakLanjut(sug)}
                  className="rounded-full bg-slate-800 hover:bg-slate-700 border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 active:scale-95 transition"
                >
                  + {sug}
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              value={tindakLanjut}
              onChange={(e) => setTindakLanjut(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contoh: Seluruh alat telah diperiksa dan disimpan kembali di lemari lab."
            />
          </div>

          {/* Foto Dokumentasi Card */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-5 shadow-sm backdrop-blur">
            <label className="block text-sm font-semibold text-slate-200 mb-1">
              Foto Praktikum <span className="text-rose-400">*</span>
            </label>
            <p className="text-xs text-slate-400 mb-3">
              Ambil foto dokumentasi praktikan atau kondisi perangkat di lab.
            </p>

            {!fotoPreview ? (
              <label className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/70 transition group">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 grid place-items-center mb-2 group-hover:scale-110 transition">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-200 text-center">
                  Ketuk untuk Ambil Foto / Pilih Gambar
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Mendukung kamera HP & upload galeri
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onPickFoto}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="rounded-xl border border-white/10 bg-slate-950 p-3">
                <img
                  src={fotoPreview}
                  alt="Dokumentasi Praktikum"
                  className="h-44 w-full rounded-lg object-contain bg-black/40"
                />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400 truncate max-w-[200px]">
                    {fotoFile?.name || "Foto terpilih"}
                  </span>
                  <div className="flex gap-2">
                    <label className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer">
                      Ganti Foto
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={onPickFoto}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={clearFoto}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600/20 text-rose-300 hover:bg-rose-600/30"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            STICKY BOTTOM SUBMIT BAR (Mobile & Desktop)
           ======================================================== */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-t border-white/10 py-3 px-4 sm:px-6 lg:pl-64">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            {/* Status Checklist ringkas */}
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium ${stats.problem > 0
                    ? "bg-amber-500/20 text-amber-300"
                    : stats.isAllFilled
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-slate-800 text-slate-400"
                  }`}
              >
                {stats.problem > 0
                  ? `⚠ ${stats.problem} Perlu Perhatian`
                  : stats.isAllFilled
                    ? "✓ Semua Lengkap"
                    : `${stats.filled}/${stats.total} Item Terisi`}
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 shadow-lg active:scale-95 transition"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span>Mengirim Laporan…</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <span>Kirim Laporan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
