import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TablePage from "@/components/ui/TablePage";
import { fetchDetailHistory } from "@/features/praktikum/api";

const columns = [
  { key: "no", header: "#" },
  { key: "idDataLab", header: "ID Data Lab" },
  { key: "namaBarang", header: "Nama Barang" },
  { key: "jumlahAwal", header: "Jumlah Awal" },
  { key: "jumlahAkhir", header: "Jumlah Akhir" },
  { key: "jumlahRusak", header: "Jumlah Rusak" },
  { key: "catatan", header: "Catatan" },
];

const getIdDataLab = (it) =>
  it?.idDataLab ?? it?.dataLabModel?.idDataLab ?? it?.dataLabModel?.kode ?? "";

const getNamaBarang = (it) =>
  it?.namaBarang ??
  it?.barang?.nama ??
  it?.barangModel?.namaBarang ??
  it?.dataLabModel?.namaBarang ??
  it?.dataLabModel?.barangModel?.namaBarang ??
  "";

export default function HistoryDetail() {
  const { idHistory } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const list = await fetchDetailHistory(idHistory || "");
        if (alive) {
          setRows(
            list.map((it, i) => ({
              no: i + 1,
              idDataLab: getIdDataLab(it),
              namaBarang: getNamaBarang(it),
              jumlahAwal: it?.jumlahAwal ?? "",
              jumlahAkhir: it?.jumlahAkhir ?? "",
              jumlahRusak: it?.jumlahRusak ?? "",
              catatan: it?.catatan ?? "—",
            })),
          );
        }
      } catch (e) {
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
      title="Detail History"
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
