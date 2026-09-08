import type { Notice, PortionScheduleRow, PortionSchedules } from "../types";
import { parseDMY } from "./date";
import { MATERIAL_TYPE_ORDER } from "./constants";

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

// A batch notice covers more than one number -- "Revision-1,2,3,4", "PFA
// Revision 1 to 4" -- worksheet_numbers holds every one of them, e.g.
// [1, 2, 3, 4]. Four-or-more-consecutive reads as a range ("No. 1–4"); a
// shorter or non-consecutive set is listed out ("No. 7, 8").
export function formatNumberList(nums: number[]): string {
  if (nums.length === 1) return `${nums[0]}`;
  const isRange = nums.length >= 3 && nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
  return isRange ? `${nums[0]}–${nums[nums.length - 1]}` : nums.join(", ");
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
