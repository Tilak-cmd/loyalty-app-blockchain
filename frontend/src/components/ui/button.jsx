import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { Loader } from "lucide-react";

const variants = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-soft active:bg-brand-800",
  secondary: "bg-surface text-text-primary border border-border-primary hover:bg-surface-hover active:bg-surface-tertiary",
  tertiary: "text-text-secondary hover:text-text-primary hover:bg-surface-hover",
  destructive: "bg-red-600 text-white hover:bg-red-700 shadow-soft active:bg-red-800",
  ghost: "text-text-secondary hover:text-text-primary",
  link: "text-brand-600 hover:text-brand-700 underline-offset-4 hover:underline",
};

const sizes = {
  xs: "h-7 px-2.5 text-xs gap-1.5",
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  xl: "h-14 px-8 text-base gap-2.5",
  iconXs: "h-7 w-7",
  iconSm: "h-9 w-9",
  iconMd: "h-10 w-10",
  iconLg: "h-12 w-12",
};

const Button = forwardRef(({
  className, variant = "primary", size = "md", loading, disabled, children, icon: Icon, ...props
}, ref) => {
  const isIcon = size.startsWith("icon");
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
        "disabled:opacity-50 disabled:pointer-events-none",
        "select-none",
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        loading && "cursor-wait",
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader className={cn("animate-spin", isIcon ? "w-4 h-4" : "w-4 h-4 shrink-0")} />
      ) : Icon ? (
        <Icon className={cn(isIcon ? "w-4 h-4" : "w-4 h-4 shrink-0")} />
      ) : null}
      {!isIcon && (loading ? "Loading..." : children)}
    </button>
  );
});
Button.displayName = "Button";

export { Button, variants, sizes };
