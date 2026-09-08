import { useMemo } from "react";
import { useAppSelector } from "../../app/hooks";
import { buildUpcomingItems, buildWeekStripItems } from "../../lib/upcoming";
import Timeline from "../../components/ui/Timeline";
import EmptyState from "../../components/ui/EmptyState";
import WeekStrip from "./WeekStrip";
import ActionCard from "./ActionCard";

export default function UpcomingPage() {
  const notices = useAppSelector((s) => s.data.notices);
  const portionSchedules = useAppSelector((s) => s.data.portionSchedules);
  const holidays = useAppSelector((s) => s.data.holidays);
  const eventsCalendar = useAppSelector((s) => s.data.eventsCalendar);

  const weekStripItems = useMemo(() => buildWeekStripItems(notices, holidays, eventsCalendar), [notices, holidays, eventsCalendar]);
  const items = useMemo(() => buildUpcomingItems(notices, portionSchedules), [notices, portionSchedules]);

  return (
    <>
      <div className="sectionNote">Exams, school events &amp; holidays, newest first</div>
      <WeekStrip items={weekStripItems} />
      {items.length === 0 ? (
        <EmptyState>Nothing upcoming right now.</EmptyState>
      ) : (
        <Timeline items={items} dateIso={(r) => r.event_date_iso}>
          {(item) => <ActionCard key={item.id} item={item} />}
        </Timeline>
      )}
    </>
  );
}
