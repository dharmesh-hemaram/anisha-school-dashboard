import type { BlockItem } from "../../../../revision-notebooks/types";
import SourceMarks from "../../SourceMarks";
import styles from "../../RevisionNotebookPage.module.css";

/** A heading plus ordered lines, e.g. the letter-writing format checklist
 * or one full worked letter -- rendered as plain paragraph text (no bullets)
 * since a letter's lines aren't a list. */
export default function BlockItemCard({ item }: { item: BlockItem }) {
  return (
    <div className={styles.block}>
      {item.heading && (
        <p className={styles.blockHeading}>
          {item.heading}
          <SourceMarks sources={item.sources} />
        </p>
      )}
      <div className={styles.blockLines}>{item.lines.join("\n")}</div>
    </div>
  );
}
