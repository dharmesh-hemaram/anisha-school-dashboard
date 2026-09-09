import type { PassageItem } from "../../../../revision-notebooks/types";
import SourceMarks from "../../SourceMarks";
import QaItemCard from "./QaItemCard";
import styles from "../../RevisionNotebookPage.module.css";

/** One unseen-comprehension passage she practiced, plus the Q&A she
 * answered about it -- the passage text sits in its own box so it reads as
 * "unfamiliar text", then reuses QaItemCard for each question so answer
 * rendering (incl. bulleted answers) isn't duplicated. */
export default function PassageItemCard({ item }: { item: PassageItem }) {
  return (
    <div className={styles.passage}>
      <p className={styles.passageTitle}>
        <span>
          {item.title}
          <SourceMarks sources={item.sources} />
        </span>
        {item.date && <span className={styles.passageDate}>{item.date}</span>}
      </p>
      <p className={styles.passageText}>{item.text}</p>
      <div className={styles.passageQs}>
        {item.questions.map((q, i) => (
          <QaItemCard key={i} item={q} />
        ))}
      </div>
    </div>
  );
}
