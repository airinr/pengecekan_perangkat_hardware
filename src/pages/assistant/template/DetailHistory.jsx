// src/pages/BiosPartisiDetail.jsx
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TablePage from "../template/TableTemplate";

const API_BASE = import.meta.env.VITE_API_URL || "";
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

// Kolom sesuai data detail history (mengacu ke screenshot)
const columns = [
  { key: "no", header: "#" },
  { key: "idDataLab", header: "ID Data Lab" },
  { key: "namaBarang", header: "Nama Barang" },
  { key: "jumlahAwal", header: "Jumlah Awal" },
  { key: "jumlahAkhir", header: "Jumlah Akhir" },
  { key: "jumlahRusak", header: "Jumlah Rusak" },
];

// helper aman ambil nested value
const getIdDataLab = (it) =>
  it?.idDataLab ?? it?.dataLabModel?.idDataLab ?? it?.dataLabModel?.kode ?? "";

const getNamaBarang = (it) =>
  it?.namaBarang ??
  it?.barang?.nama ??
  it?.barangModel?.namaBarang ??
  it?.dataLabModel?.namaBarang ??
  it?.dataLabModel?.barangModel?.namaBarang ??
  "";

export default function DetailHistory() {
  const { idHistory } = useParams(); // route: /history_detail/:idHistory
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `${API_BASE}/praktikum/getDetailHistory/${encodeURIComponent(
            idHistory || ""
          )}`,
          {
            headers: {
              Accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              ...NGROK_HEADERS,
            },
          }
        );

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Gagal memuat detail history (${res.status})`);
        }

        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : [];

        const mapped = list.map((it, i) => ({
          no: i + 1,
          idDataLab: getIdDataLab(it),
          namaBarang: getNamaBarang(it),
          jumlahAwal: it?.jumlahAwal ?? "",
          jumlahAkhir: it?.jumlahAkhir ?? "",
          jumlahRusak: it?.jumlahRusak ?? "",
        }));

        if (alive) setRows(mapped);
      } catch (e) {
        console.error(e);
        if (alive) setErr(e?.message || "Gagal memuat detail history");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [idHistory]);

  return (
    <TablePage
      title={`Detail History`}
      addRoute={undefined}
      addLabel={undefined}
      enableSearch={false}
      columns={columns}
      rows={rows}
      note={
        loading
          ? "Memuat detail histori…"
          : err
          ? `Error: ${err}`
          : rows.length === 0
          ? "Belum ada data detail untuk ditampilkan."
          : "*Berikut detail histori"
      }
    />
  );
}
