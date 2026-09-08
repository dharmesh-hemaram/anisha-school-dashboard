import type { NameItem } from "../../../../revision-notebooks/types";
import SourceMarks from "../../SourceMarks";

export default function NameItemCard({ item }: { item: NameItem }) {
  return (
    <li>
      {item.prompt} — <strong>{item.answer}</strong>
      <SourceMarks sources={item.sources} />
    </li>
  );
}
