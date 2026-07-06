import { forwardRef } from "react";
import { cn } from "./lib/cn.js";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "flex h-11 w-full rounded-md border border-glass-border bg-glass-raised px-3.5 py-2 text-sm text-fg backdrop-blur-md transition-colors",
        "placeholder:text-fg-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        invalid && "border-danger focus-visible:border-danger focus-visible:ring-danger/40",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
