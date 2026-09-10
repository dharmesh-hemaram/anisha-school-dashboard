import type { QaItem } from "../../../../revision-notebooks/types";
import Markdown from "../../../../components/ui/Markdown";
import SourceMarks from "../../SourceMarks";
import styles from "../../RevisionNotebookPage.module.css";

// Define, Short Answer, Long Answer and Application Based all share this
// exact question+answer shape in the source notebook -- one card, reused by
// all four category views, so a layout change here (e.g. how the leader
// thumbnail sits next to the question) shows up in every one of them at
// once instead of needing four separate edits.
export default function QaItemCard({ item }: { item: QaItem }) {
  return (
    <div className={styles.qa}>
      <p className={styles.q}>
        {item.questionLeaderImage && (
          <img
            className={styles.leaderThumb}
            src={`${import.meta.env.BASE_URL}leaders/${item.questionLeaderImage}`}
            alt=""
          />
        )}
        <Markdown text={item.question} />
        <SourceMarks sources={item.sources} />
      </p>
      {Array.isArray(item.answer) ? (
        <div className={styles.a}>
          <ul>
            {item.answer.map((line, i) => (
              <li key={i}>
                <Markdown text={line} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className={styles.a}>
          <Markdown text={item.answer} />
        </p>
      )}
    </div>
  );
}
