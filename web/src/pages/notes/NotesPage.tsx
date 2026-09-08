import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { parseDMY } from "../../lib/date";
import { cyclesOf } from "../../lib/notices";
import { MATERIAL_GROUPS } from "../../lib/constants";
import { ChipRow } from "../../components/ui/Chip";
import SubjectChip from "../../components/subjects/SubjectChip";
import EmptyState from "../../components/ui/EmptyState";
import MaterialList from "../../components/materials/MaterialList";
import Count from "../../components/ui/Count";
import styles from "./NotesPage.module.css";

export default function NotesPage() {
  const navigate = useNavigate();
  const { subject: subjectParam } = useParams<{ subject?: string }>();
  const notices = useAppSelector((s) => s.data.notices);

  const subjects = useMemo(
    () => [...new Set(notices.filter((r) => r.category === "Subject Notes" && r.subject).map((r) => r.subject as string))].sort(),
    [notices],
  );

  const decodedParam = subjectParam ? decodeURIComponent(subjectParam) : undefined;
  // The dashboard's very first load defaults to English -- keep that as the
  // zero-click default rather than picking "whichever subject sorts first".
  const activeSubject = decodedParam ?? (subjects.includes("English") ? "English" : undefined);

  // A paired Answer Key's link already rides along on its Worksheet's row
  // (materialHref), so it doesn't get a row of its own here.
  const items = activeSubject
    ? notices.filter((r) => r.category === "Subject Notes" && r.subject === activeSubject && !(r.material_type === "Answer Key" && r.paired))
    : [];

  // Exam cycle is the outer grouping -- which exam you're prepping for is
  // the first thing you filter by -- material type nested inside each
  // cycle (revision numbering resets per exam, so PT-1's "Revision 1" and
  // Half Yearly's aren't the same thing, and need their own card to stay
  // clear). A chapter genuinely relevant to more than one cycle shows up
  // under every one of them rather than picking just one.
  const itemCycles = (r: (typeof items)[number]) => {
    const c = cyclesOf(r);
    return c.length ? c : ["Other"];
  };
  const cycles = [...new Set(items.flatMap(itemCycles))];
  cycles.sort((a, b) => {
    const latest = (c: string) => Math.max(...items.filter((r) => itemCycles(r).includes(c)).map((r) => parseDMY(r.posted_date).getTime()));
    return latest(b) - latest(a);
  });

  return (
    <>
      <div className="sectionNote">Select a subject to see all notes, chapter-wise</div>
      <ChipRow wrap>
        {subjects.map((s) => (
          <SubjectChip key={s} subject={s} size="grid" active={s === activeSubject} onClick={() => navigate(`/notes/${encodeURIComponent(s)}`)} />
        ))}
      </ChipRow>

      {!activeSubject ? (
        <EmptyState>Pick a subject above to browse its notes.</EmptyState>
      ) : items.length === 0 ? (
        <EmptyState>Nothing here yet.</EmptyState>
      ) : (
        cycles.map((cycle) => {
          const cycleItems = items
            .filter((r) => itemCycles(r).includes(cycle))
            .sort((a, b) => parseDMY(b.posted_date).getTime() - parseDMY(a.posted_date).getTime());
          return (
            <div key={cycle}>
              <div className={styles.cycleHead}>{cycle}</div>
              <div className={styles.card}>
                {MATERIAL_GROUPS.map(({ type, label }) => {
                  const typeItems = cycleItems.filter((r) => r.material_type === type);
                  if (typeItems.length === 0) return null;
                  return (
                    <div key={type}>
                      <div className={styles.typeHead}>
                        {label}
                        <Count n={typeItems.length} />
                      </div>
                      <MaterialList items={typeItems} showTag={false} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
