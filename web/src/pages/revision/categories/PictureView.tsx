import type { Chapter, PictureCategory } from "../../../revision-notebooks/types";
import ChapterGroup from "../ChapterGroup";
import PictureItemCard from "./items/PictureItemCard";
import LeaderFigureCard from "./items/LeaderFigureCard";
import styles from "../RevisionNotebookPage.module.css";

export default function PictureView({ groups, chapters }: { groups: PictureCategory["groups"]; chapters: Chapter[] }) {
  return (
    <>
      {groups.map((g) => (
        <ChapterGroup key={g.chapter} chapter={g.chapter} chapters={chapters}>
          {g.items.map((item, i) => (
            <PictureItemCard key={i} item={item} />
          ))}
          {g.leaderGrid && (
            <>
              <h4 className={styles.setLabel}>{g.leaderGrid.label}</h4>
              <div className={styles.leaderGrid}>
                {g.leaderGrid.items.map((fig, i) => (
                  <LeaderFigureCard key={i} item={fig} />
                ))}
              </div>
            </>
          )}
        </ChapterGroup>
      ))}
    </>
  );
}
