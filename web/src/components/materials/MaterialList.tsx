import type { Notice } from "../../types";
import MaterialRow from "./MaterialRow";

interface MaterialListProps {
  items: Notice[];
  showTag?: boolean;
}

/** A list of `MaterialRow`s -- the one place row rendering happens, reused
 * by the Notes tab's type-grouped sections, the Exam tab's subject cards,
 * and the Upcoming tab's related-materials block. */
export default function MaterialList({ items, showTag = true }: MaterialListProps) {
  return (
    <>
      {items.map((r) => (
        <MaterialRow key={r.id} notice={r} showTag={showTag} />
      ))}
    </>
  );
}
