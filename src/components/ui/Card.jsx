export const Card = ({ children, className = "", title, actions }) => (
  <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
    {(title || actions) && (
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        {title && <h3 className="text-sm font-semibold text-gray-800">{title}</h3>}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )}
    {children}
  </div>
);