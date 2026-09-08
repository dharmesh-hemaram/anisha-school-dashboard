import styles from "./RevisionNotebookLink.module.css";

/** A hand-authored revision notebook (Q&A practice page) for a subject's
 * exam cycle -- optional per portion-schedule row, so most cards never
 * render it. Shared by the Exam tab's subject cards and the Upcoming tab's
 * exam cards, so the link never silently disappears from just one of them. */
export default function RevisionNotebookLink({ url }: { url: string | null | undefined }) {
  if (!url) return null;
  return (
    <a className={styles.link} href={`${import.meta.env.BASE_URL}${url}`} target="_blank" rel="noopener noreferrer">
      📓 Revision Notebook (Q&amp;A practice) →
    </a>
  );
}
