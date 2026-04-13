export const Button = ({ children, variant = "primary", size = "md", onClick, disabled, className = "", type = "button" }) => {
  const base = "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-500",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-400",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost: "text-gray-600 hover:bg-gray-100 focus:ring-gray-400",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500",
  };
  const sizes = { sm: "px-2.5 py-1.5 text-xs gap-1", md: "px-3.5 py-2 text-sm gap-1.5", lg: "px-5 py-2.5 text-base gap-2" };
  return <button type={type} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} onClick={onClick} disabled={disabled}>{children}</button>;
};