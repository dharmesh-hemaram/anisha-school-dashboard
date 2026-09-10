import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { NotebookCategoryData } from "../../revision-notebooks/types";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchRevisionNotebook } from "../../features/revision/revisionSlice";
import { fetchDashboardData } from "../../features/data/dataSlice";
import { cyclesOf } from "../../lib/notices";
import { fmtDate, parseISO } from "../../lib/date";
import { sortMaterialsByTypeThenDate } from "../../lib/materials";
import { MATERIAL_GROUPS } from "../../lib/constants";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { Accordion } from "../../components/ui/accordion";
import { Input } from "../../components/ui/input";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Badge } from "../../components/ui/badge";
import EmptyState from "../../components/ui/EmptyState";
import SubjectBadge from "../../components/subjects/SubjectBadge";
import MaterialItem from "../../components/materials/MaterialItem";
import CategorySection from "./CategorySection";
import styles from "./RevisionNotebookPage.module.css";

// Every category's `groups` array shares a `chapter` field regardless of
// its other shape -- filtering only needs that, so this stays untyped
// rather than fighting the discriminated union for a generic that can't
// actually vary per call (there's only ever one `data` at a time).
function filterCategoryData(data: NotebookCategoryData, chapter: string, query: string): NotebookCategoryData {
  const groups = (data.groups as { chapter: string }[]).filter((g) => {
    if (chapter !== "all" && g.chapter !== chapter) return false;
    if (!query) return true;
    return JSON.stringify(g).toLowerCase().includes(query);
  });
  return { ...data, groups } as NotebookCategoryData;
}

export default function RevisionNotebookPage() {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useAppDispatch();
  const entry = useAppSelector((s) => (slug ? s.revision.bySlug[slug] : undefined));
  const [chapter, setChapter] = useState("all");
  const [search, setSearch] = useState("");

  // This route sits outside AppLayout (it's meant to open standalone in its
  // own tab -- see RevisionNotebookLink), so AppLayout's own fetch never
  // runs here; without this, notices/portionSchedules would just stay empty
  // and the exam card below would never appear.
  const dataStatus = useAppSelector((s) => s.data.status);
  const notices = useAppSelector((s) => s.data.notices);
  const portionSchedules = useAppSelector((s) => s.data.portionSchedules);

  useEffect(() => {
    if (slug && !entry) dispatch(fetchRevisionNotebook(slug));
  }, [slug, entry, dispatch]);

  useEffect(() => {
    if (dataStatus === "idle") dispatch(fetchDashboardData());
  }, [dataStatus, dispatch]);

  const notebook = entry?.status === "succeeded" ? entry.notebook : undefined;
  const query = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!notebook) return [];
    return notebook.categories.map((cat) => ({ ...cat, data: filterCategoryData(cat.data, chapter, query) }));
  }, [notebook, chapter, query]);

  // Whichever portion-table row links here (any cycle, any subject) -- e.g.
  // the Half Yearly English row -- so the same worksheets/notes/portion the
  // Exam tab shows for it also surface right at the top of this notebook,
  // for the child studying straight off this page instead of the Exam tab.
  const scheduleRow = useMemo(() => {
    if (!slug) return undefined;
    const url = `revision/${slug}`;
    for (const schedule of Object.values(portionSchedules)) {
      const row = schedule.schedule.find((r) => r.revision_notebook_url === url);
      if (row) return row;
    }
    return undefined;
  }, [portionSchedules, slug]);

  const scheduleCycle = useMemo(() => {
    if (!scheduleRow) return undefined;
    return Object.entries(portionSchedules).find(([, schedule]) => schedule.schedule.includes(scheduleRow))?.[0];
  }, [portionSchedules, scheduleRow]);

  const scheduleMaterials = useMemo(() => {
    if (!scheduleRow || !scheduleCycle) return [];
    return notices.filter(
      (r) => r.category === "Subject Notes" && r.subject === scheduleRow.subject && cyclesOf(r).includes(scheduleCycle),
    );
  }, [notices, scheduleRow, scheduleCycle]);

  const sortedMaterials = sortMaterialsByTypeThenDate(scheduleMaterials);
  const materialGroups = MATERIAL_GROUPS.map((g) => ({
    ...g,
    items: sortedMaterials.filter((m) => m.material_type === g.type),
  })).filter((g) => g.items.length > 0);

  if (!entry || entry.status === "loading") {
    return (
      <div className={`wrap ${styles.page}`}>
        <EmptyState>Loading…</EmptyState>
      </div>
    );
  }

  if (entry.status === "failed" || !notebook) {
    return (
      <div className={`wrap ${styles.page}`}>
        <EmptyState>{entry.error ?? `No revision notebook found for "${slug}".`}</EmptyState>
      </div>
    );
  }

  const anyVisible = filtered.some((cat) => cat.data.groups.length > 0);
  const tocEntries = filtered.filter((cat) => cat.data.groups.length > 0).map((cat) => ({ num: cat.num, title: cat.title }));

  return (
    <div className={`wrap ${styles.page}`}>
      <header className={styles.pageHead}>
        <a className={styles.backLink} href={import.meta.env.BASE_URL}>
          ← Back to Notice Board
        </a>
        {scheduleRow && (
          <div className={styles.materialCard}>
            <Collapsible>
              <Card size="sm" className="gap-0 py-0">
                <CollapsibleTrigger nativeButton={false} render={<CardHeader className="group w-full cursor-pointer py-4" />}>
                  <div className="flex min-w-0 items-start gap-2">
                    <SubjectBadge subject={scheduleRow.subject} />
                    <CardTitle className="min-w-0">{scheduleRow.subject}</CardTitle>
                  </div>
                  <CardAction className="flex items-center gap-2">
                    {scheduleRow.marks ? <Badge variant="secondary">{scheduleRow.marks} marks</Badge> : null}
                    <ChevronDown className="size-4 text-muted-foreground group-data-panel-open:hidden" />
                    <ChevronUp className="hidden size-4 text-muted-foreground group-data-panel-open:inline" />
                  </CardAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="flex flex-col gap-2 pb-4">
                    <div className="text-xs text-muted-foreground">{fmtDate(parseISO(scheduleRow.date_iso))}</div>
                    {scheduleRow.portion && <div className="text-[13.5px] whitespace-pre-line">{scheduleRow.portion}</div>}
                    {sortedMaterials.length === 1 ? (
                      <MaterialItem notices={[sortedMaterials[0]]} title={scheduleRow.subject} />
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
          </div>
        )}
      </header>

      <div className={styles.controls}>
        <ToggleGroup
          className={styles.chapterToggles}
          size="sm"
          value={[chapter]}
          onValueChange={(value) => setChapter(value[0] ?? "all")}
        >
          <ToggleGroupItem value="all">All chapters</ToggleGroupItem>
          {notebook.chapters.map((c) => (
            <ToggleGroupItem key={c.id} value={c.id}>
              {c.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className={styles.searchRow}>
          <Input
            type="search"
            placeholder="Search questions & answers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {!anyVisible ? (
        <EmptyState>Nothing matches that search.</EmptyState>
      ) : (
        <Accordion defaultValue={tocEntries.map((e) => e.num)}>
          {filtered.map(
            (cat) => cat.data.groups.length > 0 && <CategorySection key={cat.num} entry={cat} chapters={notebook.chapters} />,
          )}
        </Accordion>
      )}

      <footer className={styles.pageFooter}>
        {notebook.footerNote.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            <br />
          </span>
        ))}
      </footer>
    </div>
  );
}
