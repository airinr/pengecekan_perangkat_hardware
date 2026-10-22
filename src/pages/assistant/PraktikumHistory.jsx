import { Navigate, useParams } from "react-router-dom";
import {
  HISTORY_COLUMNS,
  PRAKTIKUMS,
  labCodeFromShort,
  labNameFromCode,
  laporanPath,
  praktikumCodeFromSlug,
  praktikumNameFromCode,
} from "@/features/praktikum/constants";
import { usePraktikumHistory } from "@/features/praktikum/usePraktikumHistory";
import { historiPath } from "@/features/praktikum/constants";
import CategorySelect from "@/components/ui/CategorySelect";
import ExportCsvPanel from "@/components/ui/ExportCsvPanel";
import StatusBadge from "@/components/ui/StatusBadge";
import TablePage from "@/components/ui/TablePage";
import { useNavigate } from "react-router-dom";

// Satu komponen pengganti 8 file lab609/*/lab610/*.
export default function PraktikumHistory() {
  const { labId, slug } = useParams();
  const navigate = useNavigate();

  const labCode = labCodeFromShort(labId);
  const kodePraktikum = praktikumCodeFromSlug(slug);

  if (!labCode || !kodePraktikum || !PRAKTIKUMS[slug]) {
    return <Navigate to="/dashboard_asisten" replace />;
  }

  return (
    <PraktikumHistoryView
      labShort={labId}
      labCode={labCode}
      slug={slug}
      kodePraktikum={kodePraktikum}
      onDetail={(idHistory) => navigate(historiPath(idHistory))}
    />
  );
}

function PraktikumHistoryView({
  labShort,
  labCode,
  slug,
  kodePraktikum,
  onDetail,
}) {
  const { rows, loading, err } = usePraktikumHistory(kodePraktikum, labCode);
  const labName = labNameFromCode(labCode);
  const praktikumName = praktikumNameFromCode(kodePraktikum);

  const columns = HISTORY_COLUMNS.map((c) => {
    if (c.key === "status")
      return { ...c, render: (v) => <StatusBadge value={v} /> };
    if (c.key === "ttd")
      return {
        ...c,
        render: (v, row) =>
          row.ttdUrl ? (
            <a href={row.ttdUrl} target="_blank" rel="noreferrer">
              <img
                src={row.ttdUrl}
                alt="TTD"
                className="h-10 w-10 rounded object-cover border border-slate-700"
              />
            </a>
          ) : (
            "—"
          ),
      };
    if (c.key === "aksi")
      return {
        ...c,
        render: (_v, row) => (
          <button
            type="button"
            onClick={() => row.idHistory && onDetail(row.idHistory)}
            disabled={!row.idHistory}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-slate-700 ${
              row.idHistory
                ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
                : "bg-slate-800/50 text-slate-400 cursor-not-allowed"
            }`}
          >
            Detail
          </button>
        ),
      };
    return c;
  });

  const tableRows = rows.map((r, i) => ({
    ...r,
    no: i + 1,
    status: r.statusText,
    ttd: r.ttdUrl,
  }));

  return (
    <div className="px-3 sm:px-6 lg:px-8 pt-16 sm:pt-6 pb-6">
      <CategorySelect labShort={labShort} />
      <ExportCsvPanel
        title={`Export CSV histori praktikum (${praktikumName} — ${labName})`}
        rows={rows}
        labCode={labCode}
        kodePraktikum={kodePraktikum}
      />
      <TablePage
        title={`${praktikumName} — ${labName}`}
        addRoute={laporanPath(labShort, slug)}
        addLabel={`+ Lakukan pelaporan praktikum ${praktikumName}`}
        columns={columns}
        rows={tableRows}
        note={
          loading
            ? "Memuat histori praktikum…"
            : err
              ? `Error: ${err}`
              : rows.length === 0
                ? "Belum ada histori. Silakan buat laporan pertama."
                : `*Berikut merupakan laporan terakhir (${labName})`
        }
      />
    </div>
  );
}
