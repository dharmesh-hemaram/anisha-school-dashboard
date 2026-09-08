import type { Chapter, MatchCategory } from "../../../revision-notebooks/types";
import ChapterGroup from "../ChapterGroup";
import MatchSetCard from "./items/MatchSetCard";

export default function MatchView({ groups, chapters }: { groups: MatchCategory["groups"]; chapters: Chapter[] }) {
  return (
    <>
      {groups.map((g) => (
        <ChapterGroup key={g.chapter} chapter={g.chapter} chapters={chapters}>
          {g.sets.map((set, i) => (
            <MatchSetCard key={i} set={set} />
          ))}
        </ChapterGroup>
      ))}
    </>
  );
}
