import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Separator } from "./separator";

const markerVariants = cva("flex items-center gap-2 text-[11px] font-bold", {
  variants: {
    variant: {
      separator: "",
    },
  },
  defaultVariants: {
    variant: "separator",
  },
});

interface MarkerProps extends VariantProps<typeof markerVariants> {
  children: ReactNode;
  className?: string;
}

/** A centered label flanked by a horizontal rule on each side -- a date
 * divider for any list grouped under a heading. Wrap the label in
 * `MarkerContent` so it isn't stretched flush against the rules. */
export default function Marker({ variant, className, children }: MarkerProps) {
  return (
    <div className={cn(markerVariants({ variant }), className)}>
      <Separator className="flex-1" />
      {children}
      <Separator className="flex-1" />
    </div>
  );
}

export function MarkerContent({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn("shrink-0", className)}>{children}</span>;
}
