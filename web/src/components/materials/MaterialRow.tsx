import type { Notice } from "../../types";
import { fmtDate, parseDMY } from "../../lib/date";
import { firstLine } from "../../lib/notices";
import { formatNumberList, materialHref } from "../../lib/materials";
import { MATERIAL_TAG_META } from "../../lib/constants";
import styles from "./MaterialRow.module.css";

interface MaterialRowProps {
  notice: Notice;
  /** false when the row already sits inside a card grouped by its own
   * material type (Notes tab) -- the card's own heading already says
   * "Worksheets", so repeating a tag on every row under it is redundant.
   * The Exam tab's subject cards mix all types together, so those still
   * need the per-row tag to tell them apart. */
  showTag?: boolean;
}

// The raw notice text is verbose boilerplate ("PFA the Culmination Worksheet
// No. 3 for English") when all that's actually new information is the
// number -- the subject is already the card/section it's filed under. Use
// the already-extracted worksheet_numbers for a plain "Worksheet No. 3" /
// "Revision No. 1–4" instead, falling back to the raw text only when no
// number was extracted at all.
export default function MaterialRow({ notice: r, showTag = true }: MaterialRowProps) {
  const tagMeta = (r.material_type && MATERIAL_TAG_META[r.material_type]) || { cls: "tag", label: "Notes" };
  const title =
    r.chapter ||
    ((r.material_type === "Worksheet" || r.material_type === "Revision") && r.worksheet_numbers?.length
      ? `${tagMeta.label} No. ${formatNumberList(r.worksheet_numbers)}`
      : firstLine(r.text));
  const href = materialHref(r);

  const inner = (
    <div className={styles.body}>
      <div className={styles.top}>
        {showTag && <span className={`${styles.tag} ${styles[tagMeta.cls] ?? ""}`}>{tagMeta.label}</span>}
        <span className={styles.title}>{title}</span>
      </div>
      <div className={styles.meta}>
        <span className={styles.date}>Posted {fmtDate(parseDMY(r.posted_date))}</span>
      </div>
    </div>
  );

  if (href) {
    return (
      <a className={`${styles.row} ${styles.rowLink}`} href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return <div className={styles.row}>{inner}</div>;
}
