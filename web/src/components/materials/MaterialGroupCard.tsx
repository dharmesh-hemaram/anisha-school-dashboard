import { useState } from "react";
import type { Notice, PortionScheduleRow } from "../../types";
import { fmtDate, parseISO } from "../../lib/date";
import { sortMaterialsByTypeThenDate } from "../../lib/materials";
import SubjectBadge from "../subjects/SubjectBadge";
import Count from "../ui/Count";
import Chevron from "../ui/Chevron";
import MaterialList from "./MaterialList";
import RevisionNotebookLink from "./RevisionNotebookLink";
import styles from "./MaterialGroupCard.module.css";

interface MaterialGroupCardProps {
  subject: string;
  items: Notice[];
  scheduleRow?: PortionScheduleRow;
  /** Starts closed with a click-to-expand head, instead of always showing
   * the portion text + material list -- the revision notebook page already
   * repeats the subject/date/portion in its own header, so this card would
   * otherwise just be duplicate clutter sitting above the notebook. The Exam
   * tab (this card's other caller) wants every card open at once instead,
   * so it leaves this off. */
  collapsible?: boolean;
}

/** One card per subject: its portion-table slot (date/marks/topic), when
 * there is one, plus every note/worksheet/revision tagged to this cycle.
 * Used by the Exam tab; the Upcoming tab's related-materials block and the
 * Notes tab's type-grouped sections reuse the underlying `MaterialList`
 * directly without this card chrome, since their layouts are intentionally
 * different contexts. */
export default function MaterialGroupCard({ subject, items, scheduleRow, collapsible = false }: MaterialGroupCardProps) {
  const [open, setOpen] = useState(!collapsible);
  const sorted = sortMaterialsByTypeThenDate(items);

  return (
    <div className={styles.card}>
      <div
        className={collapsible ? `${styles.head} ${styles.headClickable}` : styles.head}
        onClick={collapsible ? () => setOpen((o) => !o) : undefined}
        role={collapsible ? "button" : undefined}
      >
        <SubjectBadge subject={subject} />
        <span>{subject}</span>
        {scheduleRow ? (
          <span className={styles.headRight}>
            <span className={styles.scheduleDate}>{fmtDate(parseISO(scheduleRow.date_iso))}</span>
            {scheduleRow.marks && <span className={styles.scheduleMarks}>{scheduleRow.marks} marks</span>}
            {collapsible && !open && <Count n={sorted.length} />}
            {collapsible && <Chevron open={open} />}
          </span>
        ) : (
          <span className={styles.countSlot}>
            <Count n={sorted.length} />
          </span>
        )}
      </div>
      {open && (
        <>
          {scheduleRow && <div className={styles.portionText}>{scheduleRow.portion}</div>}
          <RevisionNotebookLink url={scheduleRow?.revision_notebook_url} />
          <MaterialList items={sorted} />
        </>
      )}
    </div>
  );
}
