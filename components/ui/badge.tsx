import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-ink)]",
        secondary:
          "border-[var(--line)] bg-[var(--surface-alt)] text-[var(--muted)]",
        outline: "border-[var(--line-strong)] text-[var(--text)]",
        accent:
          "border-[color-mix(in_srgb,var(--accent)_50%,transparent)] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
