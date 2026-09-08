import type { UpcomingItem } from "../../types";
import { useAppSelector } from "../../app/hooks";
import { CATEGORY_META } from "../../lib/constants";
import { noticeTitle } from "../../lib/notices";
import { relatedMaterialsFor } from "../../lib/upcoming";
import { findScheduleRow, sortMaterialsByTypeThenDate } from "../../lib/materials";
import ExpandableCard from "../../components/ui/ExpandableCard";
import Chevron from "../../components/ui/Chevron";
import AttachmentLink from "../../components/ui/AttachmentLink";
import MaterialList from "../../components/materials/MaterialList";
import RevisionNotebookLink from "../../components/materials/RevisionNotebookLink";
import styles from "./ActionCard.module.css";

export default function ActionCard({ item }: { item: UpcomingItem }) {
  const notices = useAppSelector((s) => s.data.notices);
  const portionSchedules = useAppSelector((s) => s.data.portionSchedules);

  const state = item._days === 0 ? "today" : item._days <= 3 ? "soon" : "future";
  const stateClass = state === "today" ? styles.stateToday : state === "soon" ? styles.stateSoon : styles.stateFuture;
  const kind = CATEGORY_META[item.category].label;
  // A real "class test" notice isn't itself the formal Half Yearly/PT-1 exam
  // -- exam_cycle is just an internal grouping heuristic (nearest
  // named-cycle anchor in time) used to pull in the right prep material, not
  // something that should read as "this test IS that exam". Only the
  // portion-table-derived entries genuinely are that exam.
  const cycleSuffix = "isSynthetic" in item && item.isSynthetic && item.exam_cycle ? ` · ${item.exam_cycle}` : "";

  const relatedMaterials = sortMaterialsByTypeThenDate(relatedMaterialsFor(notices, item));
  // exam_cycle is only ever a plain string on an Exam/Test record (the only
  // category Upcoming's exam cards render) -- the array shape belongs to
  // Subject Notes records, never these, but the union type still allows it.
  const cycle = typeof item.exam_cycle === "string" ? item.exam_cycle : undefined;
  const scheduleRow = findScheduleRow(portionSchedules, cycle, item.subject);

  return (
    <ExpandableCard
      className={`${styles.card} ${stateClass}`}
      header={(open) => (
        <>
          <div>
            <div className={styles.kind}>
              {kind}
              {cycleSuffix}
            </div>
            <div className={styles.title}>{noticeTitle(item)}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {state === "today" ? (
              <span className={`${styles.badge} ${styles.badgeToday}`}>Today</span>
            ) : (
              <span className={`${styles.badge} ${styles.badgeSoon}`}>In {item._days}d</span>
            )}
            <Chevron open={open} />
          </div>
        </>
      )}
    >
      <div className={styles.full}>{item.text}</div>
      <RevisionNotebookLink url={scheduleRow?.revision_notebook_url} />
      {relatedMaterials.length > 0 && (
        <div className={styles.materials}>
          <div className={styles.materialsHead}>Notes &amp; worksheets — {item.subject}</div>
          <MaterialList items={relatedMaterials} />
        </div>
      )}
      <AttachmentLink url={item.attachment_url} />
    </ExpandableCard>
  );
}
