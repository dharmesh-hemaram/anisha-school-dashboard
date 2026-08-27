"""
Push Exam/Test, Holiday and School Event notices onto the shared Google
Calendar the dashboard's "Subscribe on Calendar" button already points to --
calendar_event_id has been a placeholder field on every record since the
pipeline's first version (see datastore/store.py); this is what fills it in.

Authenticates as a service account rather than a signed-in user: this runs
unattended (a scheduled GitHub Action, no browser, no human present), which
is exactly what service accounts are for -- no OAuth consent screen, no
refresh-token dance, just a JSON key. One-time setup: create a service
account in Google Cloud Console, enable the Calendar API, and share the
target calendar with the service account's email ("Make changes to
events"). See .env.example for the env vars this needs.

Only the categories the dashboard's own Upcoming tab shows (see
UPCOMING_CATEGORIES in docs/index.html) are synced, and the portion sheet
itself is skipped -- it's one notice covering a whole exam's syllabus, not
a single day's event.
"""

import json
import logging
import os
from datetime import date, timedelta

from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

SCOPES = ["https://www.googleapis.com/auth/calendar.events"]
SYNCED_CATEGORIES = {"Exam/Test", "Holiday", "School Event"}

# Google Calendar's fixed 11-color event palette, referenced by these
# string IDs -- warm-to-cool roughly mirrors the dashboard's own state
# colors (today/soon = warm, future = cool). A category with no entry here
# gets Calendar's default color instead of raising.
_COLOR_ID = {
    "Exam/Test": "11",     # Tomato (red) -- reads as the most urgent
    "Holiday": "10",       # Basil (green)
    "School Event": "7",   # Peacock (blue)
}
# Color alone doesn't survive every calendar view (a generic ICS reader, a
# list/agenda view, a notification) -- a short text prefix keeps the type
# identifiable even where color doesn't render.
_TITLE_PREFIX = {
    "Exam/Test": "Test",
    "Holiday": "Holiday",
    "School Event": "Event",
}

logger = logging.getLogger(__name__)


def _service():
    info = json.loads(os.environ["GOOGLE_SERVICE_ACCOUNT_JSON"])
    creds = Credentials.from_service_account_info(info, scopes=SCOPES)
    return build("calendar", "v3", credentials=creds)


def _title(r: dict) -> str:
    if r.get("subject") and r.get("chapter"):
        base = f"{r['subject']} — {r['chapter']}"
    elif r.get("subject"):
        base = r["subject"]
    else:
        base = r["text"].strip().split("\n", 1)[0][:120]
    prefix = _TITLE_PREFIX.get(r["category"])
    return f"{prefix}: {base}" if prefix else base


def _event_body(r: dict) -> dict:
    start = date.fromisoformat(r["event_date_iso"])
    # Google Calendar all-day events use an exclusive end date.
    end = start + timedelta(days=1)
    description = r["text"]
    if r.get("attachment_url"):
        description += f"\n\n{r['attachment_url']}"
    body = {
        "summary": _title(r),
        "description": description,
        "start": {"date": start.isoformat()},
        "end": {"date": end.isoformat()},
    }
    color_id = _COLOR_ID.get(r["category"])
    if color_id:
        body["colorId"] = color_id
    return body


def sync_events(records: list) -> tuple[int, int]:
    """Create/update a calendar event for every eligible record, mutating
    calendar_event_id on each in place. Returns (created, updated)."""
    calendar_id = os.environ["GOOGLE_CALENDAR_ID"]
    service = _service()

    eligible = [
        r for r in records
        if r["category"] in SYNCED_CATEGORIES and r.get("material_type") != "Portion"
    ]

    created = updated = 0
    for r in eligible:
        body = _event_body(r)
        if r.get("calendar_event_id"):
            try:
                service.events().update(
                    calendarId=calendar_id, eventId=r["calendar_event_id"], body=body
                ).execute()
                updated += 1
                continue
            except HttpError as e:
                if e.resp.status != 404:
                    raise
                logger.warning(
                    "Calendar event %s for record %s no longer exists -- recreating",
                    r["calendar_event_id"], r["id"],
                )
                r["calendar_event_id"] = None
        event = service.events().insert(calendarId=calendar_id, body=body).execute()
        r["calendar_event_id"] = event["id"]
        created += 1

    return created, updated
