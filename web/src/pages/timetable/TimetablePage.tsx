import { useEffect, useMemo, useState } from "react";
import { cn } from "cn";
import { PartyPopper, Shirt, Volleyball } from "lucide-react";
import { useAppSelector } from "../../app/hooks";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { Badge } from "../../components/ui/badge";
import SubjectBadge from "../../components/subjects/SubjectBadge";
import EmptyState from "../../components/ui/EmptyState";
import { SUBJECT_META } from "../../lib/subjects";
import { fmtDate } from "../../lib/date";
import { DAY_ORDER, DRESS_CODE, currentRow, getActiveDay, isSchoolSaturday } from "../../lib/timetable";

const DRESS_CODE_ICON = { Uniform: Shirt, Sports: Volleyball } as const;

// A break row reads as "not a class" the same way the rest of this app
// already marks anything inactive -- Button and Toggle both use
// disabled:opacity-50 -- rather than a pattern of its own.
const BREAK_DIMMED = "opacity-50";

function LiveBadge() {
  return (
    <Badge variant="destructive">
      <span className="relative flex size-1.5" aria-hidden="true">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-destructive" />
      </span>
      Live
    </Badge>
  );
}

export default function TimetablePage() {
  const timetable = useAppSelector((s) => s.data.timetable);

  // Re-render once a minute so the current-period highlight tracks the clock without a reload.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const active = useMemo(() => (timetable ? getActiveDay(timetable.days, now) : null), [timetable, now]);
  const liveRow = active?.isLiveToday && timetable ? currentRow(timetable.periods, now) : null;

  // Whichever Saturday is current or coming up this week -- the 2nd/4th-
  // Saturday rule that decides whether it's a school day at all.
  const thisWeekSaturday = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() + (6 - d.getDay()));
    return d;
  }, [now]);
  const saturdayIsHoliday = !isSchoolSaturday(thisWeekSaturday);

  // Mobile's single-day view defaults to the active day but can be browsed
  // independently of it (tapping Friday to check Friday's dress code doesn't
  // move "today").
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  if (!timetable) {
    return <EmptyState>Timetable not available yet.</EmptyState>;
  }

  const orderedDays = [...timetable.days].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
  const mobileDay = selectedDay && orderedDays.includes(selectedDay) ? selectedDay : (active?.day ?? orderedDays[0]);
  const MobileDressIcon = DRESS_CODE_ICON[DRESS_CODE[mobileDay]];

  // Every subject the abbreviations on the table can possibly show, so a
  // reader can look up what "LDR" or "S&D" means without hovering each
  // badge for its tooltip. Split into exam-track subjects (their own color)
  // and co-curricular ones (share the plain outline badge) -- grouping like
  // with like reads faster than one long alphabetical list.
  const allSubjects = [
    ...new Set(timetable.periods.flatMap((p) => Object.values(p.subjects ?? {}).filter((s): s is string => !!s))),
  ].sort();
  const mainSubjects = allSubjects.filter((s) => SUBJECT_META[s]);
  const otherSubjects = allSubjects.filter((s) => !SUBJECT_META[s]);

  return (
    <>
      <div className="text-sm text-muted-foreground">
        Weekly class schedule — Class III F <span className="text-muted-foreground/70">· Today, {fmtDate(now)}</span>
      </div>

      {/* Narrow viewport: horizontal space for six day-columns is scarce but
          vertical space isn't -- a single day's periods stack top to bottom
          instead of forcing a sideways-scrolling grid. */}
      <div className="flex flex-col gap-3 md:hidden">
        {/* The selected pill (dark fill, from ToggleGroup) and "today/next
            school day" (a dot, added here) are two different things -- e.g.
            selecting Friday to peek at its dress code shouldn't look like
            Friday is what's coming up next. The dot stays on its pill
            regardless of which one is selected. */}
        <ToggleGroup size="sm" value={[mobileDay]} onValueChange={(v) => v[0] && setSelectedDay(v[0])}>
          {orderedDays.map((d) => (
            <ToggleGroupItem key={d} value={d} className="relative">
              {d.slice(0, 3).toUpperCase()}
              {d === active?.day && (
                <span
                  className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-primary"
                  aria-hidden="true"
                  title={active.isLiveToday ? "Today" : "Next school day"}
                />
              )}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {mobileDay === "Saturday" && saturdayIsHoliday ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <PartyPopper className="size-3.5" aria-hidden="true" />
            Holiday — 1st/3rd/5th Saturday, no school
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MobileDressIcon className="size-3.5" aria-hidden="true" />
            {DRESS_CODE[mobileDay]}
            {mobileDay === active?.day && (
              <span className="text-primary">
                · {active.isLiveToday ? "Today" : "Next"}, {fmtDate(active.date)}
              </span>
            )}
          </div>
        )}

        <div className={cn("flex flex-col gap-1.5", mobileDay === "Saturday" && saturdayIsHoliday && BREAK_DIMMED)}>
          {timetable.periods.map((p, i) => {
            const isCurrent = mobileDay === active?.day && liveRow === p;
            if (p.period === null) {
              return (
                <div
                  key={`m-break-${i}`}
                  className={cn(
                    "flex items-baseline gap-2 rounded-lg px-3 py-2 text-xs italic text-muted-foreground",
                    isCurrent ? "bg-primary/15" : BREAK_DIMMED,
                  )}
                >
                  <span className="not-italic whitespace-nowrap">{p.time}</span>
                  <span>{p.break}</span>
                  {isCurrent && <LiveBadge />}
                </div>
              );
            }
            const subject = p.subjects?.[mobileDay];
            return (
              <div
                key={`m-${p.period}`}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2",
                  isCurrent && "border-primary/40 bg-primary/10",
                )}
              >
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {p.time}
                  {isCurrent && <LiveBadge />}
                </span>
                {subject ? <SubjectBadge subject={subject} /> : <span className="text-xs text-muted-foreground">—</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Wide viewport: the whole week fits at once without a day switcher. */}
      <div className="hidden overflow-x-auto rounded-xl ring-1 ring-foreground/10 md:block">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left text-xs font-medium text-muted-foreground">Period</th>
              {orderedDays.map((d) => {
                const isOffSaturday = d === "Saturday" && saturdayIsHoliday;
                const DressIcon = DRESS_CODE_ICON[DRESS_CODE[d]];
                return (
                  <th
                    key={d}
                    className={cn(
                      "px-3 py-2 text-center font-medium",
                      d === active?.day && "bg-primary/10 text-primary",
                      isOffSaturday && BREAK_DIMMED,
                    )}
                    title={isOffSaturday ? "Holiday — 1st/3rd/5th Saturday, no school" : undefined}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {isOffSaturday ? (
                        <PartyPopper className="size-3.5" aria-hidden="true" />
                      ) : (
                        <DressIcon className="size-3.5" aria-hidden="true" />
                      )}
                      <span>{d.slice(0, 3).toUpperCase()}</span>
                    </div>
                    <span className="sr-only">{isOffSaturday ? "Holiday" : DRESS_CODE[d]}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {timetable.periods.map((p, i) => {
              const isCurrent = liveRow === p;
              if (p.period === null) {
                return (
                  <tr key={`break-${i}`} className="border-t border-border">
                    {/* This column is `position: sticky` and needs an opaque backdrop
                        of its own regardless (or the day-columns scrolled underneath
                        would show through it), so the dimming goes on an inner wrapper
                        instead of the cell itself -- opacity on the <td> would fade its
                        bg-card backdrop along with the text, undoing that opacity. */}
                    <td
                      className={cn(
                        "sticky left-0 z-10 px-3 py-1.5 text-xs whitespace-nowrap text-muted-foreground",
                        isCurrent ? "bg-primary/15" : "bg-card",
                      )}
                    >
                      <div className={cn("flex items-center gap-1.5", !isCurrent && BREAK_DIMMED)}>
                        {p.time}
                        {isCurrent && <LiveBadge />}
                      </div>
                    </td>
                    <td
                      colSpan={orderedDays.length}
                      className={cn(
                        "px-3 py-1.5 text-center text-xs italic text-muted-foreground",
                        isCurrent ? "bg-primary/15" : BREAK_DIMMED,
                      )}
                    >
                      {p.break}
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={p.period} className={cn("border-t border-border", isCurrent && "bg-primary/5")}>
                  <td className="sticky left-0 z-10 bg-card px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      {p.time}
                      {isCurrent && <LiveBadge />}
                    </div>
                  </td>
                  {orderedDays.map((d) => {
                    const subject = p.subjects?.[d];
                    const isActiveCell = d === active?.day;
                    return (
                      <td
                        key={d}
                        className={cn(
                          "px-3 py-2 text-center",
                          isActiveCell && "bg-primary/5",
                          isCurrent && isActiveCell && "bg-primary/20",
                          d === "Saturday" && saturdayIsHoliday && BREAK_DIMMED,
                        )}
                      >
                        {subject ? <SubjectBadge subject={subject} /> : <span className="text-muted-foreground">—</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {allSubjects.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Reference</div>
          <div className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-3">
            <SubjectLegendColumn label="Subjects" subjects={mainSubjects} />
            <SubjectLegendColumn label="Activities" subjects={otherSubjects} />
          </div>
        </div>
      )}
    </>
  );
}

function SubjectLegendColumn({ label, subjects }: { label: string; subjects: string[] }) {
  if (subjects.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[11px] font-medium text-muted-foreground/70">{label}</div>
      {subjects.map((s) => (
        <span key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <SubjectBadge subject={s} />
          {s}
        </span>
      ))}
    </div>
  );
}
