import type { Chapter, TrueFalseCategory } from "../../../revision-notebooks/types";
import ChapterGroup from "../ChapterGroup";
import TrueFalseItemCard from "./items/TrueFalseItemCard";

export default function TrueFalseView({ groups, chapters }: { groups: TrueFalseCategory["groups"]; chapters: Chapter[] }) {
  return (
    <>
      {groups.map((g) => (
        <ChapterGroup key={g.chapter} chapter={g.chapter} chapters={chapters}>
          <ol>
            {g.items.map((item, i) => (
              <TrueFalseItemCard key={i} item={item} />
            ))}
          </ol>
        </ChapterGroup>
      ))}
    </>
  );
}
