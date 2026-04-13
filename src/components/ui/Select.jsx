export const Select = ({ label, options, className = "", ...props }) => (
  <div className={className}>
    {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}
    <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-gray-400" {...props}>
      <option value="">Select...</option>
      {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>
);