import type { ReactNode } from "react";
import { Fragment } from "react";
import { fmtDate, parseISO, todayISO } from "../../lib/date";
import styles from "./Timeline.module.css";

interface TimelineProps<T> {
  items: T[];
  dateIso: (item: T) => string;
  children: (item: T, index: number) => ReactNode;
  className?: string;
}

/** Groups already-ordered `items` under one date header per distinct ISO
 * date, with a "Today" tag when that date is today. Shared by the Upcoming,
 * Feed, and HW tabs, which all read as a per-day list. */
export default function Timeline<T>({ items, dateIso, children, className }: TimelineProps<T>) {
  const today = todayISO();

  return (
    <div className={className ? `${styles.list} ${className}` : styles.list}>
      {items.map((item, i) => {
        const iso = dateIso(item);
        const showHeader = i === 0 || dateIso(items[i - 1]) !== iso;
        const isToday = iso === today;
        return (
          <Fragment key={i}>
            {showHeader && (
              <div className={isToday ? `${styles.dayHead} ${styles.today}` : styles.dayHead}>
                {fmtDate(parseISO(iso))}
                {isToday && <span className={styles.todayTag}>Today</span>}
              </div>
            )}
            {children(item, i)}
          </Fragment>
        );
      })}
    </div>
  );
}
