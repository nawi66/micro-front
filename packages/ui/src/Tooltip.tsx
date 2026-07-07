import { useId, useState, type ReactNode } from "react";
import { cn } from "./lib/cn.js";

export interface TooltipProps {
  /** The element that reveals the tooltip on hover/focus. */
  children: ReactNode;
  /** Tooltip contents — text or arbitrary nodes (e.g. a small panel). */
  content: ReactNode;
  /** Horizontal edge the panel aligns to. Defaults to `end` (right-aligned). */
  align?: "start" | "end";
  className?: string;
}

/**
 * A lightweight hover/focus tooltip. No external dependency. The trigger and
 * panel share a group so the panel shows while either is hovered, and it opens
 * on keyboard focus for accessibility (`role="tooltip"`).
 */
export function Tooltip({ children, content, align = "end", className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open && (
        <div
          id={id}
          role="tooltip"
          className={cn(
            "absolute top-full z-50 mt-2 min-w-max rounded-card border border-glass-border bg-glass-raised p-3 text-sm text-fg shadow-xl shadow-black/10 backdrop-blur-xl",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
