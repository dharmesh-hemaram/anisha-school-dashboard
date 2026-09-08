import { SUBJECT_META, subjectAbbr } from "../../lib/subjects";
import styles from "./SubjectBadge.module.css";

export default function SubjectBadge({ subject }: { subject: string }) {
  const meta = SUBJECT_META[subject];
  if (meta) {
    return (
      <span className={styles.badge} style={{ background: meta.bg, color: meta.fg }} title={subject}>
        {meta.abbr}
      </span>
    );
  }
  return (
    <span className={`${styles.badge} ${styles.neutral}`} title={subject}>
      {subjectAbbr(subject)}
    </span>
  );
}
