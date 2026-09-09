import type { BlockCategory, Chapter } from "../../../revision-notebooks/types";
import ChapterGroup from "../ChapterGroup";
import BlockItemCard from "./items/BlockItemCard";

export default function BlockView({ groups, chapters }: { groups: BlockCategory["groups"]; chapters: Chapter[] }) {
  return (
    <>
      {groups.map((g) => (
        <ChapterGroup key={g.chapter} chapter={g.chapter} chapters={chapters}>
          {g.items.map((item, i) => (
            <BlockItemCard key={i} item={item} />
          ))}
        </ChapterGroup>
      ))}
    </>
  );
}
