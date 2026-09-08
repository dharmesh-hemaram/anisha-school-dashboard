import { SUBJECT_META, subjectAbbr } from "../../lib/subjects";
import styles from "./SubjectChip.module.css";

interface SubjectChipProps {
  subject: string;
  active: boolean;
  size?: "row" | "grid";
  onClick?: () => void;
}

// Same color used for the badge doubles as the button's color when it's
// used as a filter chip -- solid fill (color as background) when selected,
// soft tint when not, so the active subject still reads clearly.
export default function SubjectChip({ subject, active, size = "row", onClick }: SubjectChipProps) {
  const meta = SUBJECT_META[subject];
  const bg = meta ? meta.bg : "var(--subj-neutral-bg)";
  const fg = meta ? meta.fg : "var(--subj-neutral)";
  const style = active
    ? { background: fg, color: "var(--surface)", borderColor: fg }
    : { background: bg, color: fg, borderColor: "transparent" };
  const cls = [styles.chip, size === "grid" && styles.grid].filter(Boolean).join(" ");
  return (
    <button type="button" className={cls} style={style} title={subject} onClick={onClick}>
      {subjectAbbr(subject)}
    </button>
  );
}
