import type { Chapter, NotebookCategoryEntry } from "../../revision-notebooks/types";
import CategoryDispatch from "./CategoryDispatch";
import styles from "./RevisionNotebookPage.module.css";

interface CategorySectionProps {
  entry: NotebookCategoryEntry;
  chapters: Chapter[];
}

/** One numbered section of a revision notebook (e.g. "1. Fill in the
 * Blanks") -- header, optional note, and its chapter groups. Purely a
 * function of `entry`/`chapters`, so a notebook's categories.map() just
 * feeds each entry into this one component instead of repeating the
 * section chrome per category. */
export default function CategorySection({ entry, chapters }: CategorySectionProps) {
  return (
    <div className={styles.catItem} id={`cat-${entry.num}`}>
      <div className={styles.catHead}>
        <span className={styles.catNumBadge}>{entry.num}</span>
        <span>{entry.title}</span>
      </div>
      {entry.note && <p className={styles.catNote}>{entry.note}</p>}
      <CategoryDispatch data={entry.data} chapters={chapters} />
    </div>
  );
}
