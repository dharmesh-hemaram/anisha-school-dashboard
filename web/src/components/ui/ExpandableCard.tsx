import { useState, type ReactNode } from "react";
import Card from "./Card";
import styles from "./ExpandableCard.module.css";

interface ExpandableCardProps {
  /** The always-visible, clickable header row. Receives the current open state. */
  header: (open: boolean) => ReactNode;
  /** Body content, only rendered while expanded. */
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** The shared "surface card with a clickable header that expands a body
 * below a dashed divider" pattern behind the Upcoming tab's action cards
 * and the Feed tab's items. */
export default function ExpandableCard({ header, children, className, bodyClassName }: ExpandableCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <Card className={className}>
      <div className={styles.top} onClick={() => setOpen((o) => !o)}>
        {header(open)}
      </div>
      {open && <div className={bodyClassName ? `${styles.body} ${bodyClassName}` : styles.body}>{children}</div>}
    </Card>
  );
}
