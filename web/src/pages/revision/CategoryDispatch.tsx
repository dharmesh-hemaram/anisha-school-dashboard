import type { Chapter, NotebookCategoryData } from "../../revision-notebooks/types";
import FibView from "./categories/FibView";
import MatchView from "./categories/MatchView";
import TrueFalseView from "./categories/TrueFalseView";
import NameView from "./categories/NameView";
import QaView from "./categories/QaView";
import CapitalsView from "./categories/CapitalsView";
import McqView from "./categories/McqView";
import PictureView from "./categories/PictureView";
import VocabView from "./categories/VocabView";
import BlockView from "./categories/BlockView";
import PassageView from "./categories/PassageView";

export default function CategoryDispatch({ data, chapters }: { data: NotebookCategoryData; chapters: Chapter[] }) {
  switch (data.type) {
    case "fib":
      return <FibView groups={data.groups} chapters={chapters} />;
    case "match":
      return <MatchView groups={data.groups} chapters={chapters} />;
    case "trueFalse":
      return <TrueFalseView groups={data.groups} chapters={chapters} />;
    case "name":
      return <NameView groups={data.groups} chapters={chapters} />;
    case "qa":
      return <QaView groups={data.groups} chapters={chapters} />;
    case "capitals":
      return <CapitalsView groups={data.groups} chapters={chapters} />;
    case "mcq":
      return <McqView groups={data.groups} chapters={chapters} />;
    case "picture":
      return <PictureView groups={data.groups} chapters={chapters} />;
    case "vocab":
      return <VocabView groups={data.groups} chapters={chapters} />;
    case "block":
      return <BlockView groups={data.groups} chapters={chapters} />;
    case "passage":
      return <PassageView groups={data.groups} chapters={chapters} />;
  }
}
