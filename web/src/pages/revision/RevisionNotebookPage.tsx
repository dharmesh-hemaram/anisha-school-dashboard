import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { NotebookCategoryData } from "../../revision-notebooks/types";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchRevisionNotebook } from "../../features/revision/revisionSlice";
import { fetchDashboardData } from "../../features/data/dataSlice";
import { cyclesOf } from "../../lib/notices";
import { Chip, ChipRow } from "../../components/ui/Chip";
import EmptyState from "../../components/ui/EmptyState";
import SubjectBadge from "../../components/subjects/SubjectBadge";
import MaterialGroupCard from "../../components/materials/MaterialGroupCard";
import CategorySection from "./CategorySection";
import TableOfContents from "./TableOfContents";
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
        <div className={styles.pageTitle}>
          <SubjectBadge subject={notebook.subjectBadge} />
          {notebook.title}
        </div>
        <p className={styles.pageSub}>{notebook.subtitle}</p>
        <p className={styles.pageMeta}>{notebook.examMeta}</p>
        {scheduleRow && (
          <div className={styles.materialCard}>
            {/* Drop revision_notebook_url here only -- showing a "Revision Notebook
                →" link back to this exact page, on this exact page, is a dead loop. */}
            <MaterialGroupCard
              subject={scheduleRow.subject}
              items={scheduleMaterials}
              scheduleRow={{ ...scheduleRow, revision_notebook_url: undefined }}
              collapsible
            />
          </div>
        )}
      </header>

      <div className={styles.controls}>
        <ChipRow>
          <Chip active={chapter === "all"} onClick={() => setChapter("all")}>
            All chapters
          </Chip>
          {notebook.chapters.map((c) => (
            <Chip key={c.id} active={chapter === c.id} onClick={() => setChapter(c.id)}>
              {c.label}
            </Chip>
          ))}
        </ChipRow>
        <div className={styles.searchRow}>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Search questions & answers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <p className={styles.legend}>
          <sup className={styles.srcNotes}>✎</sup>her notebook &nbsp;&nbsp;
          <sup className={styles.srcTb}>★</sup>textbook &nbsp;&nbsp;
          <sup className={styles.srcWs}>☑</sup>worksheet &nbsp;&nbsp;
          <sup className={styles.srcRev}>↻</sup>revision sheet
        </p>
      </div>

      <TableOfContents categories={tocEntries} />

      {!anyVisible ? (
        <EmptyState>Nothing matches that search.</EmptyState>
      ) : (
        filtered.map(
          (cat) => cat.data.groups.length > 0 && <CategorySection key={cat.num} entry={cat} chapters={notebook.chapters} />,
        )
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
