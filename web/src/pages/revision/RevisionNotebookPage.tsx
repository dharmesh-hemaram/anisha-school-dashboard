import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { NotebookCategoryData } from "../../revision-notebooks/types";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchRevisionNotebook } from "../../features/revision/revisionSlice";
import { Chip, ChipRow } from "../../components/ui/Chip";
import EmptyState from "../../components/ui/EmptyState";
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

  useEffect(() => {
    if (slug && !entry) dispatch(fetchRevisionNotebook(slug));
  }, [slug, entry, dispatch]);

  const notebook = entry?.status === "succeeded" ? entry.notebook : undefined;
  const query = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!notebook) return [];
    return notebook.categories.map((cat) => ({ ...cat, data: filterCategoryData(cat.data, chapter, query) }));
  }, [notebook, chapter, query]);

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

  return (
    <div className={`wrap ${styles.page}`}>
      <header className={styles.pageHead}>
        <a className={styles.backLink} href={import.meta.env.BASE_URL}>
          ← Back to Notice Board
        </a>
        <div className={styles.pageTitle}>
          <span className={styles.subjectBadge}>{notebook.subjectBadge}</span>
          {notebook.title}
        </div>
        <p className={styles.pageSub}>{notebook.subtitle}</p>
        <p className={styles.pageMeta}>{notebook.examMeta}</p>
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
          <sup className={styles.srcRev}>*</sup>also asked in a Revision sheet &nbsp;&nbsp;
          <sup className={styles.srcWs}>#</sup>also asked in a school Worksheet
        </p>
      </div>

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
