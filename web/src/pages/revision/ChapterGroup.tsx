import type { CSSProperties, ReactNode } from "react";
import type { Chapter, ChapterId } from "../../revision-notebooks/types";
import { chapterAccentVars } from "../../revision-notebooks/chapterPalette";
import styles from "./RevisionNotebookPage.module.css";

interface ChapterGroupProps {
  chapter: ChapterId;
  chapters: Chapter[];
  children: ReactNode;
}

export default function ChapterGroup({ chapter, chapters, children }: ChapterGroupProps) {
  const index = chapters.findIndex((c) => c.id === chapter);
  const label = chapters[index]?.label ?? chapter;
  return (
    <div className={styles.chapGroup} data-chapter={chapter} style={chapterAccentVars(index) as CSSProperties}>
      <span className={styles.chapLabel}>{label}</span>
      {children}
    </div>
  );
}
