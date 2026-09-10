import { CalendarDays, PartyPopper } from "lucide-react";
import type { WeekStripItem } from "../../lib/upcoming";
import { fmtDate, parseISO } from "../../lib/date";
import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription } from "../../components/ui/item";

export default function WeekStrip({ items }: { items: WeekStripItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">This week</p>
      {items.map((x) => (
        <Item key={`${x.date_iso}-${x.name}`} variant="muted" size="xs">
          <ItemMedia variant="icon">{x.kind === "holiday" ? <PartyPopper /> : <CalendarDays />}</ItemMedia>
          <ItemContent>
            <ItemTitle>{x.name}</ItemTitle>
            <ItemDescription>{x._days === 0 ? "Today" : x._days === 1 ? "Tomorrow" : fmtDate(parseISO(x.date_iso))}</ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </div>
  );
}
