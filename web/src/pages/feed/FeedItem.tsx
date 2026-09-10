import { ChevronDown, ChevronUp } from "lucide-react";
import type { Notice } from "../../types";
import { CATEGORY_META } from "../../lib/constants";
import { noticeTitle } from "../../lib/notices";
import { todayISO } from "../../lib/date";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";
import { Badge } from "../../components/ui/badge";
import AttachmentLink from "../../components/ui/AttachmentLink";
import PeriodList from "./PeriodList";

/** Same collapsible-card shell as the Upcoming tab's ActionCard -- icon +
 * title in the header, chevron toggling, attachment link in the body --
 * just without the day-countdown badge, which only makes sense for
 * upcoming (not already-posted) items. */
export default function FeedItem({ notice: r }: { notice: Notice }) {
  const categoryMeta = CATEGORY_META[r.category];
  const KindIcon = categoryMeta.icon;
  const isTodayTimetable = r.is_timetable && r.event_date_iso === todayISO();

  return (
    <Collapsible>
      <Card size="sm" className="gap-0 py-0">
        <CollapsibleTrigger nativeButton={false} render={<CardHeader className="group w-full cursor-pointer py-4" />}>
          <div className="flex min-w-0 items-start gap-2">
            <span title={categoryMeta.label} className="mt-0.5 shrink-0">
              <KindIcon className="size-4 text-muted-foreground" />
            </span>
            <CardTitle className="min-w-0">{noticeTitle(r)}</CardTitle>
          </div>
          <CardAction className="flex items-center gap-2">
            {isTodayTimetable && <Badge variant="destructive">Today</Badge>}
            <ChevronDown className="size-4 text-muted-foreground group-data-panel-open:hidden" />
            <ChevronUp className="hidden size-4 text-muted-foreground group-data-panel-open:inline" />
          </CardAction>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-2 pb-4">
            {r.periods?.length ? <PeriodList periods={r.periods} /> : <div className="text-[13.5px] whitespace-pre-line">{r.text}</div>}
            <AttachmentLink url={r.attachment_url} />
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
