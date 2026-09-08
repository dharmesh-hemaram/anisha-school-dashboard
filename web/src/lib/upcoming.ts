import type { EventsCalendar, Holidays, Notice, PortionSchedules, SyntheticNotice, UpcomingItem } from "../types";
import { daysUntil, parseISO } from "./date";
import { cyclesOf, latestExamCycle } from "./notices";
import { UPCOMING_CATEGORIES } from "./constants";

/** One dated entry in the "This week" strip -- a holiday/event with no
 * notice of its own. */
export interface WeekStripItem {
  date_iso: string;
  name: string;
  dot: string;
  _days: number;
}

// A compact 7-day lookahead built from the yearly master lists, separate
// from the full Upcoming list -- the master lists cover the whole academic
// year (holidays, events, PTMs), and turning every one of those into its
// own Upcoming card would bury the things that actually need a decision or
// a book to pack. This only ever shows what's happening in the next week.
export function buildWeekStripItems(notices: Notice[], holidays: Holidays, eventsCalendar: EventsCalendar): WeekStripItem[] {
  // A holiday/event that already has its own real notice shows as a full
  // card in the main Upcoming list -- skip it here so it doesn't also show
  // as a duplicate row in the strip.
  const alreadyShown = new Set(
    notices.filter((r) => r.category === "Holiday" || r.category === "School Event").map((r) => r.event_date_iso),
  );

  const items: Omit<WeekStripItem, "_days">[] = [
    ...holidays.holidays.map((h) => ({ date_iso: h.date_iso, name: h.name, dot: "var(--dot-holiday)" })),
    ...eventsCalendar.events.map((e) => ({ date_iso: e.date_iso, name: e.name, dot: "var(--dot-event)" })),
    ...eventsCalendar.ptm.map((p) => ({
      date_iso: p.date_iso,
      dot: "var(--dot-event)",
      name: p.scope ? `${p.label} — ${p.scope}` : p.label,
    })),
  ].filter((x) => !alreadyShown.has(x.date_iso));

  return items
    .map((x) => ({ ...x, _days: daysUntil(parseISO(x.date_iso)) }))
    .filter((x) => x._days >= 0 && x._days <= 7)
    .sort((a, b) => a._days - b._days);
}

// The portion sheet itself is one notification, not an event on any one day
// -- Upcoming should show the individual exam day it actually announces
// instead. Synthesize one entry per portion-table row for the current
// cycle, skipping only a row whose subject *and* date already match a real
// class-test notice (once the school posts the actual notice, it takes
// over rather than showing twice) -- matching on subject alone would also
// catch that subject's regular class tests earlier in the same cycle
// window, which are a different, smaller test.
function buildSyntheticExamEntries(notices: Notice[], portionSchedules: PortionSchedules, currentCycle: string | null): SyntheticNotice[] {
  if (!currentCycle) return [];
  const portionData = portionSchedules[currentCycle];
  const portionNotice = notices.find(
    (r) => r.category === "Exam/Test" && r.material_type === "Portion" && r.exam_cycle === currentCycle,
  );
  if (!portionData?.schedule || !portionNotice) return [];

  const realExamSlots = new Set(
    notices
      .filter((r) => r.category === "Exam/Test" && r.material_type !== "Portion" && r.exam_cycle === currentCycle && r.subject)
      .map((r) => `${r.subject}|${r.event_date_iso}`),
  );

  return portionData.schedule
    .filter((row) => !realExamSlots.has(`${row.subject}|${row.date_iso}`))
    .map((row) => ({
      id: `portion-${currentCycle}-${row.subject}`.replace(/\s+/g, "-"),
      category: "Exam/Test",
      method: "synthetic",
      periods: [],
      is_timetable: false,
      confidence: 1,
      chapter: null,
      chapter_number: null,
      material_type: null,
      worksheet_numbers: null,
      answer_key_url: null,
      paired: false,
      calendar_event_id: null,
      isSynthetic: true,
      subject: row.subject,
      exam_cycle: currentCycle,
      event_date_iso: row.date_iso,
      posted_date_iso: portionNotice.posted_date_iso,
      posted_date: portionNotice.posted_date,
      text: row.portion,
      // Not portionNotice.attachment_url: that's the whole cycle's scanned
      // portion sheet (every subject), not anything specific to this one
      // subject's exam day -- showing "View attachment" here would point
      // every subject at the exact same PDF, which reads as broken rather
      // than helpful. It's already one tap away via the Exam tab's own
      // "View portion" link.
      attachment_url: null,
    }));
}

export function buildUpcomingItems(notices: Notice[], portionSchedules: PortionSchedules): UpcomingItem[] {
  const currentCycle = latestExamCycle(notices);
  const synthetic = buildSyntheticExamEntries(notices, portionSchedules, currentCycle);

  return [
    ...notices.filter((r) => UPCOMING_CATEGORIES.includes(r.category) && r.material_type !== "Portion"),
    ...synthetic,
  ]
    .map((r) => ({ ...r, _days: daysUntil(parseISO(r.event_date_iso)) }))
    .filter((r) => r._days >= 0)
    .sort((a, b) => a._days - b._days) as UpcomingItem[];
}

// A per-subject class test (real or synthesized from the portion table)
// gets its prep material pulled in too -- same subject, same exam cycle --
// so there's no need to jump to the Exam tab just to see what to study for
// a test sitting right here in Upcoming. A single class test only covers
// one chapter, though: Worksheet/Revision notices never name a chapter at
// all (just a number), so there's no way to tell whether one actually
// matches the chapter under test -- a Chapter 3 test showing a Chapter 5
// worksheet is worse than showing nothing, so those are dropped entirely
// rather than shown unfiltered. Only Notes (which do carry a chapter) get
// included, and only when it matches. Portion-table entries have no single
// chapter of their own -- those still show everything.
export function relatedMaterialsFor(notices: Notice[], item: UpcomingItem): Notice[] {
  if (!item.subject || !item.exam_cycle) return [];
  const cycle = item.exam_cycle;
  return notices.filter(
    (m) =>
      m.category === "Subject Notes" &&
      m.subject === item.subject &&
      cyclesOf(m).includes(cycle as string) &&
      (!item.chapter || (m.material_type === "Notes" && m.chapter === item.chapter)),
  );
}
