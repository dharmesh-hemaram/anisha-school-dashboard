import { ChevronDown, ChevronUp } from "lucide-react";
import type { UpcomingItem } from "../../types";
import { useAppSelector } from "../../app/hooks";
import { CATEGORY_META, MATERIAL_GROUPS } from "../../lib/constants";
import { isYearlyCycle, noticeTitle } from "../../lib/notices";
import { relatedMaterialsFor } from "../../lib/upcoming";
import { findScheduleRow, sortMaterialsByTypeThenDate } from "../../lib/materials";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/badge";
import AttachmentLink from "../../components/ui/AttachmentLink";
import MaterialItem from "../../components/materials/MaterialItem";
import RevisionNotebookLink from "../../components/materials/RevisionNotebookLink";
import styles from "./ActionCard.module.css";

export default function ActionCard({ item }: { item: UpcomingItem }) {
  const notices = useAppSelector((s) => s.data.notices);
  const portionSchedules = useAppSelector((s) => s.data.portionSchedules);

  const state = item._days < 0 ? "past" : item._days === 0 ? "today" : item._days <= 3 ? "soon" : "future";
  const stateClass = state === "past" ? styles.statePast : "";
  const badgeText = state === "today" ? "Today" : state === "past" ? `${-item._days}d ago` : item._days === 1 ? "Tomorrow" : `In ${item._days}d`;
  // School ends at 2:30pm -- once the day's actually over, today's own card
  // isn't the thing to jump into anymore, so the "current focus" (the red
  // badge, the card that auto-expands) shifts to tomorrow's instead.
  const now = new Date();
  const afterSchoolCutoff = now.getHours() > 14 || (now.getHours() === 14 && now.getMinutes() >= 30);
  const isFocusDay = afterSchoolCutoff ? item._days === 1 : item._days === 0;
  const badgeVariant = isFocusDay ? "destructive" : state === "past" || state === "today" ? "secondary" : item._days === 1 ? "outline" : "ghost";

  const categoryMeta = CATEGORY_META[item.category];
  const kind = categoryMeta.label;
  const KindIcon = categoryMeta.icon;
  // A real "class test" notice isn't itself the formal Half Yearly/PT-1 exam
  // -- exam_cycle is just an internal grouping heuristic (nearest
  // named-cycle anchor in time) used to pull in the right prep material, not
  // something that should read as "this test IS that exam". Only the
  // portion-table-derived entries genuinely are that exam.
  const isExamEntry = "isSynthetic" in item && item.isSynthetic;
  const cycleSuffix = isExamEntry && item.exam_cycle ? ` · ${item.exam_cycle}` : "";

  const relatedMaterials = sortMaterialsByTypeThenDate(relatedMaterialsFor(notices, item));
  const materialGroups = MATERIAL_GROUPS.map((g) => ({
    ...g,
    items: relatedMaterials.filter((m) => m.material_type === g.type),
  })).filter((g) => g.items.length > 0);
  // exam_cycle is only ever a plain string on an Exam/Test record (the only
  // category Upcoming's exam cards render) -- the array shape belongs to
  // Subject Notes records, never these, but the union type still allows it.
  const cycle = typeof item.exam_cycle === "string" ? item.exam_cycle : undefined;
  const scheduleRow = findScheduleRow(portionSchedules, cycle, item.subject);

  return (
    <Collapsible defaultOpen={isFocusDay}>
      <Card size="sm" className={`${stateClass} gap-0 py-0`}>
        <CollapsibleTrigger nativeButton={false} render={<CardHeader className="group w-full cursor-pointer py-4" />}>
          <div className="flex min-w-0 items-start gap-2">
            <span title={`${kind}${cycleSuffix}`} className="mt-0.5 shrink-0">
              <KindIcon className="size-4 text-muted-foreground" />
            </span>
            <CardTitle className="min-w-0">{noticeTitle(item)}</CardTitle>
          </div>
          <CardAction className="flex items-center gap-2">
            <Badge variant={badgeVariant}>{badgeText}</Badge>
            <ChevronDown className="size-4 text-muted-foreground group-data-panel-open:hidden" />
            <ChevronUp className="hidden size-4 text-muted-foreground group-data-panel-open:inline" />
          </CardAction>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-2 pb-4">
            <div className={styles.full}>{item.text}</div>
            <RevisionNotebookLink url={isExamEntry && isYearlyCycle(cycle) ? scheduleRow?.revision_notebook_url : undefined} />
            <AttachmentLink url={item.attachment_url} />
            {relatedMaterials.length > 0 && <Separator />}
            {relatedMaterials.length === 1 ? (
              <MaterialItem notices={[relatedMaterials[0]]} title={item.subject ?? undefined} />
            ) : (
              materialGroups.length > 0 && (
                <Tabs defaultValue={materialGroups[0].type} className="w-full">
                  <TabsList variant="line">
                    {materialGroups.map((g) => (
                      <TabsTrigger key={g.type} value={g.type}>
                        {g.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {materialGroups.map((g) => (
                    <TabsContent key={g.type} value={g.type} className="flex flex-col gap-2">
                      {g.items.map((m) => (
                        <MaterialItem key={m.id} notices={[m]} />
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              )
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
