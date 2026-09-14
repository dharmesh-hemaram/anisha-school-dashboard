import type { TimetablePeriod } from "../types";

export const DAY_ORDER = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// The last row in timetable.json ends at 2:30 p.m. -- once that passes, the
// school day is over and "today's" schedule stops being the relevant one to
// show; the active day rolls forward to the next school day instead.
export const SCHOOL_END_MINUTES = 14 * 60 + 30;

// Mon/Tue and Thu/Fri are regular uniform; Wed and Sat are sports dress.
export const DRESS_CODE: Record<string, "Uniform" | "Sports"> = {
  Monday: "Uniform",
  Tuesday: "Uniform",
  Wednesday: "Sports",
  Thursday: "Uniform",
  Friday: "Uniform",
  Saturday: "Sports",
};

function parseClockTime(raw: string): number | null {
  const m = raw.trim().match(/(\d{1,2}):(\d{2})\s*([ap])\.?\s*m\.?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3].toLowerCase();
  if (ap === "p" && h !== 12) h += 12;
  if (ap === "a" && h === 12) h = 0;
  return h * 60 + min;
}

/** Parses a "8:10 a.m. – 8:45 a.m." style range into [startMinutes, endMinutes]. */
export function parseTimeRange(range: string): [number, number] | null {
  const parts = range.split(/[–—-]/).map((s) => s.trim());
  if (parts.length !== 2) return null;
  const start = parseClockTime(parts[0]);
  const end = parseClockTime(parts[1]);
  if (start === null || end === null) return null;
  return [start, end];
}

// 1st/3rd/5th Saturday of the month is a holiday; 2nd/4th has school -- not
// in any scraped source (docs/holidays.json only lists the 3 Saturdays that
// happen to coincide with a named holiday, not this recurring pattern), so
// this is a hardcoded rule that has to be kept in sync with the school's
// actual policy by hand.
export function isSchoolSaturday(date: Date): boolean {
  const nth = Math.ceil(date.getDate() / 7);
  return nth % 2 === 0;
}

/** Same as `days.includes(dayName)`, except a Saturday also has to pass the
 * 2nd/4th-Saturday rule -- a holiday Saturday is treated exactly like a
 * Sunday, not a school day at all. */
export function isSchoolDay(days: string[], date: Date): boolean {
  const name = DAY_ORDER[date.getDay()];
  if (!days.includes(name)) return false;
  return name !== "Saturday" || isSchoolSaturday(date);
}

export interface ActiveDay {
  /** The day whose schedule should be shown by default. */
  day: string;
  /** True when `day` is the real calendar day today, and school hasn't ended yet. */
  isLiveToday: boolean;
  /** The actual calendar date `day` refers to -- e.g. so "Next" can say
   * which date that is, not just the weekday name. */
  date: Date;
}

/** Picks the day to show by default: today while school is still in session
 * (before 2:30 p.m.), otherwise the next school day -- rolling past Sundays,
 * holiday Saturdays, and any day missing from the timetable. */
export function getActiveDay(days: string[], now: Date): ActiveDay {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const todayName = DAY_ORDER[now.getDay()];
  if (isSchoolDay(days, now) && nowMinutes < SCHOOL_END_MINUTES) {
    return { day: todayName, isLiveToday: true, date: now };
  }
  for (let i = 1; i <= 7; i++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + i);
    if (isSchoolDay(days, candidate)) return { day: DAY_ORDER[candidate.getDay()], isLiveToday: false, date: candidate };
  }
  return { day: todayName, isLiveToday: false, date: now };
}

/** The row (period or break) whose time range contains `now`, if any --
 * used to highlight the current slot while a school day is live. */
export function currentRow(periods: TimetablePeriod[], now: Date): TimetablePeriod | null {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (const p of periods) {
    const range = parseTimeRange(p.time);
    if (range && nowMinutes >= range[0] && nowMinutes < range[1]) {
      return p;
    }
  }
  return null;
}
