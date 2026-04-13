export const Table = ({ columns, data, onRowClick, emptyMsg = "No data found" }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100">
          {columns.map((c) => <th key={c.key} className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${c.align === "right" ? "text-right" : ""}`}>{c.label}</th>)}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {data.length === 0 ? (
          <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">{emptyMsg}</td></tr>
        ) : data.map((row, i) => (
          <tr key={row.id || i} className={`${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""} transition-colors`} onClick={() => onRowClick?.(row)}>
            {columns.map((c) => <td key={c.key} className={`px-4 py-3 ${c.align === "right" ? "text-right tabular-nums" : ""} ${c.className || ""}`}>{c.render ? c.render(row) : row[c.key]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);