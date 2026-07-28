import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Inbox } from "lucide-react";

const EmptyState = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}) => (
  <div className={cn("flex flex-col items-center justify-center py-12 px-6 text-center", className)}>
    <div className="w-12 h-12 rounded-xl bg-surface-tertiary flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-text-tertiary" />
    </div>
    <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
    {description && (
      <p className="text-sm text-text-tertiary max-w-sm">{description}</p>
    )}
    {action && (
      <div className="mt-4">
        <Button size="sm" {...action.props}>
          {action.label}
        </Button>
      </div>
    )}
  </div>
);

const ErrorState = ({ title = "Something went wrong", description, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
    <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
      <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    </div>
    <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
    {description && <p className="text-sm text-text-tertiary max-w-sm mb-4">{description}</p>}
    {onRetry && (
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Try Again
      </Button>
    )}
  </div>
);

const LoadingState = ({ title = "Loading...", description }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
    <div className="w-10 h-10 rounded-xl bg-surface-tertiary flex items-center justify-center mb-4">
      <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
    <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
    {description && <p className="text-sm text-text-tertiary mt-1">{description}</p>}
  </div>
);

export { EmptyState, ErrorState, LoadingState };
