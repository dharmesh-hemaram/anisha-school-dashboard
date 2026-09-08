import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { cyclesOf, firstLine, sortedExamCycles } from "../../lib/notices";
import { parseISO } from "../../lib/date";
import { Chip, ChipRow } from "../../components/ui/Chip";
import EmptyState from "../../components/ui/EmptyState";
import MaterialGroupCard from "../../components/materials/MaterialGroupCard";
import styles from "./ExamPage.module.css";

export default function ExamPage() {
  const navigate = useNavigate();
  const { cycle: cycleParam } = useParams<{ cycle?: string }>();
  const notices = useAppSelector((s) => s.data.notices);
  const portionSchedules = useAppSelector((s) => s.data.portionSchedules);

  const cycles = useMemo(() => sortedExamCycles(notices), [notices]);
  // Default to the most recently active cycle -- almost always "the exam
  // that's coming up" -- so prep material shows up with zero clicks.
  const decodedParam = cycleParam ? decodeURIComponent(cycleParam) : undefined;
  const activeCycle = decodedParam && cycles.includes(decodedParam) ? decodedParam : (cycles[0] ?? null);

  const items = useMemo(() => (activeCycle ? notices.filter((r) => cyclesOf(r).includes(activeCycle)) : []), [notices, activeCycle]);
  const portion = items.find((r) => r.category === "Exam/Test" && r.material_type === "Portion");
  const portionData = activeCycle ? portionSchedules[activeCycle] : undefined;
  const materials = items.filter((r) => r.category === "Subject Notes" && r.subject);

  const bySubject = new Map<string, typeof materials>();
  materials.forEach((r) => {
    if (!r.subject) return;
    if (!bySubject.has(r.subject)) bySubject.set(r.subject, []);
    bySubject.get(r.subject)!.push(r);
  });

  const holidays = notices.filter((r) => r.category === "Holiday");
  const scheduleSubjects = new Set((portionData?.schedule ?? []).map((row) => row.subject));

  return (
    <>
      <div className="sectionNote">Everything for one exam — schedule, portion &amp; notes — in one place</div>
      <ChipRow wrap>
        {cycles.map((c) => (
          <Chip key={c} size="grid" active={c === activeCycle} onClick={() => navigate(`/exam/${encodeURIComponent(c)}`)}>
            {c}
          </Chip>
        ))}
      </ChipRow>

      {!activeCycle ? (
        <EmptyState>No exam cycles found yet.</EmptyState>
      ) : (
        <>
          {portion && (
            <div className={styles.portionCard}>
              <div className={styles.portionLabel}>Exam Portion</div>
              <div className={styles.portionTitle}>{firstLine(portion.text)}</div>
              {(portionData?.timing || portionData?.max_marks) && (
                <div className={styles.portionMeta}>
                  {[portionData?.timing && `Timing: ${portionData.timing}`, portionData?.max_marks && `Max marks: ${portionData.max_marks}`]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              )}
              {portion.attachment_url && (
                <a className={styles.portionLink} href={portion.attachment_url} target="_blank" rel="noopener noreferrer">
                  View portion →
                </a>
              )}
            </div>
          )}

          {!portion && !portionData?.schedule?.length && bySubject.size === 0 && (
            <EmptyState>Nothing tagged to this exam yet.</EmptyState>
          )}

          {portionData?.schedule?.length ? (
            <>
              {portionData.schedule.map((row, i) => {
                const next = portionData.schedule[i + 1];
                const gap = next ? Math.round((parseISO(next.date_iso).getTime() - parseISO(row.date_iso).getTime()) / 86400000) - 1 : 0;
                const holiday = next ? holidays.find((h) => h.event_date_iso > row.date_iso && h.event_date_iso < next.date_iso) : undefined;
                return (
                  <div key={`${row.subject}-${row.date_iso}`}>
                    <MaterialGroupCard subject={row.subject} items={bySubject.get(row.subject) ?? []} scheduleRow={row} />
                    {next && gap >= 2 && (
                      <div className={styles.gapRow}>
                        {holiday ? `Holiday — ${firstLine(holiday.text)}` : `${gap}-day gap`} · buffer time before the next test
                      </div>
                    )}
                  </div>
                );
              })}

              {portionData.notes?.length ? (
                <div className={styles.notes}>
                  <ul>
                    {portionData.notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* A subject with prep material but no slot in the portion table (rare) still gets a card so nothing's lost. */}
              {[...bySubject.keys()]
                .filter((s) => !scheduleSubjects.has(s))
                .sort()
                .map((subject) => (
                  <MaterialGroupCard key={subject} subject={subject} items={bySubject.get(subject)!} />
                ))}
            </>
          ) : (
            [...bySubject.keys()]
              .sort()
              .map((subject) => <MaterialGroupCard key={subject} subject={subject} items={bySubject.get(subject)!} />)
          )}
        </>
      )}
    </>
  );
}
