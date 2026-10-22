import React from "react";

export function Table({ columns = [], data = [], emptyMessage, emptySubtext }) {
  const isEmpty = !Array.isArray(data) || data.length === 0;

  return (
    <div className="w-full">
      {/* Mobile scroll hint */}
      {!isEmpty && (
        <div className="flex sm:hidden items-center justify-between text-[11px] text-slate-400 px-2 py-1.5 mb-1.5">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
            Tabel dapat digeser menyamping
          </span>
          <span className="text-blue-400 font-medium">Geser →</span>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur shadow-sm">
        <table className="min-w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-800/80 text-slate-300 border-b border-white/10 backdrop-blur sticky top-0 z-10">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-4 py-3.5 font-semibold text-[11px] sm:text-xs uppercase tracking-wider text-slate-300 whitespace-nowrap ${
                    c.align === "right"
                      ? "text-right"
                      : c.align === "center"
                      ? "text-center"
                      : "text-left"
                  }`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {isEmpty ? (
              <tr>
                <td colSpan={columns.length || 1} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 grid place-items-center mb-3 border border-white/10">
                      <svg
                        className="w-6 h-6 opacity-80"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="text-sm font-semibold text-slate-200">
                      {emptyMessage || "Tidak ada data yang ditemukan"}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 max-w-sm">
                      {emptySubtext || "Belum ada catatan atau data yang sesuai dengan pencarian saat ini."}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={row.id ?? row.idHistory ?? i}
                  className="hover:bg-white/[0.04] transition-colors duration-150 odd:bg-white/[0.015]"
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-4 py-3.5 text-slate-200 align-middle ${
                        c.align === "right"
                          ? "text-right"
                          : c.align === "center"
                          ? "text-center"
                          : "text-left"
                      }`}
                    >
                      {c.render ? c.render(row[c.key], row) : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
