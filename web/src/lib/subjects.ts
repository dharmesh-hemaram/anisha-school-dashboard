export interface SubjectMeta {
  abbr: string;
  bg: string;
  fg: string;
}

// Exam-track subjects get their own color + short form; anything else
// (co-curricular, no exam) falls back to one shared neutral badge.
export const SUBJECT_META: Record<string, SubjectMeta> = {
  Maths: { abbr: "MATH", bg: "var(--subj-maths-bg)", fg: "var(--subj-maths)" },
  Science: { abbr: "SCI", bg: "var(--subj-science-bg)", fg: "var(--subj-science)" },
  English: { abbr: "ENG", bg: "var(--subj-english-bg)", fg: "var(--subj-english)" },
  Hindi: { abbr: "HIN", bg: "var(--subj-hindi-bg)", fg: "var(--subj-hindi)" },
  Marathi: { abbr: "MAR", bg: "var(--subj-marathi-bg)", fg: "var(--subj-marathi)" },
  "Social Studies": { abbr: "SST", bg: "var(--subj-sst-bg)", fg: "var(--subj-sst)" },
  "Computer Science": { abbr: "CS", bg: "var(--subj-cs-bg)", fg: "var(--subj-cs)" },
  EVS: { abbr: "EVS", bg: "var(--subj-evs-bg)", fg: "var(--subj-evs)" },
  Robotics: { abbr: "ROB", bg: "var(--subj-robotics-bg)", fg: "var(--subj-robotics)" },
  GK: { abbr: "GK", bg: "var(--subj-gk-bg)", fg: "var(--subj-gk)" },
};

// Co-curricular subjects (no exam) -- a colored badge would be 20+ near-
// indistinguishable hues, so they share one neutral style and just vary by
// abbreviation.
export const NEUTRAL_SUBJECT_ABBR: Record<string, string> = {
  "Art & Craft": "A&C",
  Assembly: "ASM",
  Dance: "DNC",
  Leadership: "LDR",
  "Life Skills": "LS",
  "Martial Arts": "MA",
  Music: "MUS",
  "Reading Program": "RP",
  Skating: "SKT",
  "Speech & Drama": "S&D",
  Sports: "SPT",
};

export function subjectAbbr(subject: string): string {
  const meta = SUBJECT_META[subject];
  return meta ? meta.abbr : NEUTRAL_SUBJECT_ABBR[subject] || subject.slice(0, 4).toUpperCase();
}
