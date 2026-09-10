import type { Notice, PortionScheduleRow, PortionSchedules } from "../types";
import { parseDMY } from "./date";
import { MATERIAL_TAG_META, MATERIAL_TYPE_ORDER } from "./constants";
import { firstLine } from "./notices";

// Every material row is one click target, straight to the one attachment
// that's actually useful next -- no icon, no picking between links. A
// Worksheet opens its paired Answer Key once one exists (checking your
// answers is the next step once the worksheet's done), falling back to the
// worksheet itself before that; Notes/Revision/a lone Answer Key each only
// ever have their own single attachment anyway.
export function materialHref(r: Notice): string | null {
  if (r.material_type === "Worksheet") return r.answer_key_url || r.attachment_url || null;
  return r.attachment_url || null;
}

// The chapter extractor sometimes keeps a trailing "(Notebook)"/"( textbook
// )" source annotation, or the same thing with no parens at all ("Notebook
// writing") -- the same chapter posted from two different copies of the
// lesson should read as one chapter, not two, so strip it before ever
// displaying or keying on the chapter name. The parenthesized form mirrors
// the Python pipeline's own _normalize_match_text (datastore/store.py),
// which strips the same annotation for portion-sheet matching.
function stripSourceAnnotation(s: string): string {
  return s
    .replace(/\([^)]*\)\s*$/, "")
    .replace(/\s*[-–—]?\s*(notebook|textbook)(\s+writing)?\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

// The raw notice text is verbose boilerplate ("PFA the Culmination Worksheet
// No. 3 for English") when all that's actually new information is the
// number -- the subject/type is already the card/section it's filed under.
// Prefer the chapter name when there is one, then the already-extracted
// worksheet_numbers for a plain "Worksheet No. 3" / "Revision No. 1–4",
// falling back to the raw text only when neither is available.
export function materialTitle(r: Notice): string {
  if (r.chapter) {
    const chapter = stripSourceAnnotation(r.chapter);
    if (chapter) return chapter;
  }
  const tagMeta = r.material_type && MATERIAL_TAG_META[r.material_type];
  if (tagMeta && (r.material_type === "Worksheet" || r.material_type === "Revision") && r.worksheet_numbers?.length) {
    return `${tagMeta.label} No. ${formatNumberList(r.worksheet_numbers)}`;
  }
  return firstLine(r.text);
}

// A batch notice covers more than one number -- "Revision-1,2,3,4", "PFA
// Revision 1 to 4" -- worksheet_numbers holds every one of them, e.g.
// [1, 2, 3, 4]. Four-or-more-consecutive reads as a range ("No. 1–4"); a
// shorter or non-consecutive set is listed out ("No. 7, 8").
export function formatNumberList(nums: number[]): string {
  if (nums.length === 1) return `${nums[0]}`;
  const isRange = nums.length >= 3 && nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
  return isRange ? `${nums[0]}–${nums[nums.length - 1]}` : nums.join(", ");
}

// Two notices for the same chapter/number -- e.g. the same chapter re-shared
// later in the term -- are really one piece of material, not two separate
// rows. Groups already-sorted `items` into same-title, same-type clusters,
// preserving first-seen order, so the Notes tab can render one Item per
// cluster with every notice's own date and View action.
export function groupMaterialsByTitle(items: Notice[]): Notice[][] {
  const groups = new Map<string, Notice[]>();
  for (const r of items) {
    const key = `${r.material_type ?? ""}::${materialTitle(r)}`;
    const group = groups.get(key);
    if (group) group.push(r);
    else groups.set(key, [r]);
  }
  return [...groups.values()];
}

// Notes, then Worksheets, then Revision... rather than interleaved by date
// -- reads as "the notes, then the worksheets, then the revision" instead
// of shuffled by whenever each happened to be posted. Shared by the Exam
// tab's subject cards and the Upcoming tab's related-materials block.
export function sortMaterialsByTypeThenDate(items: Notice[]): Notice[] {
  const typeRank = (r: Notice) => {
    const i = r.material_type ? MATERIAL_TYPE_ORDER.indexOf(r.material_type as never) : -1;
    return i === -1 ? MATERIAL_TYPE_ORDER.length : i;
  };
  return [...items].sort(
    (a, b) => typeRank(a) - typeRank(b) || parseDMY(b.posted_date).getTime() - parseDMY(a.posted_date).getTime(),
  );
}

// A subject's slot in the portion table -- date, marks, portion text, and
// optionally a revision-notebook link. Looked up by cycle+subject so any
// card for that subject (the Exam tab's subject card, the Upcoming tab's
// exam card) can show the same schedule extras, not just the same
// materials list.
export function findScheduleRow(
  portionSchedules: PortionSchedules,
  cycle: string | null | undefined,
  subject: string | null | undefined,
): PortionScheduleRow | undefined {
  if (!cycle || !subject) return undefined;
  return portionSchedules[cycle]?.schedule.find((row) => row.subject === subject);
}
