import { useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchDashboardData } from "../features/data/dataSlice";
import styles from "./AppLayout.module.css";

const TABS = [
  { to: "/upcoming", label: "Upcoming" },
  { to: "/hw", label: "HW" },
  { to: "/exam", label: "Exam" },
  { to: "/notes", label: "Notes" },
  { to: "/feed", label: "Feed" },
];

export default function AppLayout() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.data.status);
  const error = useAppSelector((s) => s.data.error);
  const noticeCount = useAppSelector((s) => s.data.notices.length);
  const lastUpdated = useAppSelector((s) => s.data.lastUpdated);

  useEffect(() => {
    if (status === "idle") dispatch(fetchDashboardData());
  }, [status, dispatch]);

  const footerText =
    status === "loading" || status === "idle"
      ? "Loading…"
      : status === "failed"
        ? `Failed to load notices.json — ${error}`
        : `${noticeCount} notices · updated ${formatUpdatedAt(lastUpdated?.last_updated)}`;

  return (
    <div className="wrap">
      <div className={styles.masthead}>
        <div className={styles.eyebrow}>Class III F</div>
        <a
          className={styles.subscribeBtn}
          href="https://calendar.google.com/calendar/u/0?cid=YzAzN2Y0ZDc0ODkyZjU1N2VkNzQwYjFkMjQxMGU2YmIxZWZjYWIyMjRkZGQ5NWFkNDVkMWU0ODZiYzhhODVlNUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Subscribe on Calendar
        </a>
      </div>

      <nav className={styles.tabbar}>
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `${styles.tabBtn} ${isActive ? styles.active : ""}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.panel}>
        <Outlet />
      </div>

      <footer className={styles.footer}>
        <div>{footerText}</div>
        <div className={styles.footerCredit}>Made with ❤️ by Dharmesh</div>
        <div className={styles.footerReport}>
          <a
            href="https://github.com/dharmesh-hemaram/anisha-school-dashboard/issues/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            Report a bug or issue
          </a>
        </div>
      </footer>
    </div>
  );
}

// The pipeline's own fetch timestamp -- when the data actually last changed,
// not just when this page happens to be viewed. Falls back to "today" only
// if last_updated.json hasn't been generated yet.
function formatUpdatedAt(iso: string | undefined): string {
  if (!iso) {
    return new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}
