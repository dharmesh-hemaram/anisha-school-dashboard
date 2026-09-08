import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { collectHwTasks } from "../../lib/hw";
import { daysUntil, parseDMY, parseISO } from "../../lib/date";
import { HW_SEED_DAYS, HW_WINDOW_DAYS } from "../../lib/constants";
import { seedIfNeeded } from "../../features/hw/hwSlice";
import Timeline from "../../components/ui/Timeline";
import EmptyState from "../../components/ui/EmptyState";
import HwRow from "./HwRow";

export default function HwPage() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.data.status);
  const notices = useAppSelector((s) => s.data.notices);
  const completed = useAppSelector((s) => s.hw.completed);
  const seeded = useAppSelector((s) => s.hw.seeded);

  const tasks = useMemo(() => collectHwTasks(notices), [notices]);

  useEffect(() => {
    if (status !== "succeeded" || seeded) return;
    const oldIds = tasks.filter((t) => -daysUntil(parseISO(t.date_iso)) > HW_SEED_DAYS).map((t) => t.id);
    dispatch(seedIfNeeded(oldIds));
  }, [status, seeded, tasks, dispatch]);

  const visible = useMemo(
    () =>
      tasks
        .filter((t) => -daysUntil(parseISO(t.date_iso)) <= HW_WINDOW_DAYS)
        .sort((a, b) => parseDMY(b.posted_date).getTime() - parseDMY(a.posted_date).getTime()),
    [tasks],
  );

  return (
    <>
      <div className="sectionNote">Homework from the last two weeks — tap to mark done</div>
      {visible.length === 0 ? (
        <EmptyState>No homework from the last two weeks.</EmptyState>
      ) : (
        <Timeline items={visible} dateIso={(t) => t.date_iso}>
          {(t) => <HwRow key={t.id} task={t} done={Boolean(completed[t.id])} />}
        </Timeline>
      )}
    </>
  );
}
