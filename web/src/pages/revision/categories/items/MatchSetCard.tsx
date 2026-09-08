import type { MatchSet } from "../../../../revision-notebooks/types";
import SourceMarks from "../../SourceMarks";
import MatchPairRow from "./MatchPairRow";
import styles from "../../RevisionNotebookPage.module.css";

export default function MatchSetCard({ set }: { set: MatchSet }) {
  return (
    <div>
      {set.label && (
        <h4 className={styles.setLabel}>
          {set.label}
          <SourceMarks sources={set.sources} />
        </h4>
      )}
      <table className={styles.table}>
        <tbody>
          <tr>
            <th>{set.columns[0]}</th>
            <th>{set.columns[1]}</th>
          </tr>
          {set.pairs.map((pair, i) => (
            <MatchPairRow key={i} pair={pair} />
          ))}
        </tbody>
      </table>
      {set.answerLine && (
        <p className={styles.answerLine}>
          <strong>Answer:</strong> {set.answerLine}
        </p>
      )}
    </div>
  );
}
