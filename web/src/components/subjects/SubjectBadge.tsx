import { SUBJECT_META, subjectAbbr } from "../../lib/subjects";
import { Badge } from "../ui/badge";

/** A shadcn Badge, colored per-subject via inline style (the docs' "Custom
 * Colors" pattern uses className, but our colors come from a per-subject
 * CSS-var lookup table rather than static Tailwind classes, so `style` is
 * the equivalent -- Tailwind can't generate a utility class for a value it
 * only sees at runtime). Every subject keeps its existing --subj-* color,
 * light and dark, unchanged. */
export default function SubjectBadge({ subject }: { subject: string }) {
  const meta = SUBJECT_META[subject];
  const bg = meta ? meta.bg : "var(--subj-neutral-bg)";
  const fg = meta ? meta.fg : "var(--subj-neutral)";
  return (
    <Badge style={{ background: bg, color: fg }} title={subject}>
      {subjectAbbr(subject)}
    </Badge>
  );
}
