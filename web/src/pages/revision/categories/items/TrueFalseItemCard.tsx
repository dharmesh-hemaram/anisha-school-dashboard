import type { TrueFalseItem } from "../../../../revision-notebooks/types";
import SourceMarks from "../../SourceMarks";

export default function TrueFalseItemCard({ item }: { item: TrueFalseItem }) {
  return (
    <li>
      {item.statement} → <strong>{item.answer ? "True" : "False"}</strong>
      {item.explanation && <> — {item.explanation}</>}
      <SourceMarks sources={item.sources} />
    </li>
  );
}
