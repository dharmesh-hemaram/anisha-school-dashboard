import type { SourceMarks as SourceMarksType } from "../../revision-notebooks/types";
import styles from "./RevisionNotebookPage.module.css";

export default function SourceMarks({ sources }: { sources?: SourceMarksType }) {
  if (!sources) return null;
  return (
    <>
      {sources.worksheet && (
        <sup className={styles.srcWs} title="Also asked in a school Worksheet">
          #
        </sup>
      )}
      {sources.revisionSheet && (
        <sup className={styles.srcRev} title="Also asked in a Revision sheet">
          *
        </sup>
      )}
    </>
  );
}
