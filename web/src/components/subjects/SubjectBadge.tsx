import { SUBJECT_META, subjectAbbr } from "../../lib/subjects";
import { Badge } from "../ui/badge";

/** A shadcn Badge, colored per-subject via inline style (the docs' "Custom
 * Colors" pattern uses className, but our colors come from a per-subject
 * CSS-var lookup table rather than static Tailwind classes, so `style` is
 * the equivalent -- Tailwind can't generate a utility class for a value it
 * only sees at runtime). Every subject keeps its existing --subj-* color,
 * light and dark, unchanged. A co-curricular subject with no exam (Dance,
 * Leadership, ...) has no color of its own -- they used to share one flat
 * "neutral" tint, but since every one of them looked identical anyway, that
 * color was pure noise rather than a real signal, and its abbreviation
 * ("LDR", "DNC") is unreadable without it. A plain outline badge admits
 * there's no color to give it, rather than faking one. */
export default function SubjectBadge({ subject }: { subject: string }) {
  const meta = SUBJECT_META[subject];
  if (!meta) {
    return (
      <Badge variant="outline" title={subject}>
        {subjectAbbr(subject)}
      </Badge>
    );
  }
  return (
    <Badge style={{ background: meta.bg, color: meta.fg }} title={subject}>
      {subjectAbbr(subject)}
    </Badge>
  );
}
