import { cn } from "../../lib/utils";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

const Table = ({ className, ...props }) => (
  <div className="w-full overflow-auto">
    <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
);

const THead = ({ className, ...props }) => (
  <thead className={cn("border-b border-border-primary", className)} {...props} />
);

const TBody = ({ className, ...props }) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);

const TRow = ({ className, clickable, ...props }) => (
  <tr
    className={cn(
      "border-b border-border-primary transition-colors",
      clickable ? "cursor-pointer hover:bg-surface-hover" : "",
      className,
    )}
    {...props}
  />
);

const THeadCell = ({ className, sortable, sortDir, onSort, ...props }) => {
  const Component = sortable ? "button" : "th";
  return (
    <th
      className={cn(
        "h-11 px-4 text-left align-middle font-medium text-text-tertiary text-xs uppercase tracking-wider",
        sortable && "cursor-pointer hover:text-text-secondary select-none",
        className,
      )}
      onClick={sortable ? onSort : undefined}
      scope="col"
    >
      <Component className="flex items-center gap-1.5">
        {props.children}
        {sortable && (
          sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> :
          sortDir === "desc" ? <ChevronDown className="w-3.5 h-3.5" /> :
          <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" />
        )}
      </Component>
    </th>
  );
};

const TCell = ({ className, ...props }) => (
  <td className={cn("p-4 align-middle text-text-secondary", className)} {...props} />
);

export { Table, THead, TBody, TRow, THeadCell, TCell };
