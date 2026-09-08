import type { WeekStripItem } from "../../lib/upcoming";
import { fmtDate, parseISO } from "../../lib/date";
import styles from "./WeekStrip.module.css";

export default function WeekStrip({ items }: { items: WeekStripItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className={styles.strip}>
      <div className={styles.head}>This week</div>
      {items.map((x) => (
        <div key={`${x.date_iso}-${x.name}`} className={x._days === 0 ? `${styles.row} ${styles.today}` : styles.row}>
          <span className={styles.dot} style={{ background: x.dot }} />
          <span className={styles.when}>{x._days === 0 ? "Today" : x._days === 1 ? "Tomorrow" : fmtDate(parseISO(x.date_iso))}</span>
          <span className={styles.name}>{x.name}</span>
        </div>
      ))}
    </div>
  );
}
