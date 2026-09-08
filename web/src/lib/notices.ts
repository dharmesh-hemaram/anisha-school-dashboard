import type { Notice } from "../types";
import { parseDMY, parseISO, fmtDate } from "./date";
import { GREETING_RE } from "./constants";

// exam_cycle is a plain string on Exam/Test records (a class test or portion
// sheet is unambiguously tied to one cycle) but a list on Subject Notes
// records (a chapter can genuinely belong to more than one cycle -- see
// tag_exam_cycles() in datastore/store.py). Normalizes either shape to an
// array so callers never need to care which.
export function cyclesOf(r: Pick<Notice, "exam_cycle">): string[] {
  if (Array.isArray(r.exam_cycle)) return r.exam_cycle;
  return r.exam_cycle ? [r.exam_cycle] : [];
}

/** Every named exam cycle among `notices`, most recently active first. */
export function sortedExamCycles(notices: Notice[]): string[] {
  const cycles = [...new Set(notices.flatMap(cyclesOf))];
  cycles.sort((a, b) => {
    const latest = (c: string) =>
      Math.max(...notices.filter((r) => cyclesOf(r).includes(c)).map((r) => parseDMY(r.posted_date).getTime()));
    return latest(b) - latest(a);
  });
  return cycles;
}

/** The exam cycle with the most recent activity -- "the exam that's current right now". */
export function latestExamCycle(notices: Notice[]): string | null {
  return sortedExamCycles(notices)[0] || null;
}

export function noticeSubjects(r: Notice): Set<string> {
  const subjects = new Set<string>();
  if (r.subject) subjects.add(r.subject);
  (r.periods || []).forEach((p) => {
    if (p.subject) subjects.add(p.subject);
  });
  return subjects;
}

export function firstLine(text: string): string {
  const lines = text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return lines.find((l) => !GREETING_RE.test(l)) || lines[0] || text;
}

export function noticeTitle(r: Notice): string {
  if (r.subject && r.chapter) return `${r.subject} — ${r.chapter}`;
  if (r.subject) return r.subject;
  if (r.is_timetable) return `Timetable — ${fmtDate(parseISO(r.event_date_iso))}`;
  if (r.category === "Daily Class Update") return "Daily Class Update";
  return firstLine(r.text);
}
