export const SearchBar = ({ value, onChange, placeholder = "Search..." }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Icons.search size={14} /></span>
    <input className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
      placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);