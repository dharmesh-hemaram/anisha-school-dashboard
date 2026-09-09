import type { SourceMarks as SourceMarksType } from "../../revision-notebooks/types";
import styles from "./RevisionNotebookPage.module.css";

export default function SourceMarks({ sources }: { sources?: SourceMarksType }) {
  if (!sources) return null;
  return (
    <>
      {sources.notes && (
        <sup className={styles.srcNotes} title="Copied out in her own notebook">
          ✎
        </sup>
      )}
      {sources.textbook && (
        <sup className={styles.srcTb} title="Also in the printed textbook / workbook">
          ★
        </sup>
      )}
      {sources.worksheet && (
        <sup className={styles.srcWs} title="Also asked in a school Worksheet">
          ☑
        </sup>
      )}
      {sources.revisionSheet && (
        <sup className={styles.srcRev} title="Also asked in a Revision sheet">
          ↻
        </sup>
      )}
    </>
  );
}
