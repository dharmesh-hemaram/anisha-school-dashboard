import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchDashboardData } from "../features/data/dataSlice";
import { Button } from "../components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "../components/ui/sidebar";
import styles from "./AppLayout.module.css";

const TABS = [
  { to: "/upcoming", label: "Upcoming" },
  { to: "/hw", label: "Homework" },
  { to: "/notes", label: "Notes" },
  { to: "/feed", label: "Feed" },
];

export default function AppLayout() {
  const location = useLocation();
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
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <h1 className="text-base font-medium">Class III</h1>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {TABS.map((tab) => (
                  <SidebarMenuItem key={tab.to}>
                    <SidebarMenuButton size="sm" isActive={location.pathname.startsWith(tab.to)} render={<Link to={tab.to} />}>
                      {tab.label}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className={`${styles.masthead} border-b px-4 md:px-6`}>
          <SidebarTrigger size="icon-xs" />
          <Button
            variant="ghost"
            size="xs"
            nativeButton={false}
            render={
              <a
                href="https://calendar.google.com/calendar/u/0?cid=YzAzN2Y0ZDc0ODkyZjU1N2VkNzQwYjFkMjQxMGU2YmIxZWZjYWIyMjRkZGQ5NWFkNDVkMWU0ODZiYzhhODVlNUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t"
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Subscribe on Calendar
          </Button>
        </div>

        {/* Same content-wrapper pattern as shadcn's dashboard-01 block --
            no max-width, so the page genuinely stretches on wide screens
            instead of sticking to the old mobile-only 640px column. */}
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
              <Outlet />
            </div>
          </div>
        </div>

        <footer className={`${styles.footer} px-4 md:px-6`}>
          <div className="md:flex md:items-center md:justify-between">
            <div>{footerText}</div>
            <div className="mt-1 md:mt-0">Made with ❤️ by Dharmesh</div>
          </div>
          <div className={`${styles.footerReport} mt-1`}>
            <a
              href="https://github.com/dharmesh-hemaram/anisha-school-dashboard/issues/new"
              target="_blank"
              rel="noopener noreferrer"
            >
              Report a bug or issue
            </a>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
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
