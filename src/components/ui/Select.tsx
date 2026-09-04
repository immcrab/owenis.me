import { ChevronDown } from "lucide-react";
import { type SelectHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, hint, error, id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-[var(--color-text-primary)]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "h-10 w-full appearance-none rounded-lg border bg-[var(--color-surface)] px-3 pr-9 text-sm text-[var(--color-text-primary)]",
              "transition-colors duration-150 outline-none",
              "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
              "focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]",
              error && "border-[var(--color-danger)]",
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
          />
        </div>
        {error ? (
          <p className="text-xs text-[var(--color-danger)]">{error}</p>
        ) : hint ? (
          <p className="text-xs text-[var(--color-text-tertiary)]">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Select.displayName = "Select";
