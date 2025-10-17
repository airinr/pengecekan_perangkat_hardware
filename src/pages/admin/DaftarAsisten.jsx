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

export default function DaftarAsisten() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("list"); // "list" | "aktivasi"
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL"); // ALL | admin | asisten

  const [users, setUsers] = useState([]); // semua user (aktif)
  const [pending, setPending] = useState([]); // semua user pending
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

      const pendingAll = norm
        .filter((u) => u.isActive !== true)
        .sort((a, b) => String(a.nim).localeCompare(String(b.nim)));

      // hanya update jika ini masih request terbaru
      if (myId !== reqRef.current) return;
      setUsers(aktif);
      setPending(pendingAll);
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

  // COLUMNS: List (semua user aktif)
  const columnsList = useMemo(
    () => [
      { key: "no", header: "#" },
      { key: "nim", header: "NIM" },
      { key: "nama", header: "Nama" },
      { key: "email", header: "Email" },
      { key: "role", header: "Role" },
      // tombol aktivitas di-nonaktifkan
      // {
      //   key: "aksi",
      //   header: "",
      //   render: (_, row) => (
      //     <div className="flex justify-end">
      //       <button
      //         type="button"
      //         onClick={() => navigate(`/daftar_asisten/${row.nim}/aktivitas`)}
      //         className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600"
      //         aria-label={`Lihat aktivitas ${row.nama}`}
      //       >
      //         Lihat Aktivitas
      //       </button>
      //     </div>
      //   ),
      // },
    ],
    [navigate]
  );

  // COLUMNS: Pending (semua user status Pending)
  const columnsAktivasi = useMemo(
    () => [
      { key: "no", header: "#" },
      { key: "nim", header: "NIM" },
      { key: "nama", header: "Nama" },
      { key: "email", header: "Email" },
      { key: "role", header: "Role" },
      {
        key: "aksi",
        header: "",
        render: (_, row) => (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => handleActivate(row.idUser)}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Activate
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // Aktivasi
  async function handleActivate(idUser) {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_BASE}/auth/changeStatus/${encodeURIComponent(idUser)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...NGROK_HEADERS,
          },
          body: JSON.stringify({ isActive: true }),
        }
      );

      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({})))?.message ||
          "Gagal mengaktifkan pengguna";
        throw new Error(msg);
      }

      // Optimistic update
      setPending((prev) => {
        const item = prev.find((a) => a.idUser === idUser);
        if (item) {
          setUsers((prevUsers) => {
            if (prevUsers.some((x) => x.idUser === item.idUser))
              return prevUsers;
            const next = [
              ...prevUsers,
              { ...item, isActive: true, status: "Active" },
            ];
            next.sort((a, b) => String(a.nim).localeCompare(String(b.nim)));
            return next;
          });
        }
        return prev.filter((a) => a.idUser !== idUser);
      });
    } catch (e) {
      console.error(e);
      setError(e?.message || "Gagal mengubah status.");
      fetchAllUsers(); // sinkron ulang
    }
  }

  // FILTER & SEARCH: aktif
  const rowsList = useMemo(() => {
    let base = users.map((u, i) => ({
      no: i + 1,
      idUser: u.idUser,
      nim: u.nim,
      nama: u.nama,
      email: u.email || "-",
      role: u.role || "other",
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

  // FILTER & SEARCH: pending
  const rowsAktivasi = useMemo(() => {
    let base = pending.map((u, i) => ({
      no: i + 1,
      idUser: u.idUser,
      nim: u.nim,
      nama: u.nama,
      email: u.email,
      role: u.role || "other",
      status: "Pending",
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
  }, [q, pending, roleFilter]);

  const isListTab = tab === "list";

  return (
    <div className="p-4 lg:ml-56 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Data Pengguna</h1>
        <div className="flex items-center gap-2">
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

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          className={`rounded-xl px-4 py-2 text-sm font-medium ${
            isListTab
              ? "bg-slate-200 text-slate-900 dark:bg-slate-100"
              : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
          onClick={() => setTab("list")}
          type="button"
        >
          Semua User (Aktif)
        </button>
        <button
          className={`rounded-xl px-4 py-2 text-sm font-medium ${
            !isListTab
              ? "bg-slate-200 text-slate-900 dark:bg-slate-100"
              : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
          onClick={() => setTab("aktivasi")}
          type="button"
        >
          Pending Aktivasi
        </button>
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

      {/* Error: tampil hanya jika tab aktif kosong */}
      {error &&
        ((isListTab && rowsList.length === 0) ||
          (!isListTab && rowsAktivasi.length === 0)) && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

      {/* Tabel */}
      {isListTab ? (
        <Table columns={columnsList} data={rowsList} />
      ) : (
        <Table columns={columnsAktivasi} data={rowsAktivasi} />
      )}
    </div>
  );
}
