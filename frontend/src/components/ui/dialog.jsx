import { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";

const Dialog = ({ open, onClose, children, className, size = "md" }) => {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === "Escape") onClose?.(); };
    if (open) window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[calc(100%-2rem)]",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }}
      />
      <div className={cn(
        "relative w-full bg-surface rounded-2xl shadow-dialog border border-border-primary",
        "animate-scale-in",
        sizes[size] || sizes.md,
        "max-h-[90vh] flex flex-col",
        className,
      )}>
        {children}
      </div>
    </div>
  );
};

const DialogHeader = ({ className, onClose, children, ...props }) => (
  <div className={cn("flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-border-primary", className)} {...props}>
    <div className="space-y-1 min-w-0">{children}</div>
    {onClose && (
      <button
        onClick={onClose}
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-hover transition-colors"
      >
        <X className="w-4 h-4 text-text-tertiary" />
      </button>
    )}
  </div>
);

const DialogTitle = ({ className, ...props }) => (
  <h2 className={cn("text-lg font-semibold text-text-primary", className)} {...props} />
);

const DialogDescription = ({ className, ...props }) => (
  <p className={cn("text-sm text-text-tertiary", className)} {...props} />
);

const DialogContent = ({ className, ...props }) => (
  <div className={cn("px-6 py-4 overflow-y-auto flex-1", className)} {...props} />
);

const DialogFooter = ({ className, ...props }) => (
  <div className={cn("flex items-center justify-end gap-3 px-6 pt-4 pb-6 border-t border-border-primary", className)} {...props} />
);

export { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter };
