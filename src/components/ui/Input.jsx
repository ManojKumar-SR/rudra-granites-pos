export const Input = ({ label, error, className = "", ...props }) => (
  <div className={className}>
    {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}
    <input className={`w-full px-3 py-2 text-sm border rounded-md bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${error ? "border-red-300" : "border-gray-300"}`} {...props} />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);