import { type TextareaHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-[var(--color-text-primary)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={Boolean(error)}
          className={cn(
            "w-full resize-y rounded-lg border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)]",
            "placeholder:text-[var(--color-text-tertiary)]",
            "transition-colors duration-150 outline-none",
            "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
            "focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]",
            error && "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]",
            className,
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-[var(--color-danger)]">{error}</p>
        ) : hint ? (
          <p className="text-xs text-[var(--color-text-tertiary)]">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
