import type { ReactNode } from "react";
import { Fragment } from "react";
import { fmtDate, parseISO, todayISO } from "../../lib/date";
import Marker, { MarkerContent } from "./Marker";

interface TimelineProps<T> {
  items: T[];
  dateIso: (item: T) => string;
  children: (item: T, index: number) => ReactNode;
  className?: string;
}

/** Groups already-ordered `items` under one date-divider Marker per distinct
 * ISO date, with a "Today" label when that date is today. Shared by the
 * Upcoming, Feed, and HW tabs, which all read as a per-day list. */
export default function Timeline<T>({ items, dateIso, children, className }: TimelineProps<T>) {
  const today = todayISO();

  return (
    <div className={className ? `flex flex-col gap-2 ${className}` : "flex flex-col gap-2"}>
      {items.map((item, i) => {
        const iso = dateIso(item);
        const showHeader = i === 0 || dateIso(items[i - 1]) !== iso;
        const isToday = iso === today;
        return (
          <Fragment key={i}>
            {showHeader && (
              <Marker variant="separator" className={isToday ? "text-primary" : "text-muted-foreground"}>
                <MarkerContent>
                  {fmtDate(parseISO(iso))}
                  {isToday && " · Today"}
                </MarkerContent>
              </Marker>
            )}
            {children(item, i)}
          </Fragment>
        );
      })}
    </div>
  );
}
