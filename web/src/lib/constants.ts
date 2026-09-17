import { CalendarDays, ClipboardList, Info, Megaphone, Newspaper, PartyPopper, type LucideIcon } from "lucide-react";
import type { Category, MaterialType } from "../types";

export interface CategoryMeta {
  dot: string;
  label: string;
  icon: LucideIcon;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  "Exam/Test": { dot: "var(--dot-exam)", label: "Exam/Test", icon: ClipboardList },
  "School Event": { dot: "var(--dot-event)", label: "School Event", icon: CalendarDays },
  Holiday: { dot: "var(--dot-holiday)", label: "Holiday", icon: PartyPopper },
  "Subject Notes": { dot: "var(--dot-notes)", label: "Subject Notes", icon: Newspaper },
  "Daily Class Update": { dot: "var(--dot-dcu)", label: "Daily Update", icon: Megaphone },
  "Event/Celebration": { dot: "var(--dot-celeb)", label: "Celebration", icon: PartyPopper },
  "General/Other": { dot: "var(--dot-general)", label: "General", icon: Info },
};

// Every category, in CATEGORY_META's declared order -- used to drive the
// History tab's category filter row now that History shows everything
// (Exam/Test and Subject Notes included) rather than excluding the
// categories that also have their own dedicated tabs.
export const ALL_CATEGORIES: Category[] = Object.keys(CATEGORY_META) as Category[];

export interface MaterialTagMeta {
  cls: string;
  label: string;
}

export const MATERIAL_TAG_META: Partial<Record<NonNullable<MaterialType>, MaterialTagMeta>> = {
  Worksheet: { cls: "tagWorksheet", label: "Worksheet" },
  Revision: { cls: "tagRevision", label: "Revision" },
  "Answer Key": { cls: "tagAnswerKey", label: "Answer Key" },
};

// Shared type ordering: Notes tab groups under a heading per type in this
// order, and the Exam tab's subject cards (which mix types in one card, so
// no headings) cluster by the same order instead of interleaving by date --
// reads as "the notes, then the worksheets, then the revision" rather than
// shuffled by whenever each happened to be posted.
export const MATERIAL_GROUPS: { type: NonNullable<MaterialType>; label: string }[] = [
  { type: "Notes", label: "Notes" },
  { type: "Revision", label: "Revision" },
  { type: "Worksheet", label: "Worksheets" },
  { type: "Answer Key", label: "Answer Key" },
];

export const MATERIAL_TYPE_ORDER = MATERIAL_GROUPS.map((g) => g.type);

export const HW_COMPLETED_KEY = "hwCompleted_v1";
export const HW_SEEDED_KEY = "hwSeeded_v1";
export const HW_WINDOW_DAYS = 14; // how far back the HW tab looks
export const HW_SEED_DAYS = 7; // backlog older than this is auto-marked done on first-ever load

// Per-fact miss counts for the Tables quiz -- how many more times a fact
// needs to come up (and be answered right) before it stops being weighted
// as a weak spot. Keyed "N-M", e.g. "7-8".
export const TABLES_QUIZ_MISSES_KEY = "tablesQuizMisses_v1";

// A photo attachment (a seek-kit materials list, a Facebook-recap photo) is
// more useful shown inline than as a bare "View attachment" link -- a PDF
// (worksheet, portion sheet) still needs the link since it can't render
// inline anyway.
export const IMAGE_ATTACHMENT_RE = /\.(jpe?g|png|gif|webp)$/i;

export const GREETING_RE = /^dear (parents?|parent)s?,?$/i;
