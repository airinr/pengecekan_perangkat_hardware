import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AddJadwalAsisten() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nim: "",
    nama: "",
    jadwal: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Simulasi API call untuk menambah jadwal asisten
      // Ganti dengan API yang sesuai
      console.log("Menambah jadwal asisten:", formData);
      // await fetch(`${API_BASE}/jadwal/add`, { ... });

      // Redirect kembali ke daftar jadwal
      navigate("/jadwal_asisten");
    } catch (err) {
      console.error(err);
      setError("Gagal menambah jadwal asisten.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:ml-56 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">
          Tambah Jadwal Asisten
        </h1>
        <button
          type="button"
          onClick={() => navigate("/jadwal_asisten")}
          className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600"
        >
          Kembali
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300">
            NIM
          </label>
          <input
            type="text"
            name="nim"
            value={formData.nim}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">
            Nama
          </label>
          <input
            type="text"
            name="nama"
            value={formData.nama}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">
            Jadwal
          </label>
          <textarea
            name="jadwal"
            value={formData.jadwal}
            onChange={handleChange}
            required
            rows={4}
            className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-600"
          />
        </div>
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
      </form>
    </div>
  );
}
