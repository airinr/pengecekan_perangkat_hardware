/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Table } from "../../../components/DefaultTable";

const STATUS_COMPLETE = "Lengkap";
const STATUS_INCOMPLETE = "Tidak Lengkap";

// API base
const API_BASE = import.meta.env.VITE_API_URL || "";
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

export default function PerangkatLab() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const labParam = searchParams.get("lab") || "609"; // default to 609 if no param

  // Map lab param to LAB_CODE and lab name
  const labConfig = useMemo(() => {
    if (labParam === "610") {
      return { code: "LAB00002", name: "Lab 610" };
    }
    return { code: "LAB00001", name: "Lab 609" };
  }, [labParam]);

  const LAB_CODE = labConfig.code;
  const labName = labConfig.name;

  // ======= State =======
  const [rows, setRows] = useState([]); // diisi dari API
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // UI helpers
  const [q, setQ] = useState(""); // pencarian nama perangkat
  const [sortKey, setSortKey] = useState("no");
  const [sortDir, setSortDir] = useState("asc"); // asc | desc

  // Checklist untuk tabel bawah (reports)
  const [checkedMap, setCheckedMap] = useState({});
  const toggleChecked = (rowKey) =>
    setCheckedMap((m) => ({ ...m, [rowKey]: !m[rowKey] }));

  // ========= Ambil data dari /datalab/getdatalab/{LAB_CODE} =========
  const fetchAbortRef = useRef(null);
  const fetchLabData = useCallback(async () => {
    setLoading(true);
    setError("");

    // batalkan request sebelumnya bila ada
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
    }
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/datalab/getdatalab/${LAB_CODE}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...NGROK_HEADERS,
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({})))?.message ||
          "Gagal memuat data lab";
        throw new Error(msg);
      }

      const payload = await res.json();
      const list = Array.isArray(payload?.data) ? payload.data : [];

      // Map ke bentuk tabel — simpan jumlahNormal & jumlahRusak di root
      const mapped = list.map((item, idx) => {
        const idBarang = item?.idBarang ?? null;
        const nama =
          item?.barangModel?.namaBarang ?? item?.namaBarang ?? idBarang ?? "-";

        const jumlahNormal = Number(item?.jumlahNormal ?? 0);
        const jumlahRusak = Number(item?.jumlahRusak ?? 0);
        const jumlah =
          (Number.isFinite(jumlahNormal) ? jumlahNormal : 0) +
          (Number.isFinite(jumlahRusak) ? jumlahRusak : 0);

        const status = jumlahRusak > 0 ? STATUS_INCOMPLETE : STATUS_COMPLETE;

        return {
          id: idBarang ?? `row-${idx}`,
          no: idx + 1,
          idBarang,
          nama,
          jumlahNormal,
          jumlahRusak,
          jumlah,
          status,
        };
      });

      setRows(mapped);
      setCheckedMap({}); // reset checklist
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error(err);
        setError(err?.message || "Gagal memuat data.");
      }
    } finally {
      setLoading(false);
    }
  }, [LAB_CODE]); // penting: refetch saat lab berubah

  useEffect(() => {
    fetchLabData();
    return () => {
      // cleanup abort saat unmount
      if (fetchAbortRef.current) fetchAbortRef.current.abort();
    };
  }, [fetchLabData]);

  // ====== Derived data ======
  const filteredRows = useMemo(() => {
    let out = rows;
    if (q.trim()) {
      const keyword = q.toLowerCase();
      out = out.filter((r) => (r?.nama || "").toLowerCase().includes(keyword));
    }
    const mul = sortDir === "asc" ? 1 : -1;
    out = [...out].sort((a, b) => {
      const va = a?.[sortKey];
      const vb = b?.[sortKey];
      if (typeof va === "number" && typeof vb === "number")
        return (va - vb) * mul;
      return String(va ?? "").localeCompare(String(vb ?? "")) * mul;
    });
    return out;
  }, [rows, q, sortKey, sortDir]);

  const incompleteRows = useMemo(
    () => rows.filter((r) => r.status === STATUS_INCOMPLETE),
    [rows]
  );

  const totals = useMemo(() => {
    const acc = rows.reduce(
      (acc, r) => {
        acc.normal += Number(r.jumlahNormal || 0);
        acc.rusak += Number(r.jumlahRusak || 0);
        return acc;
      },
      { normal: 0, rusak: 0 }
    );
    return { normal: acc.normal, rusak: acc.rusak, total: rows.length };
  }, [rows]); // ====== Actions ======
  const changeLab = (lab) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("lab", lab);
      return p;
    });
  };

  // jumlahNormal += jumlahRusak; jumlahRusak = 0; total = jumlahNormal baru
  const markResolved = async (row) => {
    const jn = Number(row.jumlahNormal ?? 0);
    const jr = Number(row.jumlahRusak ?? 0);

    const newNormal =
      (Number.isFinite(jn) ? jn : 0) + (Number.isFinite(jr) ? jr : 0);
    const newRusak = 0;

    // Optimistic update UI
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? {
              ...r,
              jumlahNormal: newNormal,
              jumlahRusak: newRusak,
              jumlah: newNormal, // total = normal + rusak(0)
              status: STATUS_COMPLETE,
            }
          : r
      )
    );

    // uncheck checkbox
    setCheckedMap((m) => ({ ...m, [row.id]: false }));

    // Simpan ke server bila baris berasal dari server (punya idBarang)
    try {
      if (!row.idBarang) return;
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/datalab/updateDataLab/${LAB_CODE}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...NGROK_HEADERS,
        },
        body: JSON.stringify([
          {
            idBarang: row.idBarang,
            jumlahNormal: newNormal,
            jumlahRusak: newRusak,
          },
        ]),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        console.error("Gagal menyimpan tindak lanjut:", t);
        // rollback sederhana
        fetchLabData();
      }
    } catch (e) {
      console.error(e);
      fetchLabData();
    }
  };

  const onSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const exportCSV = () => {
    const header = [
      "No",
      "Nama",
      "Jumlah Normal",
      "Jumlah Rusak",
      "Total",
      "Status",
    ];
    const lines = [header.join(",")];
    fifilteredRows.forEach((r, idx) => {
      lines.push([
        r[
          (idx + 1, r.nama, r.jumlahNormal, r.jumlahRusak, r.jumlah, r.status)
        ].join(","),
      ]);
    });
    const blob = new Blob(["\uFEFF" + lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `perangkat_${LAB_CODE}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ====== Columns untuk Table utama ======
  const columns = useMemo(
    () => [
      { key: "no", header: "#" },
      { key: "nama", header: "Nama" },
      { key: "jumlahNormal", header: "Jumlah Normal" },
      { key: "jumlahRusak", header: "Jumlah Rusak" },
      { key: "jumlah", header: "Total" },
      {
        key: "status",
        header: "Status",
        render: (v) => (
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
              v === STATUS_COMPLETE
                ? "bg-green-500/15 text-green-300 ring-green-500/30"
                : v === STATUS_INCOMPLETE
                ? "bg-yellow-500/15 text-yellow-300 ring-yellow-500/30"
                : "bg-slate-500/15 text-slate-300 ring-slate-500/30"
            }`}
          >
            {v}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="container mx-auto px-4 py-8 lg:ml-56 mt-16 sm:mt-6">
      {/* ===== Header ===== */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Perangkat Laboratorium {labName}
          </h1>
          <p className="text-sm text-slate-400">
            Pantau stok dan kondisi perangkat per laboratorium.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => changeLab("609")}
              className={`px-3 py-1.5 text-sm ${
                labParam === "609"
                  ? "bg-slate-700 text-white"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
              aria-pressed={labParam === "609"}
            >
              Lab 609
            </button>
            <button
              type="button"
              onClick={() => changeLab("610")}
              className={`px-3 py-1.5 text-sm ${
                labParam === "610"
                  ? "bg-slate-700 text-white"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
              aria-pressed={labParam === "610"}
            >
              Lab 610
            </button>
          </div>
          <button
            onClick={fetchLabData}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-slate-600 active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-slate-400/60"
            aria-busy={loading}
          >
            {loading ? "Memuat…" : "Refresh"}
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-emerald-600 active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* ===== Alerts ===== */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          <div className="font-semibold">Gagal memuat</div>
          <div className="opacity-90">{error}</div>
        </div>
      )}

      {/* ===== Quick Stats ===== */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="text-xs text-slate-400">Total Perangkat</div>
          <div className="text-2xl font-semibold">{totals.total}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="text-xs text-slate-400">Normal</div>
          <div className="text-2xl font-semibold text-green-300">
            {totals.normal}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="text-xs text-slate-400">Rusak/Hilang</div>
          <div className="text-2xl font-semibold text-yellow-300">
            {totals.rusak}
          </div>
        </div>
      </div>

      {/* ===== Controls ===== */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama perangkat…"
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600 sm:w-80"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Sort by:</label>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200"
          >
            <option value="no">Index (#)</option>
            <option value="nama">Nama</option>
            <option value="jumlahNormal">Jumlah Normal</option>
            <option value="jumlahRusak">Jumlah Rusak</option>
            <option value="jumlah">Total</option>
            <option value="status">Status</option>
          </select>
          <button
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200"
            title="Urutan"
            aria-label="Urutan"
          >
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {/* ===== Tabel utama ===== */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 rounded-2xl bg-slate-900/60 backdrop-blur-sm" />
        )}
        <Table columns={columns} data={filteredRows} />
      </div>

      {/* ===== Reports (otomatis muncul kalau ada yang rusak) ===== */}
      {incompleteRows.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-1 text-2xl font-bold">Reports</h2>
          <p className="mb-4 text-sm text-slate-300">
            Berikut merupakan data perangkat yang rusak/hilang
          </p>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800">
                <tr className="text-left">
                  <th className="px-4 py-3 text-slate-200">#</th>
                  <th className="px-4 py-3 text-slate-200">Nama</th>
                  <th className="px-4 py-3 text-slate-200">Jumlah Normal</th>
                  <th className="px-4 py-3 text-slate-200">Jumlah Rusak</th>
                  <th className="px-4 py-3 text-slate-200">Total</th>
                  <th className="px-4 py-3 text-slate-200">Status</th>
                  <th className="px-4 py-3 text-slate-200">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {incompleteRows.map((row) => (
                  <tr
                    key={row.id || row.no}
                    className="border-t border-slate-800"
                  >
                    <td className="px-4 py-2">{row.no}</td>
                    <td className="px-4 py-2">{row.nama}</td>
                    <td className="px-4 py-2">{row.jumlahNormal}</td>
                    <td className="px-4 py-2">{row.jumlahRusak}</td>
                    <td className="px-4 py-2">{row.jumlah}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-yellow-500/15 text-yellow-300 ring-yellow-500/30">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-blue-600"
                          checked={!!checkedMap[row.id]}
                          disabled={row.status === STATUS_COMPLETE}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setCheckedMap((m) => ({ ...m, [row.id]: checked }));
                            if (checked) {
                              // tandai sudah ditindaklanjuti: normal += rusak, rusak = 0
                              markResolved(row);
                            }
                          }}
                        />
                        <span className="text-xs text-slate-300">
                          Selesai / sudah ditindaklanjuti
                        </span>
                      </label>
                    </td>
                  </tr>
                ))}
                {incompleteRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-slate-400"
                    >
                      Tidak ada data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
