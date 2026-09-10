import type { Chapter, NotebookCategoryEntry } from "../../revision-notebooks/types";
import { AccordionItem, AccordionTrigger, AccordionContent } from "../../components/ui/accordion";
import CategoryDispatch from "./CategoryDispatch";

interface CategorySectionProps {
  entry: NotebookCategoryEntry;
  chapters: Chapter[];
}

/** One numbered section of a revision notebook (e.g. "1. Fill in the
 * Blanks") as an accordion item -- header, optional note, and its chapter
 * groups. Purely a function of `entry`/`chapters`, so a notebook's
 * categories.map() just feeds each entry into this one component instead
 * of repeating the section chrome per category. */
export default function CategorySection({ entry, chapters }: CategorySectionProps) {
  return (
    <AccordionItem value={entry.num} id={`cat-${entry.num}`} className="scroll-mt-32">
      <AccordionTrigger>
        {entry.num}. {entry.title}
      </AccordionTrigger>
      <AccordionContent>
        {entry.note && <p className="text-muted-foreground mb-2 text-sm">{entry.note}</p>}
        <CategoryDispatch data={entry.data} chapters={chapters} />
      </AccordionContent>
    </AccordionItem>
  );
}
