export function Table({ columns, data }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/40">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-slate-900/70 backdrop-blur">
          <tr className="text-slate-300">
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 text-left font-semibold">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:hover]:bg-white/5">
          {data.map((row, i) => (
            <tr key={i} className="border-t border-white/10 odd:bg-white/5">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-4 py-3 ${
                    c.align === "right" ? "text-right" : ""
                  }`}
                >
                  {c.render ? c.render(row[c.key], row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
