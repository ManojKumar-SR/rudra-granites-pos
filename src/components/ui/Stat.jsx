export const Stat = ({ label, value, sub, icon, trend }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      {icon && <span className="text-gray-400">{icon}</span>}
    </div>
    <div className="text-xl font-bold text-gray-900">{value}</div>
    {(sub || trend) && (
      <div className="flex items-center gap-1 mt-1">
        {trend && <span className={`text-xs font-medium ${trend > 0 ? "text-emerald-600" : "text-red-600"}`}>{trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%</span>}
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
      </div>
    )}
  </div>
);