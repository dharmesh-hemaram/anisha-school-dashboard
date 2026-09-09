import type { Chapter, PassageCategory } from "../../../revision-notebooks/types";
import ChapterGroup from "../ChapterGroup";
import PassageItemCard from "./items/PassageItemCard";
import styles from "../RevisionNotebookPage.module.css";

export default function PassageView({ groups, chapters }: { groups: PassageCategory["groups"]; chapters: Chapter[] }) {
  return (
    <>
      {groups.map((g) => (
        <ChapterGroup key={g.chapter} chapter={g.chapter} chapters={chapters}>
          {g.note && <p className={styles.answerLine}>{g.note}</p>}
          {g.items.map((item, i) => (
            <PassageItemCard key={i} item={item} />
          ))}
        </ChapterGroup>
      ))}
    </>
  );
}
