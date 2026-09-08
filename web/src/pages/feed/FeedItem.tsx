import type { Notice } from "../../types";
import { CATEGORY_META } from "../../lib/constants";
import { noticeTitle } from "../../lib/notices";
import { todayISO } from "../../lib/date";
import ExpandableCard from "../../components/ui/ExpandableCard";
import Chevron from "../../components/ui/Chevron";
import AttachmentLink from "../../components/ui/AttachmentLink";
import PeriodList from "./PeriodList";
import styles from "./FeedItem.module.css";

export default function FeedItem({ notice: r }: { notice: Notice }) {
  const meta = CATEGORY_META[r.category];
  const isTodayTimetable = r.is_timetable && r.event_date_iso === todayISO();

  return (
    <ExpandableCard
      className={isTodayTimetable ? `${styles.item} ${styles.today}` : styles.item}
      header={(open) => (
        <>
          <span className={styles.dot} style={{ background: meta.dot }} />
          {!open && <span className={styles.preview}>{noticeTitle(r)}</span>}
          <Chevron open={open} />
        </>
      )}
    >
      <div className={styles.full}>{r.periods?.length ? <PeriodList periods={r.periods} /> : r.text}</div>
      <AttachmentLink url={r.attachment_url} />
    </ExpandableCard>
  );
}
