import type { Chapter, McqCategory } from "../../../revision-notebooks/types";
import ChapterGroup from "../ChapterGroup";
import McqItemCard from "./items/McqItemCard";

export default function McqView({ groups, chapters }: { groups: McqCategory["groups"]; chapters: Chapter[] }) {
  return (
    <>
      {groups.map((g) => (
        <ChapterGroup key={g.chapter} chapter={g.chapter} chapters={chapters}>
          {g.items.map((item, i) => (
            <McqItemCard key={i} item={item} />
          ))}
        </ChapterGroup>
      ))}
    </>
  );
}
