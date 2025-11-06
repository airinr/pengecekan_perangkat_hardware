/* eslint-disable no-unused-vars */
/* eslint-disable no-useless-escape */
/* eslint-disable no-undef */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function DaftarDosen() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // === CONFIG API ===
  const API_BASE = import.meta.env.VITE_API_URL || "";
  const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

  const DOSEN_API = {
    LIST: `${API_BASE}/dosen`,
    CREATE: `${API_BASE}/dosen`,
    UPDATE: (id) => `${API_BASE}/dosen/${encodeURIComponent(id)}`,
    DELETE: (id) => `${API_BASE}/dosen/deleteDosen/${encodeURIComponent(id)}`,
    DETAIL: (id) => `${API_BASE}/dosen/${encodeURIComponent(id)}`,
    ADD_KELAS_DOSEN: `${API_BASE}/dosenKelas/addKelasDosen`,
    ADD_DOSEN_SIMPLE: `${API_BASE}/dosen/addDosen`,
  };

  const MAPEL_API = {
    GET_KELAS_BY_DOSEN: `${API_BASE}/dosenKelas/getKelas`,
    LIST_KELAS: `${API_BASE}/kelas`,
  };

  const CURRENT_YEAR = String(new Date().getFullYear());

  // === STATE (dosen) ===
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);

  // Modal dosen (tambah/edit): hanya nama
  const [open, setOpen] = useState(/\/tambah\/?$/.test(pathname));
  const [form, setForm] = useState({ nama: "" });
  const [editingId, setEditingId] = useState(null);
  const isEditing = editingId !== null;

  // === Modal Tambah Dosen (quick) ===
  const [openAddQuick, setOpenAddQuick] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [addForm, setAddForm] = useState({ namaDosen: "" });
  const addModalRef = useRef(null);

  // === STATE (kelas per dosen) ===
  const [openClass, setOpenClass] = useState(false);
  const [selectedDosen, setSelectedDosen] = useState(null);
  const [classSubmitting, setClassSubmitting] = useState(false);
  const [classError, setClassError] = useState("");
  const [classSuccess, setClassSuccess] = useState("");
  const [classForm, setClassForm] = useState({
    idKelas: "",
    tahunAjar: CURRENT_YEAR,
    semester: "Ganjil",
  });

  // === STATE (opsi kelas) ===
  const [kelasOptions, setKelasOptions] = useState([]);
  const [kelasLoading, setKelasLoading] = useState(false);
  const [kelasErr, setKelasErr] = useState("");

  // === GLOBAL: semua kelas yang sudah dipakai oleh dosen mana pun ===
  const [takenAllKelasNames, setTakenAllKelasNames] = useState(new Set());
  const [takenAllLoading, setTakenAllLoading] = useState(false);

  // (masih ada fungsi detail dosen)
  const [openDetail, setOpenDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailData, setDetailData] = useState(null);
  const [detailFilter, setDetailFilter] = useState({
    tahunAjar: CURRENT_YEAR,
    semester: "Ganjil",
  });

  const modalRef = useRef(null);
  const classModalRef = useRef(null);
  const detailModalRef = useRef(null);
  const reqRef = useRef(0);

  // === FETCH DOSEN LIST ===
  const normalizeDosen = (it) => {
    const id = it?.idDosen ?? it?.dosenId ?? it?.id ?? it?._id ?? null;
    const nama = it?.nama ?? it?.name ?? it?.fullName ?? it?.namaDosen ?? "";
    return { id, nama: String(nama || "").trim() };
  };

  const fetchDosen = useCallback(async () => {
    const myId = ++reqRef.current;
    setLoading(true);
    if (myId === reqRef.current) {
      setError("");
      setSuccess("");
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(DOSEN_API.LIST, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...NGROK_HEADERS,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({})))?.message ||
          "Gagal memuat data dosen";
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

      const norm = list.map(normalizeDosen).filter((r) => r.nama);
      norm.sort((a, b) => String(a.nama).localeCompare(String(b.nama)));

      if (myId !== reqRef.current) return;
      setRows(norm);
      setError("");
    } catch (e) {
      if (myId !== reqRef.current) return;
      console.error(e);
      setError(e?.message || "Gagal memuat data.");
    } finally {
      if (myId === reqRef.current) setLoading(false);
    }
  }, [DOSEN_API.LIST]);

  useEffect(() => {
    fetchDosen();
  }, [fetchDosen]);

  useEffect(() => {
    if (/\/tambah\/?$/.test(pathname)) {
      setEditingId(null);
      setForm({ nama: "" });
      setOpen(true);
    }
  }, [pathname]);

  // === Helpers (dosen) ===
  const openAddModal = () => {
    setEditingId(null);
    setForm({ nama: "" });
    setOpen(true);
  };

  const openEditModal = (row) => {
    setEditingId(row.id);
    setForm({ nama: row.nama || "" });
    setOpen(true);
  };

  const closeModal = useCallback(() => {
    setOpen(false);
    setForm({ nama: "" });
    setEditingId(null);
    if (/\/tambah\/?$/.test(pathname)) navigate("/dosen", { replace: true });
  }, [navigate, pathname]);

  // klik luar & esc untuk modal dosen
  useEffect(() => {
    function onDown(e) {
      if (!open) return;
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        closeModal();
      }
    }
    function onKey(e) {
      if (!open) return;
      if (e.key === "Escape") closeModal();
    }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, closeModal]);

  // === Tambah Dosen (quick) ===
  const openAddQuickModal = () => {
    setAddError("");
    setAddSuccess("");
    setAddForm({ namaDosen: "" });
    setOpenAddQuick(true);
  };
  const closeAddQuickModal = () => {
    setOpenAddQuick(false);
    setAddSubmitting(false);
    setAddError("");
    setAddSuccess("");
    setAddForm({ namaDosen: "" });
  };
  const onChangeAddQuick = (e) => {
    const { name, value } = e.target;
    setAddForm((f) => ({ ...f, [name]: value }));
  };
  const validateAddQuick = () => {
    const n = String(addForm.namaDosen || "").trim();
    if (!n) return "Nama dosen wajib diisi.";
    if (n.length < 3) return "Nama dosen minimal 3 karakter.";
    if (n.length > 120) return "Nama dosen maksimal 120 karakter.";
    return "";
  };
  const handleSubmitAddQuick = async (e) => {
    e?.preventDefault?.();
    setAddError("");
    setAddSuccess("");

    const v = validateAddQuick();
    if (v) {
      setAddError(v);
      return;
    }

    setAddSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(DOSEN_API.ADD_DOSEN_SIMPLE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...NGROK_HEADERS,
        },
        body: JSON.stringify({
          namaDosen: String(addForm.namaDosen).trim(),
        }),
      });
      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({})))?.message ||
          "Gagal menambahkan dosen.";
        throw new Error(msg);
      }
      setAddSuccess("Dosen berhasil ditambahkan.");
      await fetchDosen();
      closeAddQuickModal();
      setSuccess("Dosen baru berhasil ditambahkan.");
    } catch (err) {
      console.error(err);
      setAddError(err?.message || "Gagal menambahkan dosen.");
    } finally {
      setAddSubmitting(false);
    }
  };

  useEffect(() => {
    function onDown(e) {
      if (!openAddQuick) return;
      if (addModalRef.current && !addModalRef.current.contains(e.target)) {
        closeAddQuickModal();
      }
    }
    function onKey(e) {
      if (!openAddQuick) return;
      if (e.key === "Escape") closeAddQuickModal();
    }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [openAddQuick]);

  // === FETCH KELAS OPTIONS ===
  const normalizeKelas = (k) => {
    const idKelas =
      k?.idKelas ?? k?.kelasId ?? k?.id ?? k?._id ?? k?.kode ?? k?.code ?? "";
    const nama =
      k?.nama ?? k?.namaKelas ?? k?.kelas ?? k?.name ?? k?.label ?? "";
    const finalId = String(idKelas || "").trim();
    const finalNama = String(nama || "").trim();
    const label = finalNama || finalId || JSON.stringify(k);
    return { idKelas: finalId, label };
  };

  const fetchKelasOptions = useCallback(async () => {
    setKelasLoading(true);
    setKelasErr("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(MAPEL_API.LIST_KELAS, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...NGROK_HEADERS,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({})))?.message ||
          "Gagal memuat daftar kelas.";
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

      const options = list
        .map(normalizeKelas)
        .filter((o) => o.idKelas || o.label);

      options.sort((a, b) =>
        String(a.idKelas || a.label).localeCompare(String(b.idKelas || b.label))
      );

      setKelasOptions(options);
    } catch (e) {
      console.error(e);
      setKelasErr(e?.message || "Gagal memuat daftar kelas.");
      setKelasOptions([]);
    } finally {
      setKelasLoading(false);
    }
  }, [MAPEL_API.LIST_KELAS]);

  useEffect(() => {
    fetchKelasOptions();
  }, [fetchKelasOptions]);

  // === GLOBAL: ambil semua kelas yang sudah dipakai oleh dosen mana pun ===
  const fetchTakenKelasAll = useCallback(
    async (tahunAjar, semester) => {
      setTakenAllLoading(true);
      try {
        const token = localStorage.getItem("token");

        const names = rows.map((r) => r?.nama).filter(Boolean);
        const qsFetches = names.map((namaDosen) => {
          const qs = new URLSearchParams({
            namaDosen: String(namaDosen).trim(),
            tahunAjar: String(tahunAjar || "").trim(),
            semester: String(semester || "").trim(),
          }).toString();

          return fetch(`${MAPEL_API.GET_KELAS_BY_DOSEN}?${qs}`, {
            method: "GET",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              ...NGROK_HEADERS,
              Accept: "application/json",
            },
          })
            .then(async (res) => {
              if (!res.ok) return [];
              const payload = await res.json();
              const arr = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.data)
                ? payload.data
                : Array.isArray(payload?.kelas)
                ? payload.kelas
                : [];
              return arr.map((k) =>
                typeof k === "string"
                  ? k
                  : k?.nama ??
                    k?.namaKelas ??
                    k?.kelas ??
                    k?.name ??
                    k?.code ??
                    ""
              );
            })
            .catch(() => []);
        });

        const results = await Promise.all(qsFetches);
        const flat = results.flat().filter(Boolean);
        const setLower = new Set(flat.map((s) => String(s).toLowerCase()));
        setTakenAllKelasNames(setLower);
      } catch (e) {
        console.error(e);
        setTakenAllKelasNames(new Set());
      } finally {
        setTakenAllLoading(false);
      }
    },
    [MAPEL_API.GET_KELAS_BY_DOSEN, rows]
  );

  const openClassModal = (row) => {
    setSelectedDosen(row);
    const def = { idKelas: "", tahunAjar: CURRENT_YEAR, semester: "Ganjil" };
    setClassForm(def);
    setClassError("");
    setClassSuccess("");
    setOpenClass(true);
    if (!kelasOptions.length && !kelasLoading) {
      fetchKelasOptions();
    }
    // ambil kelas terpakai global
    fetchTakenKelasAll(def.tahunAjar, def.semester);
  };

  const closeClassModal = () => {
    setOpenClass(false);
    setSelectedDosen(null);
    setClassForm({ idKelas: "", tahunAjar: CURRENT_YEAR, semester: "Ganjil" });
    setClassError("");
    setClassSuccess("");
  };

  useEffect(() => {
    function onDown(e) {
      if (!openClass) return;
      if (classModalRef.current && !classModalRef.current.contains(e.target)) {
        closeClassModal();
      }
    }
    function onKey(e) {
      if (!openClass) return;
      if (e.key === "Escape") closeClassModal();
    }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [openClass]);

  // === DETAIL: /dosenKelas/getKelas ===
  const fetchKelasByDosen = useCallback(
    async ({ namaDosen, tahunAjar, semester }) => {
      setDetailError("");
      setDetailLoading(true);
      try {
        const token = localStorage.getItem("token");
        const qs = new URLSearchParams({
          namaDosen: String(namaDosen || "").trim(),
          tahunAjar: String(tahunAjar || "").trim(),
          semester: String(semester || "").trim(),
        }).toString();

        const res = await fetch(`${MAPEL_API.GET_KELAS_BY_DOSEN}?${qs}`, {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...NGROK_HEADERS,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          const msg =
            (await res.json().catch(() => ({})))?.message ||
            "Gagal memuat kelas dosen.";
          throw new Error(msg);
        }

        const payload = await res.json();
        const arr = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.kelas)
          ? payload.kelas
          : [];

        const kelas = arr.map((k) => {
          if (typeof k === "string") return k;
          return (
            k?.nama ??
            k?.namaKelas ??
            k?.kelas ??
            k?.name ??
            k?.code ??
            JSON.stringify(k)
          );
        });

        setDetailData((prev) => (prev ? { ...prev, kelas } : prev));
      } catch (e) {
        console.error(e);
        setDetailError(e?.message || "Gagal memuat kelas dosen.");
        setDetailData((prev) => (prev ? { ...prev, kelas: [] } : prev));
      } finally {
        setDetailLoading(false);
      }
    },
    [MAPEL_API.GET_KELAS_BY_DOSEN]
  );

  const openDetailModal = async (row) => {
    setOpenDetail(true);
    setDetailError("");
    setDetailData({
      id: row.id,
      nama: row.nama,
      kelas: undefined,
    });
    const defaultFilter = { tahunAjar: CURRENT_YEAR, semester: "Ganjil" };
    setDetailFilter(defaultFilter);
    await fetchKelasByDosen({
      namaDosen: row.nama,
      tahunAjar: defaultFilter.tahunAjar,
      semester: defaultFilter.semester,
    });
  };

  const onChangeDetailFilter = (e) => {
    const { name, value } = e.target;
    setDetailFilter((f) => ({ ...f, [name]: value }));
  };

  const refreshDetailKelas = () => {
    if (!detailData?.nama) return;
    fetchKelasByDosen({
      namaDosen: detailData.nama,
      tahunAjar: detailFilter.tahunAjar,
      semester: detailFilter.semester,
    });
  };

  const closeDetailModal = () => {
    setOpenDetail(false);
    setDetailLoading(false);
    setDetailError("");
    setDetailData(null);
  };

  useEffect(() => {
    function onDown(e) {
      if (!openDetail) return;
      if (
        detailModalRef.current &&
        !detailModalRef.current.contains(e.target)
      ) {
        closeDetailModal();
      }
    }
    function onKey(e) {
      if (!openDetail) return;
      if (e.key === "Escape") closeDetailModal();
    }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [openDetail]);

  // === FILTERED DATA (tabel dosen) ===
  const filtered = useMemo(() => {
    const base = rows.filter((r) => {
      if (!q.trim()) return true;
      const needle = q.toLowerCase();
      return r.nama.toLowerCase().includes(needle);
    });
    return base.map((r, i) => ({ no: i + 1, ...r }));
  }, [rows, q]);

  // === DROPDOWN: hanya kelas yang BELUM dipakai oleh siapa pun ===
  const filteredKelasOptions = useMemo(() => {
    const isTaken = (label) =>
      takenAllKelasNames.has(String(label || "").toLowerCase());
    return kelasOptions.filter((opt) => !isTaken(opt?.label));
  }, [kelasOptions, takenAllKelasNames]);

  const refreshTakenAllNow = () => {
    fetchTakenKelasAll(classForm.tahunAjar, classForm.semester);
  };

  const onChangeClass = (e) => {
    const { name, value } = e.target;
    setClassForm((f) => {
      const next = { ...f, [name]: value };
      if (name === "tahunAjar" || name === "semester") next.idKelas = "";
      return next;
    });
    if (name === "tahunAjar" || name === "semester") {
      fetchTakenKelasAll(
        name === "tahunAjar" ? value : classForm.tahunAjar,
        name === "semester" ? value : classForm.semester
      );
    }
  };

  const totalDosen = rows.length;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    const n = String(form.nama || "").trim();
    if (!n) return "Nama wajib diisi.";
    if (n.length < 3) return "Nama minimal 3 karakter.";
    return "";
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const v = validate();
    if (v) {
      setError(v);
      setSuccess("");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");

      if (isEditing) {
        const res = await fetch(DOSEN_API.UPDATE(editingId), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...NGROK_HEADERS,
          },
          body: JSON.stringify({
            nama: String(form.nama).trim(),
          }),
        });

        if (!res.ok) {
          const msg =
            (await res.json().catch(() => ({})))?.message ||
            "Gagal memperbarui dosen.";
          throw new Error(msg);
        }

        setSuccess("Data dosen berhasil diperbarui.");
      } else {
        const res = await fetch(DOSEN_API.CREATE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...NGROK_HEADERS,
          },
          body: JSON.stringify({
            nama: String(form.nama).trim(),
          }),
        });

        if (!res.ok) {
          const msg =
            (await res.json().catch(() => ({})))?.message ||
            "Gagal menambahkan dosen.";
          throw new Error(msg);
        }

        setSuccess("Data dosen berhasil ditambahkan.");
      }

      closeModal();
      fetchDosen();
    } catch (e2) {
      console.error(e2);
      setError(
        e2?.message ||
          (isEditing ? "Gagal memperbarui dosen." : "Gagal menambahkan dosen.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const validateClass = () => {
    const idKelas = String(classForm.idKelas || "").trim();
    const tahun = String(classForm.tahunAjar || "").trim();
    if (!idKelas) return "ID Kelas wajib dipilih.";
    if (!tahun || !/^\d{4}$/.test(tahun))
      return "Tahun ajar wajib 4 digit (mis. 2025).";
    if (!["Ganjil", "Genap"].includes(classForm.semester))
      return "Semester harus Ganjil atau Genap.";
    return "";
  };

  const handleSubmitClass = async (e) => {
    e?.preventDefault?.();
    setClassError("");
    setClassSuccess("");

    const v = validateClass();
    if (v) {
      setClassError(v);
      return;
    }
    if (!selectedDosen?.id) {
      setClassError("Dosen tidak valid.");
      return;
    }

    setClassSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(DOSEN_API.ADD_KELAS_DOSEN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...NGROK_HEADERS,
        },
        body: JSON.stringify({
          idDosen: String(selectedDosen.id).trim(),
          idKelas: String(classForm.idKelas).trim(),
          tahunAjar: Number(classForm.tahunAjar),
          semester: String(classForm.semester).trim(),
        }),
      });

      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({})))?.message ||
          "Gagal menambahkan kelas.";
        throw new Error(msg);
      }

      setClassSuccess("Kelas dosen berhasil ditambahkan.");
      setClassForm({
        idKelas: "",
        tahunAjar: CURRENT_YEAR,
        semester: "Ganjil",
      });

      // perbarui global taken agar dropdown tetap bersih
      fetchTakenKelasAll(CURRENT_YEAR, "Ganjil");
    } catch (e2) {
      console.error(e2);
      setClassError(e2?.message || "Gagal menambahkan kelas.");
    } finally {
      setClassSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    if (!row?.id) return;
    const ok = window.confirm(`Hapus dosen "${row.nama}"?`);
    if (!ok) return;

    setDeletingId(row.id);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(DOSEN_API.DELETE(row.id), {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...NGROK_HEADERS,
        },
      });

      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({})))?.message ||
          "Gagal menghapus dosen.";
        throw new Error(msg);
      }

      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setSuccess(`Dosen "${row.nama}" berhasil dihapus.`);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Gagal menghapus dosen.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="lg:ml-56">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Data Dosen</h1>
            <p className="text-slate-400 text-sm">
              Kelola data dosen dan kelas per dosen.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openAddQuickModal}
              className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              + Tambah Dosen
            </button>
            <button
              type="button"
              onClick={fetchDosen}
              disabled={loading}
              className="rounded-xl bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-600 disabled:opacity-60"
            >
              {loading ? "Muat..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4">
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-xs text-slate-400">Total Dosen</div>
            <div className="text-2xl font-semibold text-white">
              {totalDosen}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="px-4 space-y-2">
        {!open && success && (
          <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-200">
            {success}
          </div>
        )}
        {!open && error && (
          <div className="rounded-lg border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        )}
      </div>

      {/* Toolbar + FULL-WIDTH TABLE */}
      <div className="px-0 md:px-4 pb-4">
        <div className="rounded-none md:rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-white/10">
            <div className="relative w-full md:max-w-sm">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                🔎
              </span>
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari Nama…"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
                aria-label="Kolom pencarian"
              />
            </div>
            <div className="ml-auto text-xs text-slate-400">
              {filtered.length} data ditampilkan
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            {filtered.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-slate-800 sticky top-0 z-10">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-slate-200 w-16">#</th>
                    <th className="px-4 py-3 text-slate-200">Nama</th>
                    <th className="px-4 py-3 text-slate-200 w-56 text-right">
                      Kelas
                    </th>
                    <th className="px-4 py-3 text-slate-200 w-44 text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-slate-800 hover:bg-white/5"
                    >
                      <td className="px-4 py-2 text-slate-100">{row.no}</td>
                      <td className="px-4 py-2 text-slate-100">{row.nama}</td>

                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openClassModal(row)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            + Kelas
                          </button>
                          <button
                            type="button"
                            onClick={() => openDetailModal(row)}
                            className="rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                          >
                            Detail
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(row)}
                            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            disabled={deletingId === row.id}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                          >
                            {deletingId === row.id ? "Menghapus..." : "Hapus"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="text-3xl mb-2">📄</div>
                <p className="text-slate-300">Belum ada data dosen.</p>
                <p className="text-slate-500 text-sm">
                  Tambahkan dosen baru atau muat ulang data.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={openAddQuickModal}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    + Tambah Dosen
                  </button>
                  <button
                    onClick={fetchDosen}
                    disabled={loading}
                    className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-60"
                  >
                    {loading ? "Memuat…" : "Refresh"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === Modal Tambah Dosen (Quick) === */}
      {openAddQuick && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-addquick-title"
          className="fixed inset-0 z-[105] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            ref={addModalRef}
            className="relative z-[106] w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-5 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2
                id="modal-addquick-title"
                className="text-lg font-semibold text-white"
              >
                Tambah Dosen
              </h2>
              <button
                type="button"
                onClick={closeAddQuickModal}
                className="rounded-md p-1 text-slate-300 hover:bg-slate-800 hover:text-white"
                aria-label="Tutup"
                title="Tutup"
              >
                ✕
              </button>
            </div>

            {addError && (
              <div className="mb-3 rounded-lg border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
                {addError}
              </div>
            )}
            {addSuccess && (
              <div className="mb-3 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-200">
                {addSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitAddQuick} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm text-slate-300">
                  Nama Dosen
                </span>
                <input
                  type="text"
                  name="namaDosen"
                  value={addForm.namaDosen}
                  onChange={onChangeAddQuick}
                  placeholder="Contoh: Sopian Alviana, M.Kom"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
                  required
                />
              </label>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={addSubmitting}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {addSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  type="button"
                  onClick={() => setAddForm({ namaDosen: "" })}
                  className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === Modal Dosen (Tambah/Edit) === */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            ref={modalRef}
            className="relative z-[101] w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/95 p-5 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 id="modal-title" className="text-lg font-semibold text-white">
                {isEditing ? "Edit Dosen" : "Tambah Dosen"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md p-1 text-slate-300 hover:bg-slate-800 hover:text-white"
                aria-label="Tutup"
                title="Tutup"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-3 rounded-lg border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm text-slate-300">Nama</span>
                <input
                  type="text"
                  name="nama"
                  value={form.nama}
                  onChange={onChange}
                  placeholder="Nama lengkap dosen"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
                  required
                />
              </label>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting
                    ? "Menyimpan..."
                    : isEditing
                    ? "Simpan Perubahan"
                    : "Simpan"}
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ nama: "" })}
                  className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === Modal Kelas per Dosen === */}
      {openClass && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-class-title"
          className="fixed inset-0 z-[110] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            ref={classModalRef}
            className="relative z-[111] w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-5 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2
                id="modal-class-title"
                className="text-lg font-semibold text-white"
              >
                Tambah Kelas
              </h2>
              <button
                type="button"
                onClick={closeClassModal}
                className="rounded-md p-1 text-slate-300 hover:bg-slate-800 hover:text-white"
                aria-label="Tutup"
                title="Tutup"
              >
                ✕
              </button>
            </div>

            {selectedDosen && (
              <div className="mb-3 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-200">
                Dosen:{" "}
                <span className="font-semibold">{selectedDosen.nama}</span>
              </div>
            )}

            {classError && (
              <div className="mb-3 rounded-lg border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
                {classError}
              </div>
            )}
            {classSuccess && (
              <div className="mb-3 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-200">
                {classSuccess}
              </div>
            )}
            {kelasErr && (
              <div className="mb-3 rounded-lg border border-amber-400/30 bg-amber-500/15 px-3 py-2 text-sm text-amber-100">
                {kelasErr}
              </div>
            )}

            <form onSubmit={handleSubmitClass} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm text-slate-300">
                  Pilih Kelas
                </span>
                <div className="flex gap-2">
                  <select
                    name="idKelas"
                    value={classForm.idKelas}
                    onChange={onChangeClass}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-600 disabled:opacity-60"
                    disabled={kelasLoading || takenAllLoading}
                    required
                  >
                    <option value="">
                      {kelasLoading || takenAllLoading
                        ? "Memuat…"
                        : "— pilih kelas —"}
                    </option>
                    {filteredKelasOptions.map((opt) => (
                      <option
                        key={opt.idKelas || opt.label}
                        value={opt.idKelas}
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={fetchKelasOptions}
                    className="shrink-0 rounded-xl bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-600"
                    title="Refresh daftar kelas"
                  >
                    Refresh
                  </button>
                  {/* <button
                    type="button"
                    onClick={refreshTakenAllNow}
                    className="shrink-0 rounded-xl bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-600"
                    title="Cek kelas terpakai semua dosen"
                    disabled={takenAllLoading}
                  >
                    {takenAllLoading ? "Cek…" : "Cek Semua"}
                  </button> */}
                </div>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm text-slate-300">
                    Tahun Ajar
                  </span>
                  <input
                    type="number"
                    name="tahunAjar"
                    value={classForm.tahunAjar}
                    onChange={onChangeClass}
                    placeholder="Mis. 2025"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm text-slate-300">
                    Semester
                  </span>
                  <select
                    name="semester"
                    value={classForm.semester}
                    onChange={onChangeClass}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-600"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </label>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={classSubmitting}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {classSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setClassForm({
                      idKelas: "",
                      tahunAjar: CURRENT_YEAR,
                      semester: "Ganjil",
                    })
                  }
                  className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === Modal Detail Dosen === */}
      {openDetail && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-detail-title"
          className="fixed inset-0 z-[120] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            ref={detailModalRef}
            className="relative z-[121] w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/95 p-5 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2
                id="modal-detail-title"
                className="text-lg font-semibold text-white"
              >
                Detail Dosen
              </h2>
              <button
                type="button"
                onClick={closeDetailModal}
                className="rounded-md p-1 text-slate-300 hover:bg-slate-800 hover:text-white"
                aria-label="Tutup"
                title="Tutup"
              >
                ✕
              </button>
            </div>

            {detailError && (
              <div className="mb-3 rounded-lg border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
                {detailError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-400">Nama</div>
                <div className="text-slate-100 font-medium">
                  {detailData?.nama ?? "—"}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 mb-1">
                <div className="sm:col-span-1">
                  <label className="block text-xs text-slate-400 mb-1">
                    Tahun Ajar
                  </label>
                  <input
                    type="number"
                    name="tahunAjar"
                    value={detailFilter.tahunAjar}
                    onChange={onChangeDetailFilter}
                    placeholder="Mis. 2025"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs text-slate-400 mb-1">
                    Semester
                  </label>
                  <select
                    name="semester"
                    value={detailFilter.semester}
                    onChange={onChangeDetailFilter}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-600"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
                <div className="sm:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={refreshDetailKelas}
                    disabled={detailLoading}
                    className="w-full rounded-xl bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-60"
                    title="Muat kelas dosen"
                  >
                    {detailLoading ? "Memuat…" : "Muat"}
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400 mb-1">Kelas</div>

                {detailLoading ? (
                  <div className="text-slate-300 text-sm">Memuat…</div>
                ) : Array.isArray(detailData?.kelas) &&
                  detailData.kelas.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {detailData.kelas.map((k, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100"
                      >
                        {k || "—"}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-300 text-sm">—</div>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={closeDetailModal}
                className="rounded-xl bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
