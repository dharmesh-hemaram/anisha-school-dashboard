import type { Chapter, QaCategory } from "../../../revision-notebooks/types";
import ChapterGroup from "../ChapterGroup";
import QaItemCard from "./items/QaItemCard";

// Backs Define, Write Short Answers, Long Answers, and Application Based --
// all four categories in the notebook share this exact type, so this one
// view (and the QaItemCard it renders) is what all four actually run on.
export default function QaView({ groups, chapters }: { groups: QaCategory["groups"]; chapters: Chapter[] }) {
  return (
    <>
      {groups.map((g) => (
        <ChapterGroup key={g.chapter} chapter={g.chapter} chapters={chapters}>
          {g.items.map((item, i) => (
            <QaItemCard key={i} item={item} />
          ))}
        </ChapterGroup>
      ))}
    </>
  );
}
