import type { ReactNode } from "react";
import type { FibItem } from "../../../../revision-notebooks/types";
import SourceMarks from "../../SourceMarks";
import styles from "../../RevisionNotebookPage.module.css";

/** One fill-in-the-blank sentence, answers always shown inline. Used
 * everywhere a FIB item renders -- change how an answer/source-mark looks
 * once, here, and every chapter's FIB list picks it up. */
export default function FibItemCard({ item }: { item: FibItem }) {
  return (
    <li>
      {renderTemplate(item.template, item.answers)}
      <SourceMarks sources={item.sources} />
    </li>
  );
}

function renderTemplate(template: string, answers: string[]) {
  const parts = template.split("___");
  const out: ReactNode[] = [parts[0]];
  parts.slice(1).forEach((part, i) => {
    out.push(
      <span key={i} className={styles.fibAnswer}>
        {answers[i]}
      </span>,
    );
    out.push(part);
  });
  return out;
}
