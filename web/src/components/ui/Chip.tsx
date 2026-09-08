import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Chip.module.css";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  /** "grid" is the bigger, non-scrolling style used by the Exam cycle picker
   * and Notes subject picker; "row" (default) is the compact filter-chip
   * style used in horizontal-scroll rows. */
  size?: "row" | "grid";
  children: ReactNode;
}

export function Chip({ active, size = "row", className, children, ...rest }: ChipProps) {
  const cls = [styles.chip, size === "grid" && styles.grid, active && styles.active, className]
    .filter(Boolean)
    .join(" ");
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}

export function ChipRow({
  className,
  wrap,
  children,
}: {
  className?: string;
  /** Wraps to multiple lines instead of horizontally scrolling -- for a "grid" of Chips. */
  wrap?: boolean;
  children: ReactNode;
}) {
  const cls = [styles.row, wrap && styles.gridRow, className].filter(Boolean).join(" ");
  return <div className={cls}>{children}</div>;
}
