import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { CATEGORY_META, FEED_CATEGORIES } from "../../lib/constants";
import { SUBJECT_META } from "../../lib/subjects";
import { noticeSubjects } from "../../lib/notices";
import { Chip, ChipRow } from "../../components/ui/Chip";
import SubjectChip from "../../components/subjects/SubjectChip";
import EmptyState from "../../components/ui/EmptyState";
import Timeline from "../../components/ui/Timeline";
import FeedItem from "./FeedItem";

export default function FeedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const notices = useAppSelector((s) => s.data.notices);

  const activeCategory = searchParams.get("category") || "All";
  const requestedSubject = searchParams.get("subject") || "All";

  const feedItems = useMemo(() => notices.filter((r) => FEED_CATEGORIES.includes(r.category)), [notices]);
  const byCategory = activeCategory === "All" ? feedItems : feedItems.filter((r) => r.category === activeCategory);

  // Only the exam-track subjects (SUBJECT_META) are worth filtering by --
  // co-curricular subjects would clutter the row, and categories like
  // Holiday/School Event/General never carry a subject at all, so the row
  // just disappears for those instead of showing an unusable "All" alone.
  const allSubjects = useMemo(() => {
    const s = new Set<string>();
    byCategory.forEach((r) => noticeSubjects(r).forEach((subj) => { if (SUBJECT_META[subj]) s.add(subj); }));
    return [...s].sort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byCategory]);

  const activeSubject = allSubjects.length === 0 ? "All" : requestedSubject;
  const filtered = activeSubject === "All" ? byCategory : byCategory.filter((r) => noticeSubjects(r).has(activeSubject));

  const setCategory = (c: string) =>
    setSearchParams((p) => {
      const next = new URLSearchParams(p);
      if (c === "All") next.delete("category");
      else next.set("category", c);
      return next;
    });
  const setSubject = (s: string) =>
    setSearchParams((p) => {
      const next = new URLSearchParams(p);
      if (s === "All") next.delete("subject");
      else next.set("subject", s);
      return next;
    });

  return (
    <>
      <ChipRow>
        <Chip active={activeCategory === "All"} onClick={() => setCategory("All")}>
          All
        </Chip>
        {FEED_CATEGORIES.map((c) => (
          <Chip key={c} active={c === activeCategory} onClick={() => setCategory(c)}>
            {CATEGORY_META[c].label}
          </Chip>
        ))}
      </ChipRow>

      {allSubjects.length > 0 && (
        <ChipRow>
          <Chip active={activeSubject === "All"} onClick={() => setSubject("All")}>
            All
          </Chip>
          {allSubjects.map((s) => (
            <SubjectChip key={s} subject={s} active={s === activeSubject} onClick={() => setSubject(s)} />
          ))}
        </ChipRow>
      )}

      {filtered.length === 0 ? (
        <EmptyState>No notices match this filter.</EmptyState>
      ) : (
        <Timeline items={filtered} dateIso={(r) => r.posted_date_iso}>
          {(r) => <FeedItem key={r.id} notice={r} />}
        </Timeline>
      )}
    </>
  );
}
