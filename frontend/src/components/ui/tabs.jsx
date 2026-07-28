import { cn } from "../../lib/utils";

const Tabs = ({ value, onChange, tabs, className, variant = "default" }) => {
  const variants = {
    default: "border-b border-border-primary",
    pills: "bg-surface-tertiary rounded-lg p-1",
    underline: "gap-0",
  };

  const getTabClass = (tabKey) => {
    const base = {
      default: cn(
        "px-4 py-2.5 text-sm font-medium transition-all duration-150 relative",
        "hover:text-text-primary",
        value === tabKey
          ? "text-brand-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-600 after:rounded-full"
          : "text-text-tertiary",
      ),
      pills: cn(
        "px-4 py-2 text-sm font-medium rounded-md transition-all duration-150",
        value === tabKey
          ? "bg-surface text-text-primary shadow-soft"
          : "text-text-tertiary hover:text-text-primary",
      ),
      underline: cn(
        "px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2",
        value === tabKey
          ? "text-brand-600 border-brand-600"
          : "text-text-tertiary border-transparent hover:text-text-primary hover:border-text-tertiary",
      ),
    };
    return base[variant] || base.default;
  };

  return (
    <div className={cn("flex", variants[variant] || variants.default, className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange?.(tab.key)}
          className={getTabClass(tab.key)}
        >
          <span className="flex items-center gap-2">
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                value === tab.key
                  ? "bg-brand-100 text-brand-700"
                  : "bg-surface-tertiary text-text-tertiary",
              )}>
                {tab.count}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
};

export { Tabs };
