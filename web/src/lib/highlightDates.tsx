import type { ReactNode } from "react";

const MONTHS = "january|february|march|april|may|june|july|august|september|october|november|december";

// A single date ("24th October 2026"), a list/range sharing one month+year
// ("21st to 28th September 2026", "3rd, 4th and 5th December 2026") matched
// as one span rather than fragmenting into separate highlights, or a plain
// numeric date (DD/MM/YYYY, DD-MM-YYYY, D-M-YY).
const DATE_RE = new RegExp(
  `\\b\\d{1,2}(?:st|nd|rd|th)?(?:\\s*(?:,|&|and|to|-)\\s*\\d{1,2}(?:st|nd|rd|th)?)*\\s+(?:${MONTHS})\\s+\\d{4}\\b|\\b\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}\\b`,
  "gi",
);

// A notice's text has no structured field marking which of its dates is a
// registration/submission deadline versus the event/activity date itself --
// event_date_iso only ever carries one date for the whole notice. This is a
// plain keyword read of the text immediately before the match: "Last Date
// for Registration: 10th October", "...by 21st September", "due on
// 10-09-2026" read as a deadline; a bare "held on"/"scheduled for" date
// (the common case) falls through to being treated as the event itself.
function isDeadlineContext(before: string): boolean {
  if (/\b(?:by|before|within)\s*$/i.test(before)) return true;
  return /(last date|registration|register|deadline|\bdue\b)/i.test(before.slice(-55));
}

/** Bolds and colors every date-like phrase in a notice's body text -- green
 * for the event/activity date, red for a registration/submission deadline --
 * so the one date that actually matters doesn't have to be found by reading
 * the whole paragraph. */
export function highlightDates(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  const re = new RegExp(DATE_RE.source, DATE_RE.flags);
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const deadline = isDeadlineContext(text.slice(0, match.index));
    nodes.push(
      <mark key={key++} className={deadline ? "bg-transparent font-semibold text-destructive" : "bg-transparent font-semibold text-[var(--date-event-ink)]"}>
        {match[0]}
      </mark>,
    );
    lastIndex = match.index + match[0].length;
  }
  nodes.push(text.slice(lastIndex));
  return nodes;
}
