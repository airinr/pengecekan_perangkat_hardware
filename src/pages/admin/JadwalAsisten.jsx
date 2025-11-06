/* eslint-disable no-undef */
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { Table } from "../../components/DefaultTable";

export default function JadwalAsisten() {
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL"); // ALL | admin | asisten

  const [users, setUsers] = useState([]); // semua user aktif
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL || "";
  const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

  // === penanda request terbaru untuk cegah race condition ===
  const reqRef = useRef(0);

  function mapRoleFromId(idRole) {
    const raw = (idRole ?? "").toString().trim().toUpperCase();
    const asNum = Number.isNaN(Number(raw)) ? null : Number(raw);
    if (asNum === 1) return "admin";
    if (asNum === 2) return "asisten";
    if (raw === "ADM" || raw === "ADMIN") return "admin";
    if (raw === "AST" || raw === "ASISTEN" || raw === "ASSISTANT")
      return "asisten";
    return "other";
  }

  const normalizeUser = (u) => {
    const idUser = u?.idUser ?? u?.userId ?? u?.id ?? u?._id ?? null;
    const nim = u?.nim ?? u?.NIM ?? u?.username ?? "";
    const nama = u?.nama ?? u?.name ?? u?.fullName ?? "";
    const email = u?.email ?? u?.mail ?? "-";

    const idRole =
      u?.idRole ??
      u?.roleId ??
      u?.role_id ??
      u?.roleCode ??
      u?.role ??
      u?.userRole;
    const role = mapRoleFromId(idRole);

    const isActiveRaw =
      u?.isActive ?? u?.active ?? u?.is_active ?? u?.isApproved ?? u?.approved;
    const isActive =
      typeof isActiveRaw === "boolean"
        ? isActiveRaw
        : ["1", "true", "TRUE", "True"].includes(String(isActiveRaw));

    const status = isActive ? "Active" : "Pending";

    return { idUser, nim, nama, email, role, status, isActive };
  };

  const fetchAllUsers = useCallback(async () => {
    const myId = ++reqRef.current; // id untuk request ini
    setLoading(true);
    // reset error hanya untuk request aktif (terbaru)
    if (myId === reqRef.current) setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/auth/getAllUser`, {
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
          "Gagal memuat data pengguna";
        throw new Error(msg);
      }

      const payload = await res.json();
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.users)
        ? payload.users
        : [];

      const norm = list.map(normalizeUser).filter((u) => !!u.nim);

      const aktif = norm
        .filter((u) => u.isActive === true)
        .sort((a, b) => String(a.nim).localeCompare(String(b.nim)));

      // hanya update jika ini masih request terbaru
      if (myId !== reqRef.current) return;
      setUsers(aktif);
      setError(""); // pastikan banner error hilang setelah sukses
    } catch (err) {
      if (myId !== reqRef.current) return; // abaikan error request lama
      console.error(err);
      setError(err?.message || "Gagal memuat data.");
    } finally {
      if (myId === reqRef.current) setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  // COLUMNS: Jadwal Asisten
  const columns = useMemo(
    () => [
      { key: "no", header: "#" },
      { key: "nim", header: "NIM" },
      { key: "nama", header: "Nama" },
      { key: "email", header: "Email" },
      { key: "role", header: "Role" },
      { key: "jadwal", header: "Jadwal" },
      {
        key: "aksi",
        header: "",
        render: (_, row) => (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate(`/jadwal_asisten/${row.nim}/edit`)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              aria-label={`Edit jadwal ${row.nama}`}
            >
              Edit Jadwal
            </button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  // FILTER & SEARCH: aktif
  const rows = useMemo(() => {
    let base = users.map((u, i) => ({
      no: i + 1,
      idUser: u.idUser,
      nim: u.nim,
      nama: u.nama,
      email: u.email || "-",
      role: u.role || "other",
      jadwal: "Belum diatur", // placeholder, bisa diambil dari API jadwal
    }));

    if (roleFilter !== "ALL") {
      base = base.filter((r) => r.role === roleFilter);
    }

    if (!q.trim()) return base;
    const needle = q.toLowerCase();
    return base.filter(
      (r) =>
        String(r.nim).toLowerCase().includes(needle) ||
        String(r.nama).toLowerCase().includes(needle) ||
        String(r.email).toLowerCase().includes(needle) ||
        String(r.role).toLowerCase().includes(needle)
    );
  }, [q, users, roleFilter]);

  return (
    <div className="p-4 lg:ml-56 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Jadwal Asisten</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/jadwal_asisten/add")}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            + Jadwal Asisten
          </button>
          <button
            type="button"
            onClick={fetchAllUsers}
            disabled={loading}
            className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600 disabled:opacity-60"
          >
            {loading ? "Muat..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Search + Role Filter */}
      <div className="flex w-full gap-2">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari NIM/Nama/Email/Role…"
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
          aria-label="Kolom pencarian"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-600"
          aria-label="Filter role"
          title="Filter role"
        >
          <option value="ALL">Semua Role</option>
          <option value="admin">Admin</option>
          <option value="asisten">Asisten</option>
        </select>
      </div>

      {/* Error */}
      {error && rows.length === 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabel */}
      <Table columns={columns} data={rows} />
    </div>
  );
}
