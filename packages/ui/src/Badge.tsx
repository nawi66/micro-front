import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/cn.js";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-surface-sunken text-fg-muted",
        primary: "bg-primary/15 text-primary",
        success: "bg-success/15 text-success",
        warning: "bg-warning/20 text-warning",
        danger: "bg-danger/15 text-danger",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}