export const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex border-b border-gray-200 overflow-x-auto">
    {tabs.map((t) => (
      <button key={t.key} onClick={() => onChange(t.key)}
        className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${active === t.key ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
        {t.label}
      </button>
    ))}
  </div>
);