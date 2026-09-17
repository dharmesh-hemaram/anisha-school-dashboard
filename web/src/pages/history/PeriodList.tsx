import type { Period } from "../../types";
import SubjectBadge from "../../components/subjects/SubjectBadge";
import styles from "./PeriodList.module.css";

export default function PeriodList({ periods }: { periods: Period[] }) {
  return (
    <div className={styles.list}>
      {periods.map((p) => (
        <div className={styles.row} key={p.period}>
          <span className={styles.num}>P{p.period}</span>
          <div className={styles.body}>
            {p.subject && <SubjectBadge subject={p.subject} />}
            {p.note}
            {p.hw && (
              <div className={styles.hw}>
                <span className={styles.hwTag}>HW</span>
                {p.hw}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
