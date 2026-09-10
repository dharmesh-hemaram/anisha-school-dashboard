import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { fmtDate, parseDMY, parseISO } from "../../lib/date";
import { cyclesOf, isYearlyCycle } from "../../lib/notices";
import { findScheduleRow, groupMaterialsByTitle } from "../../lib/materials";
import { subjectAbbr } from "../../lib/subjects";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import EmptyState from "../../components/ui/EmptyState";
import MaterialItem from "../../components/materials/MaterialItem";
import RevisionNotebookLink from "../../components/materials/RevisionNotebookLink";

// Notes tab's own grouping: three tabs, not four -- an unpaired Answer Key
// (a paired one's link already rides along on its Worksheet's row, so it
// never reaches here) is the same family of material as a Worksheet, so it
// folds into that tab rather than getting a tab of its own.
const NOTES_GROUPS = [
  { value: "Notes", label: "Notes", types: ["Notes"] },
  { value: "Revision", label: "Revision", types: ["Revision"] },
  { value: "Worksheet", label: "Worksheets", types: ["Worksheet", "Answer Key"] },
] as const;

export default function NotesPage() {
  const navigate = useNavigate();
  const { subject: subjectParam } = useParams<{ subject?: string }>();
  const notices = useAppSelector((s) => s.data.notices);
  const portionSchedules = useAppSelector((s) => s.data.portionSchedules);
  const [cycleFilter, setCycleFilter] = useState("All");

  const subjects = [...new Set(notices.filter((r) => r.category === "Subject Notes" && r.subject).map((r) => r.subject as string))].sort();
  // Computer Science sorts first alphabetically, but reads better tucked at
  // the end of the row than leading the exam-track subjects.
  const orderedSubjects = subjects.includes("Computer Science")
    ? [...subjects.filter((s) => s !== "Computer Science"), "Computer Science"]
    : subjects;

  const decodedParam = subjectParam ? decodeURIComponent(subjectParam) : undefined;
  // The dashboard's very first load defaults to English -- keep that as the
  // zero-click default rather than picking "whichever subject sorts first".
  const activeSubject = decodedParam ?? (subjects.includes("English") ? "English" : undefined);

  // A paired Answer Key's link already rides along on its Worksheet's row
  // (materialHref), so it doesn't get a row of its own here.
  const items = activeSubject
    ? notices.filter((r) => r.category === "Subject Notes" && r.subject === activeSubject && !(r.material_type === "Answer Key" && r.paired))
    : [];

  // Every cycle this subject has any material for -- the filter's own
  // option list, so it never depends on (and can always recover from)
  // whatever the filter is currently narrowed to.
  const cycles = [...new Set(items.flatMap(cyclesOf))];
  const effectiveCycle = cycles.includes(cycleFilter) ? cycleFilter : "All";
  const cycleItems = effectiveCycle === "All" ? items : items.filter((r) => cyclesOf(r).includes(effectiveCycle));

  // Which type-tabs exist at all for this subject -- fixed regardless of
  // the cycle filter, so narrowing to a cycle with no Revision, say, dims
  // that tab's content instead of yanking the tab out from under you.
  const typeGroups = NOTES_GROUPS.filter((g) => items.some((r) => r.material_type && (g.types as readonly string[]).includes(r.material_type)));

  // The exam schedule's per-subject slot -- date, marks, topics, and the
  // yearly-only revision notebook -- only makes sense once a specific
  // (non-"All") cycle is picked, same info the old Exam tab's subject card
  // showed, just scoped to whichever subject you're already looking at.
  const scheduleRow = effectiveCycle !== "All" && activeSubject ? findScheduleRow(portionSchedules, effectiveCycle, activeSubject) : undefined;
  const portionNotice =
    effectiveCycle !== "All" ? notices.find((r) => r.category === "Exam/Test" && r.material_type === "Portion" && r.exam_cycle === effectiveCycle) : undefined;

  return (
    <>
      <ToggleGroup size="sm" value={activeSubject ? [activeSubject] : []} onValueChange={(v) => v[0] && navigate(`/notes/${encodeURIComponent(v[0])}`)}>
        {orderedSubjects.map((s) => (
          <ToggleGroupItem key={s} value={s} title={s}>
            <span className="md:hidden">{subjectAbbr(s)}</span>
            <span className="hidden md:inline">{s}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {!activeSubject ? (
        <EmptyState>Pick a subject above to browse its notes.</EmptyState>
      ) : (
        <>
          {cycles.length > 0 && (
            <ToggleGroup size="sm" value={[effectiveCycle]} onValueChange={(v) => setCycleFilter(v[0] ?? "All")}>
              <ToggleGroupItem value="All">All</ToggleGroupItem>
              {cycles.map((c) => (
                <ToggleGroupItem key={c} value={c}>
                  {c}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}

          {scheduleRow && (
            <Card size="sm" className="max-w-md gap-2">
              <CardHeader>
                <CardTitle>
                  Exam Portion <span className="text-muted-foreground">· {fmtDate(parseISO(scheduleRow.date_iso))}</span>
                </CardTitle>
                {scheduleRow.portion && <CardDescription>{scheduleRow.portion}</CardDescription>}
                {scheduleRow.marks ? (
                  <CardAction>
                    <Badge variant="secondary">{scheduleRow.marks} marks</Badge>
                  </CardAction>
                ) : null}
              </CardHeader>
              {(portionNotice?.attachment_url || (isYearlyCycle(effectiveCycle) && scheduleRow.revision_notebook_url)) && (
                <CardFooter className="flex-wrap items-center gap-2">
                  {isYearlyCycle(effectiveCycle) && <RevisionNotebookLink url={scheduleRow.revision_notebook_url} />}
                  {portionNotice?.attachment_url && (
                    <Button
                      variant="outline"
                      size="xs"
                      className="ml-auto"
                      nativeButton={false}
                      render={<a href={portionNotice.attachment_url} target="_blank" rel="noopener noreferrer" />}
                    >
                      View portion
                    </Button>
                  )}
                </CardFooter>
              )}
            </Card>
          )}

          {typeGroups.length === 0 ? (
            <EmptyState>Nothing here yet.</EmptyState>
          ) : (
            <Tabs key={activeSubject} defaultValue={typeGroups[0].value} className="w-full">
              <TabsList variant="line">
                {typeGroups.map((g) => (
                  <TabsTrigger key={g.value} value={g.value}>
                    {g.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {typeGroups.map((g) => {
                const rows = groupMaterialsByTitle(
                  cycleItems
                    .filter((r) => r.material_type && (g.types as readonly string[]).includes(r.material_type))
                    .sort((a, b) => parseDMY(b.posted_date).getTime() - parseDMY(a.posted_date).getTime()),
                );
                return (
                  <TabsContent key={g.value} value={g.value} className="flex flex-col gap-2">
                    {rows.length === 0 ? (
                      <EmptyState>{`Nothing tagged to ${effectiveCycle} yet.`}</EmptyState>
                    ) : (
                      rows.map((row) => <MaterialItem key={row[0].id} notices={row} cycles={[...new Set(row.flatMap(cyclesOf))]} />)
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </>
      )}
    </>
  );
}
