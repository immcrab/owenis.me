import { type InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: string;
  suffix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, prefix, suffix, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text-primary)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="pointer-events-none absolute left-3 text-sm text-[var(--color-text-tertiary)]">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            className={cn(
              "h-10 w-full rounded-lg border bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)]",
              "placeholder:text-[var(--color-text-tertiary)]",
              "transition-colors duration-150 outline-none",
              "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
              "focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]",
              error && "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]",
              prefix && "pl-8",
              suffix && "pr-9",
              className,
            )}
            {...props}
          />
          {suffix && <span className="absolute right-3 flex items-center">{suffix}</span>}
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
Input.displayName = "Input";
