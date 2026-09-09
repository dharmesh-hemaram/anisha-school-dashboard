import type { VocabItem } from "../../../../revision-notebooks/types";
import SourceMarks from "../../SourceMarks";
import styles from "../../RevisionNotebookPage.module.css";

/** One "new word" entry -- word, its meaning, and a worked example sentence.
 * Reused by every chapter's vocabulary list. */
export default function VocabItemCard({ item }: { item: VocabItem }) {
  return (
    <div className={styles.vocabItem}>
      <p className={styles.vocabWord}>
        {item.word}
        <SourceMarks sources={item.sources} />
      </p>
      <p className={styles.vocabMeaning}>{item.meaning}</p>
      <p className={styles.vocabExample}>{item.example}</p>
    </div>
  );
}
