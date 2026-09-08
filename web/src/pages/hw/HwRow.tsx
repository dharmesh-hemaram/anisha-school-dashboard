import type { HwTask } from "../../types";
import { useAppDispatch } from "../../app/hooks";
import { toggleDone } from "../../features/hw/hwSlice";
import Card from "../../components/ui/Card";
import SubjectBadge from "../../components/subjects/SubjectBadge";
import styles from "./HwRow.module.css";

const DONE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.15" />
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.3l2.5 2.5L16 9" />
  </svg>
);
const TODO_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

export default function HwRow({ task, done }: { task: HwTask; done: boolean }) {
  const dispatch = useAppDispatch();
  return (
    <Card className={done ? `${styles.row} ${styles.done}` : styles.row} onClick={() => dispatch(toggleDone(task.id))}>
      <span className={styles.check}>{done ? DONE_ICON : TODO_ICON}</span>
      <div className={styles.body}>
        {task.subject && (
          <div className={styles.top}>
            <SubjectBadge subject={task.subject} />
          </div>
        )}
        <div className={styles.text}>{task.text}</div>
      </div>
    </Card>
  );
}
