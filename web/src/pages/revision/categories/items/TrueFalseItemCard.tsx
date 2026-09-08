import type { TrueFalseItem } from "../../../../revision-notebooks/types";

export default function TrueFalseItemCard({ item }: { item: TrueFalseItem }) {
  return (
    <li>
      {item.statement} → <strong>{item.answer ? "True" : "False"}</strong>
      {item.explanation && <> — {item.explanation}</>}
    </li>
  );
}
