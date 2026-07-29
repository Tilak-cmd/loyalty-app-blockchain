import { cn } from "../../lib/utils";

const Progress = ({ value = 0, max = 100, size = "md", variant = "default", className, showLabel }) => {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = { sm: "h-1.5", md: "h-2", lg: "h-3" };
  const variants = {
    default: "bg-brand-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    gradient: "bg-gradient-to-r from-brand-500 to-emerald-500",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("flex-1 rounded-full bg-surface-tertiary overflow-hidden", sizes[size] || sizes.md)}>
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", variants[variant] || variants.default)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-text-tertiary shrink-0">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
};

const TierProgress = ({ current, next, label, points, nextPoints, className }) => {
  const pct = nextPoints > 0 ? Math.min((points / nextPoints) * 100, 100) : 0;
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-text-primary">{label || current}</span>
        <span className="text-text-tertiary">{points.toLocaleString()} / {nextPoints.toLocaleString()} pts</span>
      </div>
      <Progress value={points} max={nextPoints} variant="gradient" size="md" />
      {next && <p className="text-xs text-text-tertiary">{next.toLocaleString()} points to {next}</p>}
    </div>
  );
};

export { Progress, TierProgress };
