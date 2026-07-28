import { cn } from "../../lib/utils";
import { X } from "lucide-react";

const variants = {
  default: "bg-gray-100 text-gray-700",
  brand: "bg-brand-50 text-brand-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
  premium: "bg-gradient-to-r from-brand-500 to-emerald-500 text-white",
};

const sizes = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-xs",
  lg: "px-2.5 py-1 text-sm",
};

const Badge = ({ className, variant = "default", size = "md", dot, removable, onRemove, children, ...props }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-md font-medium whitespace-nowrap",
      variants[variant] || variants.default,
      sizes[size] || sizes.md,
      className,
    )}
    {...props}
  >
    {dot && (
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        variant === "success" ? "bg-emerald-500" :
        variant === "warning" ? "bg-amber-500" :
        variant === "danger" ? "bg-red-500" :
        variant === "brand" ? "bg-brand-500" :
        variant === "info" ? "bg-blue-500" :
        "bg-gray-400"
      )} />
    )}
    {children}
    {removable && (
      <button onClick={onRemove} className="ml-0.5 hover:opacity-70 transition-opacity">
        <X className="w-3 h-3" />
      </button>
    )}
  </span>
);

export { Badge, variants as badgeVariants };
