import type { Category, MaterialType } from "../types";

export interface CategoryMeta {
  dot: string;
  label: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  "Exam/Test": { dot: "var(--dot-exam)", label: "Exam/Test" },
  "School Event": { dot: "var(--dot-event)", label: "School Event" },
  Holiday: { dot: "var(--dot-holiday)", label: "Holiday" },
  "Subject Notes": { dot: "var(--dot-notes)", label: "Subject Notes" },
  "Daily Class Update": { dot: "var(--dot-dcu)", label: "Daily Update" },
  "Event/Celebration": { dot: "var(--dot-celeb)", label: "Celebration" },
  "General/Other": { dot: "var(--dot-general)", label: "General" },
};

export const UPCOMING_CATEGORIES: Category[] = ["Exam/Test", "School Event", "Holiday"];

// Exam/Test and Subject Notes have their own dedicated tabs (Exam, Notes)
// with much better treatment (portion table, grouped-by-cycle materials) --
// showing them in Feed too is just noise duplicating those tabs.
export const FEED_CATEGORIES: Category[] = (Object.keys(CATEGORY_META) as Category[]).filter(
  (c) => c !== "Exam/Test" && c !== "Subject Notes",
);

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

// A photo attachment (a seek-kit materials list, a Facebook-recap photo) is
// more useful shown inline than as a bare "View attachment" link -- a PDF
// (worksheet, portion sheet) still needs the link since it can't render
// inline anyway.
export const IMAGE_ATTACHMENT_RE = /\.(jpe?g|png|gif|webp)$/i;

export const GREETING_RE = /^dear (parents?|parent)s?,?$/i;
