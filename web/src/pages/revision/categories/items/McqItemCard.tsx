import type { McqItem } from "../../../../revision-notebooks/types";
import styles from "../../RevisionNotebookPage.module.css";

/** One MCQ question. Reused by every chapter's MCQ list -- change the
 * question/options/answer layout once, here. */
export default function McqItemCard({ item }: { item: McqItem }) {
  return (
    <div className={styles.mcq}>
      <p className={styles.q}>{item.question}</p>
      <p className={styles.opts}>{item.options}</p>
      <p className={styles.ans}>
        Answer: <strong>{item.answer}</strong>
      </p>
    </div>
  );
}
