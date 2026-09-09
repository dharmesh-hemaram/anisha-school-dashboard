// A notebook defines its own chapter ids in its JSON (see `chapters` below)
// -- this stays a plain string rather than a per-subject union so one set of
// components/styles works for every notebook without a code change.
export type ChapterId = string;

export interface Chapter {
  id: ChapterId;
  label: string;
}

export interface SourceMarks {
  /** Copied out in her own notebook (an "eklavyā"-branded copybook page). */
  notes?: boolean;
  /** A printed textbook / workbook exercise page. */
  textbook?: boolean;
  /** A loose school worksheet ("Worksheet No. X"). */
  worksheet?: boolean;
  /** A "Revision-N" homework handout. */
  revisionSheet?: boolean;
}

// 1. Fill in the Blanks -- a sentence with the answer hidden until "Show
// answers" is tapped. Grouped into one or more sets per chapter since a
// chapter can carry a second "more practice blanks" set discovered later.
export interface FibItem {
  /** The sentence with each blank's position marked by "___". */
  template: string;
  /** One answer per "___" in `template`, in order -- most sentences have one blank, a few have two. */
  answers: string[];
  sources?: SourceMarks;
}
export interface FibSet {
  note?: string;
  items: FibItem[];
}
export interface FibCategory {
  type: "fib";
  groups: { chapter: ChapterId; sets: FibSet[] }[];
}

// 2. Match the Following -- table pairs, split into named sets (Set A/Set B)
// where the source has more than one table per chapter.
export interface MatchPair {
  left: string;
  right: string;
  /** Raw inline SVG markup -- only the Transport chapter's road-sign set
   * uses an icon instead of text in its left column. */
  leftSvg?: string;
}
export interface MatchSet {
  label?: string;
  sources?: SourceMarks;
  columns: [string, string];
  pairs: MatchPair[];
  /** "1–c, 2–e, ..." -- absent for the road-signs set, which has no
   * separate answer key (the meaning is the answer). */
  answerLine?: string;
}
export interface MatchCategory {
  type: "match";
  groups: { chapter: ChapterId; sets: MatchSet[] }[];
}

// 3. True or False
export interface TrueFalseItem {
  statement: string;
  answer: boolean;
  /** The trailing "— They live in ..." correction, only present on some items. */
  explanation?: string;
  sources?: SourceMarks;
}
export interface TrueFalseCategory {
  type: "trueFalse";
  groups: { chapter: ChapterId; items: TrueFalseItem[] }[];
}

// 4. Name the Following / One Word
export interface NameItem {
  prompt: string;
  answer: string;
  sources?: SourceMarks;
}
export interface NameCategory {
  type: "name";
  groups: { chapter: ChapterId; items: NameItem[] }[];
}

// 5, 7, 8, 9 in the source (Define / Short Answer / Long Answer /
// Application Based) all share the exact same question+answer markup, so
// they share this one type -- only the category heading differs.
export interface QaItem {
  question: string;
  /** Pulled out of an inline `<img class="leader-thumb">` sitting mid-question. */
  questionLeaderImage?: string;
  /** A string for a single-paragraph answer, a string array when the
   * source used a bulleted `<ul>` answer. */
  answer: string | string[];
  sources?: SourceMarks;
}
export interface QaCategory {
  type: "qa";
  groups: { chapter: ChapterId; items: QaItem[] }[];
}

// 6. State / UT Capitals
export interface CapitalRow {
  state: string;
  capital: string;
  sources?: SourceMarks;
}
export interface CapitalsCategory {
  type: "capitals";
  groups: { chapter: ChapterId; rows: CapitalRow[] }[];
}

// 10. MCQ Practice
export interface McqItem {
  question: string;
  /** Kept as one already-formatted string, e.g. "(a) ... (b) ... (c) ..." --
   * splitting it into an options array loses the source's own em-dash and
   * spacing choices for no real benefit. */
  options: string;
  answer: string;
  sources?: SourceMarks;
}
export interface McqCategory {
  type: "mcq";
  groups: { chapter: ChapterId; items: McqItem[] }[];
}

// 11. Picture Study
export interface PictureItem {
  image: string;
  /** May itself contain multiple numbered lines -- kept pre-line, not split. */
  caption: string;
  sources?: SourceMarks;
}
export interface LeaderGridItem {
  image: string;
  caption: string;
}
export interface PictureCategory {
  type: "picture";
  groups: {
    chapter: ChapterId;
    items: PictureItem[];
    leaderGrid?: { label: string; items: LeaderGridItem[] };
  }[];
}

// 12. Vocabulary -- a word, its meaning, and a worked example sentence.
// Distinct from QaItem (question/answer) because every literature chapter's
// "new words" notebook page is this word+meaning+sentence triple, not a Q&A.
export interface VocabItem {
  word: string;
  meaning: string;
  example: string;
  sources?: SourceMarks;
}
export interface VocabCategory {
  type: "vocab";
  groups: { chapter: ChapterId; items: VocabItem[] }[];
}

// 13. Labeled text blocks -- a heading plus ordered lines, rendered as
// plain paragraph text (no bullets). Generic enough to carry both the
// "format of a letter" checklist and a full worked letter, so Composition
// doesn't need its own bespoke letter type.
export interface BlockItem {
  heading?: string;
  lines: string[];
  sources?: SourceMarks;
}
export interface BlockCategory {
  type: "block";
  groups: { chapter: ChapterId; items: BlockItem[] }[];
}

// 14. Unseen Comprehension -- a passage she hadn't seen before, plus the
// Q&A she answered about it. Reuses QaItem for the questions so answer
// rendering (incl. bulleted answers) doesn't need a second implementation.
export interface PassageItem {
  title: string;
  text: string;
  /** When she practiced it, e.g. "23 Apr 2026" -- omitted where illegible. */
  date?: string;
  questions: QaItem[];
  sources?: SourceMarks;
}
export interface PassageCategory {
  type: "passage";
  groups: { chapter: ChapterId; note?: string; items: PassageItem[] }[];
}

export type NotebookCategoryData =
  | FibCategory
  | MatchCategory
  | TrueFalseCategory
  | NameCategory
  | QaCategory
  | CapitalsCategory
  | McqCategory
  | PictureCategory
  | VocabCategory
  | BlockCategory
  | PassageCategory;

export interface NotebookCategoryEntry {
  num: number;
  title: string;
  note?: string;
  data: NotebookCategoryData;
}

export interface RevisionNotebook {
  slug: string;
  /** Full subject name as used in lib/subjects.ts's SUBJECT_META (e.g.
   * "Social Studies", "English") -- drives the header badge's color+abbreviation. */
  subjectBadge: string;
  title: string;
  subtitle: string;
  examMeta: string;
  chapters: Chapter[];
  categories: NotebookCategoryEntry[];
  footerNote: string;
}
