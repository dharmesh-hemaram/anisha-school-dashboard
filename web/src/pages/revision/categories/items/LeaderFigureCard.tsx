import type { LeaderGridItem } from "../../../../revision-notebooks/types";
import { resolveImage } from "../../../../revision-notebooks/resolveImage";

export default function LeaderFigureCard({ item }: { item: LeaderGridItem }) {
  return (
    <figure>
      <img src={resolveImage(item.image)} alt={item.caption} />
      <figcaption>{item.caption}</figcaption>
    </figure>
  );
}
