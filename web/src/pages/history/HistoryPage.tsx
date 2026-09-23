import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import type { Category } from "../../types";
import { ALL_CATEGORIES, CATEGORY_META } from "../../lib/constants";
import { SUBJECT_META, subjectAbbr } from "../../lib/subjects";
import { noticeSubjects } from "../../lib/notices";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import EmptyState from "../../components/ui/EmptyState";
import Timeline from "../../components/ui/Timeline";
import HistoryItem from "./HistoryItem";

export default function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const notices = useAppSelector((s) => s.data.notices);

  const activeCategory = searchParams.get("category") || "All";
  const requestedSubject = searchParams.get("subject") || "All";

  const byCategory = activeCategory === "All" ? notices : notices.filter((r) => r.category === activeCategory);

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

  const ActiveCategoryIcon = activeCategory === "All" ? null : CATEGORY_META[activeCategory as Category].icon;

  return (
    <>
      {/* A row of toggle buttons -- one per category plus "All" -- doesn't
          fit a phone-width screen; a dropdown always fits regardless of how
          many categories there are. */}
      <Select value={activeCategory} onValueChange={(v) => setCategory((v as string) ?? "All")}>
        <SelectTrigger size="sm" className="w-full sm:w-auto">
          <SelectValue>
            {() => (
              <span className="flex items-center gap-1.5">
                {ActiveCategoryIcon && <ActiveCategoryIcon className="size-3.5" />}
                {activeCategory === "All" ? "All" : CATEGORY_META[activeCategory as Category].label}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All</SelectItem>
          {ALL_CATEGORIES.map((c) => {
            const Icon = CATEGORY_META[c].icon;
            return (
              <SelectItem key={c} value={c}>
                <Icon className="size-4" />
                {CATEGORY_META[c].label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {allSubjects.length > 0 && (
        // Same row of toggle buttons, but the subject list is open-ended
        // (any exam-track subject that shows up in this category) rather
        // than a short fixed set -- a dropdown would hide how many there
        // are, so this stays a toggle row and instead scrolls horizontally,
        // bleeding out to the screen edges the same way the page's own
        // padding does, instead of overflowing off it.
        <div className="-mx-4 overflow-x-auto px-4 md:-mx-6 md:px-6">
          <ToggleGroup size="sm" value={[activeSubject]} onValueChange={(v) => setSubject(v[0] ?? "All")} className="w-max">
            <ToggleGroupItem value="All">All</ToggleGroupItem>
            {allSubjects.map((s) => (
              <ToggleGroupItem key={s} value={s} title={s}>
                {subjectAbbr(s)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState>No notices match this filter.</EmptyState>
      ) : (
        <Timeline items={filtered} dateIso={(r) => r.posted_date_iso}>
          {(r) => <HistoryItem key={r.id} notice={r} />}
        </Timeline>
      )}
    </>
  );
}
