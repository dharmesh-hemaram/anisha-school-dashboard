import type { Notice } from "../../types";
import { fmtDate, parseDMY } from "../../lib/date";
import { materialHref, materialTitle } from "../../lib/materials";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "../ui/item";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface MaterialItemProps {
  /** One or more notices sharing this row -- more than one only when they're
   * the same chapter/number posted more than once (e.g. re-shared later in
   * the term), in which case each still gets its own View action. */
  notices: Notice[];
  /** Overrides the row's own title (chapter / "Worksheet No. 3") -- the
   * Upcoming tab's single-material shortcut shows the subject instead,
   * since there's nothing else on the card to group it under. */
  title?: string;
  /** Exam cycle(s) this chapter belongs to (a chapter can be tested in more
   * than one cycle) -- shown as a badge next to the title so the Notes
   * tab's type-grouped list still says which exam each item is for, now
   * that cycle is no longer the grouping itself. */
  cycles?: string[];
}

/** One material notice (or a few duplicates of the same chapter/number) as
 * an Item row: title + posted date(s) + a "View" action per notice --
 * shared by the Upcoming tab's single-material shortcut and the Notes
 * tab's type-grouped lists, so a related note looks the same everywhere it
 * shows up. */
export default function MaterialItem({ notices, title, cycles }: MaterialItemProps) {
  const primary = notices[0];
  // A Worksheet is two documents in one row -- the question sheet and,
  // once it exists, its Answer Key -- so both get their own action instead
  // of materialHref's single link (which only ever picks one). Duplicate
  // Worksheet notices for the same number aren't expected, so this only
  // ever looks at the first.
  const isWorksheet = primary.material_type === "Worksheet";
  const postedDates = notices.map((n) => fmtDate(parseDMY(n.posted_date)));

  return (
    <Item variant="outline" size="xs">
      <ItemContent>
        <ItemTitle>
          {title ?? materialTitle(primary)}
          {cycles?.map((c) => (
            <Badge key={c} variant="secondary" className="shrink-0 text-[10px] font-bold tracking-wide uppercase">
              {c}
            </Badge>
          ))}
        </ItemTitle>
        <ItemDescription>Posted {postedDates.join(", ")}</ItemDescription>
      </ItemContent>
      {isWorksheet ? (
        (primary.attachment_url || primary.answer_key_url) && (
          <ItemActions>
            {primary.attachment_url && (
              <Button size="xs" variant="outline" nativeButton={false} render={<a href={primary.attachment_url} target="_blank" rel="noopener noreferrer" />}>
                Question
              </Button>
            )}
            {primary.answer_key_url && (
              <Button size="xs" variant="outline" nativeButton={false} render={<a href={primary.answer_key_url} target="_blank" rel="noopener noreferrer" />}>
                Answer
              </Button>
            )}
          </ItemActions>
        )
      ) : (
        notices.some((n) => materialHref(n)) && (
          <ItemActions>
            {notices.map((n) => {
              const href = materialHref(n);
              if (!href) return null;
              return (
                <Button key={n.id} size="xs" variant="outline" nativeButton={false} render={<a href={href} target="_blank" rel="noopener noreferrer" />}>
                  {notices.length > 1 ? `View (${fmtDate(parseDMY(n.posted_date))})` : "View"}
                </Button>
              );
            })}
          </ItemActions>
        )
      )}
    </Item>
  );
}
