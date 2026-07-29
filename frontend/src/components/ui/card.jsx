import { cn } from "../../lib/utils";

const elevations = {
  none: "",
  sm: "shadow-soft",
  md: "shadow-card",
  lg: "shadow-elevated",
  xl: "shadow-dialog",
};

const Card = ({ className, elevation = "sm", hover, ...props }) => (
  <div
    className={cn(
      "rounded-xl border border-border-primary bg-surface",
      elevations[elevation] || elevations.sm,
      hover && "transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5",
      className,
    )}
    {...props}
  />
);

const CardHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col gap-1 px-6 pt-6 pb-0", className)} {...props} />
);

const CardTitle = ({ className, size = "md", ...props }) => {
  const s = { sm: "text-sm font-semibold", md: "text-base font-semibold", lg: "text-lg font-semibold" };
  return <h3 className={cn("text-text-primary", s[size], className)} {...props} />;
};

const CardDescription = ({ className, ...props }) => (
  <p className={cn("text-sm text-text-tertiary", className)} {...props} />
);

const CardContent = ({ className, ...props }) => (
  <div className={cn("p-6", className)} {...props} />
);

const CardFooter = ({ className, ...props }) => (
  <div className={cn("flex items-center gap-3 px-6 pb-6 pt-0", className)} {...props} />
);

const CardStat = ({ label, value, trend, icon: Icon, className }) => (
  <div className={cn("flex items-start gap-4", className)}>
    {Icon && <div className="shrink-0 w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
      <Icon className="w-5 h-5 text-brand-600" />
    </div>}
    <div className="min-w-0">
      <p className="text-sm text-text-tertiary">{label}</p>
      <p className="text-2xl font-semibold text-text-primary mt-0.5">{value}</p>
      {trend !== undefined && trend !== null && (
        <p className={cn("text-xs mt-0.5", trend >= 0 ? "text-emerald-600" : "text-red-600")}>
          {trend >= 0 ? "+" : ""}{trend}%
        </p>
      )}
    </div>
  </div>
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardStat, elevations };
