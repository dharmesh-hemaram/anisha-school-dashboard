import type { Chapter, NameCategory } from "../../../revision-notebooks/types";
import ChapterGroup from "../ChapterGroup";
import NameItemCard from "./items/NameItemCard";

export default function NameView({ groups, chapters }: { groups: NameCategory["groups"]; chapters: Chapter[] }) {
  return (
    <>
      {groups.map((g) => (
        <ChapterGroup key={g.chapter} chapter={g.chapter} chapters={chapters}>
          <ul>
            {g.items.map((item, i) => (
              <NameItemCard key={i} item={item} />
            ))}
          </ul>
        </ChapterGroup>
      ))}
    </>
  );
}
