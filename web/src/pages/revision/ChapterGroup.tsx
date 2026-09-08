import type { ReactNode } from "react";
import type { Chapter, ChapterId } from "../../revision-notebooks/types";
import styles from "./RevisionNotebookPage.module.css";

interface ChapterGroupProps {
  chapter: ChapterId;
  chapters: Chapter[];
  children: ReactNode;
}

export default function ChapterGroup({ chapter, chapters, children }: ChapterGroupProps) {
  const label = chapters.find((c) => c.id === chapter)?.label ?? chapter;
  return (
    <div className={styles.chapGroup} data-chapter={chapter}>
      <span className={styles.chapLabel}>{label}</span>
      {children}
    </div>
  );
}
