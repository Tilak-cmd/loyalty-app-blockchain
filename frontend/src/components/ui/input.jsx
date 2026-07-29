import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const Input = forwardRef(({ className, error, icon: Icon, ...props }, ref) => (
  <div className="relative">
    {Icon && (
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Icon className="w-4 h-4 text-text-tertiary" />
      </div>
    )}
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-lg border bg-surface px-3 py-2 text-sm placeholder:text-text-tertiary",
        "transition-all duration-150",
        "focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-tertiary",
        error ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" : "border-border-primary",
        Icon && "pl-10",
        className,
      )}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
));
Input.displayName = "Input";

const Label = ({ className, required, ...props }) => (
  <label className={cn("block text-sm font-medium text-text-primary mb-1.5", className)} {...props}>
    {props.children}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const Select = forwardRef(({ className, error, options, placeholder, ...props }, ref) => (
  <div>
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-lg border bg-surface px-3 py-2 text-sm",
        "transition-all duration-150",
        "focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        error ? "border-red-300" : "border-border-primary",
        className,
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options?.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
));
Select.displayName = "Select";

const Textarea = forwardRef(({ className, error, ...props }, ref) => (
  <div>
    <textarea
      ref={ref}
      className={cn(
        "flex w-full rounded-lg border bg-surface px-3 py-2 text-sm placeholder:text-text-tertiary",
        "transition-all duration-150 min-h-[80px]",
        "focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        error ? "border-red-300" : "border-border-primary",
        className,
      )}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
));
Textarea.displayName = "Textarea";

export { Input, Label, Select, Textarea };
