import type { HwTask, Notice } from "../types";

export function collectHwTasks(notices: Notice[]): HwTask[] {
  const tasks: HwTask[] = [];
  notices.forEach((r) => {
    if (r.category !== "Daily Class Update" || !r.periods) return;
    r.periods.forEach((p) => {
      if (!p.hw) return;
      tasks.push({
        id: `${r.id}-p${p.period}`,
        subject: p.subject ?? null,
        text: p.hw,
        date_iso: r.posted_date_iso,
        posted_date: r.posted_date,
      });
    });
  });
  return tasks;
}
