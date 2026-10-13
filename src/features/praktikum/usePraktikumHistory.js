import { useEffect, useState } from "react";
import { fetchHistoryStatus, fetchPraktikumHistory } from "./api";
import {
  getClassName,
  getDosenName,
  getHistoryId,
  getUserName,
  isSameLab,
  toAbsoluteUrl,
} from "./helpers";
import { STATUS_INCOMPLETE } from "./constants";

export function usePraktikumHistory(kodePraktikum, labCode) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!kodePraktikum || !labCode) {
      setRows([]);
      return;
    }
    const controller = new AbortController();
    let alive = true;

    (async () => {
      setRows([]);
      setLoading(true);
      setErr("");
      try {
        const payload = await fetchPraktikumHistory(
          kodePraktikum,
          labCode,
          controller.signal,
        );
        const data = payload.filter((h) => isSameLab(h, labCode));
        const statusList = await Promise.all(
          data.map((h) => {
            const hid = getHistoryId(h);
            if (!hid || controller.signal.aborted) return STATUS_INCOMPLETE;
            return fetchHistoryStatus(hid);
          }),
        );
        if (!alive) return;
        setRows(
          data.map((h, i) => ({
            raw: h,
            idHistory: getHistoryId(h),
            tgl: h?.tanggal ?? "",
            kelas: getClassName(h),
            waktu: h?.waktu ?? "",
            dosen: getDosenName(h),
            asisten: getUserName(h) || "—",
            ttdUrl: toAbsoluteUrl(h?.ttd),
            tindak_lanjut: h?.tindakLanjut ?? "",
            statusText: statusList[i],
          })),
        );
      } catch (e) {
        if (e?.name === "AbortError") return;
        if (alive) {
          setErr(e?.message || "Gagal memuat histori praktikum");
          setRows([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [kodePraktikum, labCode]);

  return { rows, loading, err };
}
