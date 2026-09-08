export type ChapterId = "gov" | "delhi" | "leaders" | "transport";

export interface Chapter {
  id: ChapterId;
  label: string;
}

export interface SourceMarks {
  revisionSheet?: boolean;
  worksheet?: boolean;
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

export type NotebookCategoryData =
  | FibCategory
  | MatchCategory
  | TrueFalseCategory
  | NameCategory
  | QaCategory
  | CapitalsCategory
  | McqCategory
  | PictureCategory;

export interface NotebookCategoryEntry {
  num: number;
  title: string;
  note?: string;
  data: NotebookCategoryData;
}

export interface RevisionNotebook {
  slug: string;
  subjectBadge: string;
  title: string;
  subtitle: string;
  examMeta: string;
  chapters: Chapter[];
  categories: NotebookCategoryEntry[];
  footerNote: string;
}
