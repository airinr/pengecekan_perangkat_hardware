import { useCallback, useEffect, useState } from "react";
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

// Satu form generik pengganti 4 file form/*.jsx.
// Perbedaan tiap praktikum hanya DEFAULT_ITEMS (lihat FORM_ITEMS_BY_CODE).
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
  const defaultItems = FORM_ITEMS_BY_CODE[kodePraktikum] ?? [];

  const [header, setHeader] = useState({
    tanggal: getTodayDate(),
    idDosen: "",
    idKelas: "",
    asisten: getCurrentUserName(),
    waktuMulai: getNowTime(),
    waktuSelesai: "",
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [showError, setShowError] = useState(false);
  const openError = (msg) => {
    setErrorMsg(humanizeError(msg));
    setShowError(true);
  };
  const closeError = () => setShowError(false);

  const [tahunAjar, setTahunAjar] = useState("2025");
  const [semester, setSemester] = useState("Ganjil");

  const [rows, setRows] = useState(
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
      const uniq = Array.from(new Map(parsed.map((x) => [x.id, x])).values())
        .sort((a, b) => a.label.localeCompare(b.label));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [header.idDosen, tahunAjar, semester]);

  useEffect(() => {
    const nm = getCurrentUserName();
    if (nm) setHeader((h) => (h.asisten ? h : { ...h, asisten: nm }));
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!labCode) return openError("LAB tidak ditemukan di URL.");
    if (!kodePraktikum) return openError("KODE praktikum tidak ditemukan di URL.");
    if (!header.tanggal) return openError("tanggal");
    if (!header.idDosen) return openError("idDosen");
    if (!header.idKelas) return openError("idKelas");
    if (!header.waktuMulai) return openError("waktu");
    if (!tindakLanjut.trim()) return openError("Tindak Lanjut harus terisi");
    if (!fotoFile) return openError("foto");

    const dataAlat = rows
      .map((r) => ({
        idBarang: (r.idBarang || "").trim(),
        jumlahAkhir: Number.isFinite(Number(r.akhir)) ? Number(r.akhir) : 0,
        catatan: r.kerusakan || "",
      }))
      .filter((x) => x.idBarang);
    if (dataAlat.length === 0) return openError("dataAlat");

    const waktuWithSeconds =
      header.waktuMulai.length === 5 ? `${header.waktuMulai}:00` : header.waktuMulai;

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
      await apiUpload(`/praktikum/addPraktikum/${labCode}/${kodePraktikum}`, fd);
      alert("Laporan praktikum berhasil dikirim.");
      setTindakLanjut("");
      setFotoFile(null);
      setFotoPreview("");
      setRows((prev) => prev.map((r) => ({ ...r, akhir: "", kerusakan: "" })));
    } catch (err) {
      openError(err?.message || "Gagal menyimpan laporan.");
    }
  };

  const praktikumName = praktikumNameFromCode(kodePraktikum);

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
              Lab: {labNameFromCode(labCode)} | Praktikum: {praktikumName}
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

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium mb-1">Hari / Tanggal</label>
              <input
                type="date"
                value={header.tanggal}
                onChange={(e) => setHeader((h) => ({ ...h, tanggal: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tahun Ajar</label>
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
            <div>
              <label className="block text-sm font-medium mb-1">Dosen</label>
              <select
                value={header.idDosen}
                onChange={(e) =>
                  setHeader((h) => ({ ...h, idDosen: e.target.value, idKelas: "" }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-600"
              >
                <option value="">{dosenLoading ? "Memuat dosen…" : "Pilih dosen…"}</option>
                {dosenOptions.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
              {dosenErr && (
                <p className="mt-1 text-[11px] text-red-300">Error: {dosenErr}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kelas</label>
              <select
                value={header.idKelas}
                onChange={(e) => setHeader((h) => ({ ...h, idKelas: e.target.value }))}
                disabled={!header.idDosen}
                className={`w-full rounded-lg border ${header.idDosen ? "border-slate-700" : "border-slate-800 opacity-60"} bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-600`}
              >
                <option value="">
                  {!header.idDosen ? "Pilih dosen dulu" : kelasLoading ? "Memuat kelas…" : "Pilih kelas…"}
                </option>
                {kelasOptions.map((k) => (
                  <option key={k.id} value={k.id}>{k.label}</option>
                ))}
              </select>
              {kelasErr && (
                <p className="mt-1 text-[11px] text-red-300">Error: {kelasErr}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Asisten</label>
              <input
                type="text"
                value={header.asisten}
                readOnly
                title="Diisi otomatis dari akun yang login"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-600"
                placeholder="Nama asisten (otomatis)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Waktu (mulai)</label>
              <input
                type="time"
                value={header.waktuMulai}
                onChange={(e) => setHeader((h) => ({ ...h, waktuMulai: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Waktu selesai</label>
              <input
                type="time"
                value={header.waktuSelesai}
                onChange={(e) => setHeader((h) => ({ ...h, waktuSelesai: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800">
                <tr className="text-left">
                  <th className="px-4 py-3 w-12 text-slate-200">No</th>
                  <th className="px-4 py-3 text-slate-200">Kelengkapan</th>
                  <th className="px-4 py-3 w-40 text-slate-200">ID Barang</th>
                  <th className="px-4 py-3 w-28 text-slate-200">Jumlah Awal</th>
                  <th className="px-4 py-3 w-28 text-slate-200">Jumlah Akhir</th>
                  <th className="px-4 py-3 w-64 text-slate-200">
                    Catatan <span className="text-red-400">*</span>
                  </th>
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
                        onChange={(e) => handleRowChange(r.id, "idBarang", e.target.value)}
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
                        onChange={(e) => handleRowChange(r.id, "awal", e.target.value)}
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
                        onChange={(e) => handleRowChange(r.id, "akhir", e.target.value)}
                        className="w-full rounded-md border border-slate-700 bg-slate-950 text-slate-100 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-slate-600"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={r.kerusakan}
                        onChange={(e) => handleRowChange(r.id, "kerusakan", e.target.value)}
                        className="w-full rounded-md border border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-400 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-slate-600"
                        placeholder="cth: Komputer mati total"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Tindak lanjut <span className="text-red-400">*</span>
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
              <label className="block text-sm font-medium mb-1">Foto Praktikum</label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onPickFoto}
                className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-slate-100 file:hover:bg-slate-700 hover:cursor-pointer text-slate-300"
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

      {showError && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={closeError} aria-hidden />
          <div className="relative w-full max-w-md rounded-2xl border border-red-400/20 bg-slate-900 p-5 shadow-xl">
            <h3 className="text-base font-semibold text-red-200">Terjadi Kesalahan</h3>
            <p className="mt-1 text-sm text-slate-200 leading-relaxed">{errorMsg}</p>
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
      )}
    </>
  );
}
