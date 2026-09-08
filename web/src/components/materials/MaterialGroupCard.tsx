import type { Notice, PortionScheduleRow } from "../../types";
import { fmtDate, parseISO } from "../../lib/date";
import { sortMaterialsByTypeThenDate } from "../../lib/materials";
import SubjectBadge from "../subjects/SubjectBadge";
import Count from "../ui/Count";
import MaterialList from "./MaterialList";
import RevisionNotebookLink from "./RevisionNotebookLink";
import styles from "./MaterialGroupCard.module.css";

interface MaterialGroupCardProps {
  subject: string;
  items: Notice[];
  scheduleRow?: PortionScheduleRow;
}

/** One card per subject: its portion-table slot (date/marks/topic), when
 * there is one, plus every note/worksheet/revision tagged to this cycle.
 * Used by the Exam tab; the Upcoming tab's related-materials block and the
 * Notes tab's type-grouped sections reuse the underlying `MaterialList`
 * directly without this card chrome, since their layouts are intentionally
 * different contexts. */
export default function MaterialGroupCard({ subject, items, scheduleRow }: MaterialGroupCardProps) {
  const sorted = sortMaterialsByTypeThenDate(items);

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <SubjectBadge subject={subject} />
        <span>{subject}</span>
        {scheduleRow ? (
          <span className={styles.headRight}>
            <span className={styles.scheduleDate}>{fmtDate(parseISO(scheduleRow.date_iso))}</span>
            {scheduleRow.marks && <span className={styles.scheduleMarks}>{scheduleRow.marks} marks</span>}
          </span>
        ) : (
          <span className={styles.countSlot}>
            <Count n={sorted.length} />
          </span>
        )}
      </div>
      {scheduleRow && <div className={styles.portionText}>{scheduleRow.portion}</div>}
      <RevisionNotebookLink url={scheduleRow?.revision_notebook_url} />
      <MaterialList items={sorted} />
    </div>
  );
}
