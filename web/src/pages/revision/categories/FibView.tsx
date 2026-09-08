import type { Chapter, FibCategory } from "../../../revision-notebooks/types";
import ChapterGroup from "../ChapterGroup";
import FibItemCard from "./items/FibItemCard";
import styles from "../RevisionNotebookPage.module.css";

export default function FibView({ groups, chapters }: { groups: FibCategory["groups"]; chapters: Chapter[] }) {
  return (
    <>
      {groups.map((g) => (
        <ChapterGroup key={g.chapter} chapter={g.chapter} chapters={chapters}>
          {g.sets.map((set, i) => (
            <div key={i}>
              {set.note && <p className={styles.answerLine}>{set.note}</p>}
              <ol>
                {set.items.map((item, j) => (
                  <FibItemCard key={j} item={item} />
                ))}
              </ol>
            </div>
          ))}
        </ChapterGroup>
      ))}
    </>
  );
}
