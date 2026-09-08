export type Category =
  | "Exam/Test"
  | "School Event"
  | "Holiday"
  | "Subject Notes"
  | "Daily Class Update"
  | "Event/Celebration"
  | "General/Other";

export type MaterialType = "Notes" | "Revision" | "Worksheet" | "Answer Key" | "Portion" | null;

export interface Period {
  period: number;
  subject?: string | null;
  note?: string | null;
  hw?: string | null;
}

export interface Notice {
  id: string;
  posted_date: string; // DD-MM-YYYY
  posted_date_iso: string; // YYYY-MM-DD
  event_date_iso: string;
  text: string;
  attachment_url: string | null;
  category: Category;
  method: string;
  periods: Period[];
  is_timetable: boolean;
  confidence: number;
  subject: string | null;
  chapter: string | null;
  chapter_number: number | null;
  material_type: MaterialType;
  worksheet_numbers: number[] | null;
  answer_key_url: string | null;
  paired: boolean;
  calendar_event_id: string | null;
  // A plain string on Exam/Test records, an array on Subject Notes records.
  exam_cycle: string | string[] | null;
}

/** A synthesized Upcoming-tab entry derived from a portion-table row, not a real scraped Notice. */
export interface SyntheticNotice extends Omit<Notice, "exam_cycle"> {
  isSynthetic: true;
  exam_cycle: string | null;
}

export type UpcomingItem = (Notice | SyntheticNotice) & { _days: number };

export interface PortionScheduleRow {
  date_iso: string;
  day: string;
  subject: string;
  portion: string;
  marks?: number | null;
  revision_notebook_url?: string | null;
}

export interface PortionSchedule {
  max_marks?: number | null;
  timing?: string | null;
  notes?: string[];
  schedule: PortionScheduleRow[];
}

export type PortionSchedules = Record<string, PortionSchedule>;

export interface HolidayEntry {
  date_iso: string;
  day: string;
  name: string;
}

export interface Holidays {
  holidays: HolidayEntry[];
  vacations: HolidayEntry[];
}

export interface CalendarEventEntry {
  date_iso: string;
  day: string;
  name: string;
}

export interface PtmEntry {
  date_iso: string;
  label: string;
  scope?: string | null;
}

export interface EventsCalendar {
  events: CalendarEventEntry[];
  ptm: PtmEntry[];
  exam_windows: unknown[];
}

export interface LastUpdated {
  last_updated: string;
}

export interface TimetablePeriod {
  period: number | null;
  time: string;
  break?: string;
  subjects?: Record<string, string>;
}

export interface Timetable {
  days: string[];
  periods: TimetablePeriod[];
}

export interface HwTask {
  id: string;
  subject: string | null;
  text: string;
  date_iso: string;
  posted_date: string;
}
