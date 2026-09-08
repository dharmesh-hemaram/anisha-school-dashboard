import type { MatchPair } from "../../../../revision-notebooks/types";
import styles from "../../RevisionNotebookPage.module.css";

export default function MatchPairRow({ pair }: { pair: MatchPair }) {
  return (
    <tr>
      <td className={pair.leftSvg ? styles.signCell : undefined}>
        {pair.leftSvg ? <span dangerouslySetInnerHTML={{ __html: pair.leftSvg }} /> : pair.left}
      </td>
      <td>{pair.right}</td>
    </tr>
  );
}
