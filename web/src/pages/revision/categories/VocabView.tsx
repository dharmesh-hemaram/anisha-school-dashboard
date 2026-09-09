import type { Chapter, VocabCategory } from "../../../revision-notebooks/types";
import ChapterGroup from "../ChapterGroup";
import VocabItemCard from "./items/VocabItemCard";

export default function VocabView({ groups, chapters }: { groups: VocabCategory["groups"]; chapters: Chapter[] }) {
  return (
    <>
      {groups.map((g) => (
        <ChapterGroup key={g.chapter} chapter={g.chapter} chapters={chapters}>
          {g.items.map((item, i) => (
            <VocabItemCard key={i} item={item} />
          ))}
        </ChapterGroup>
      ))}
    </>
  );
}
