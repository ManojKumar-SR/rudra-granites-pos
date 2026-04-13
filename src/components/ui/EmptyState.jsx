export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <span className="text-gray-300 mb-3">{icon}</span>
    <h3 className="text-sm font-medium text-gray-600">{title}</h3>
    <p className="text-xs text-gray-400 mt-1 max-w-xs">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);