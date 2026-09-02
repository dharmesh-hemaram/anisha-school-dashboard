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

The current exam cycle's per-subject test days are usually still missing
from notices.json entirely -- the school posts each subject's "class test"
notice only as that day approaches, so most of a freshly-announced exam
(e.g. all of Half Yearly before the school starts posting individual class
tests) exists only as one portion-sheet notice covering the whole
syllabus, not a day-by-day schedule. The dashboard's own Upcoming tab
papers over this by synthesizing one entry per docs/portion_schedules.json
row, client-side, skipping any row a real notice already covers -- see
renderUpcoming() in docs/index.html. _synthetic_events() below mirrors
that same logic in Python so the calendar doesn't fall a whole exam cycle
behind Upcoming while waiting for individual notices to trickle in.
"""

import hashlib
import json
import logging
import os
from datetime import date, timedelta
from pathlib import Path

from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

SCOPES = ["https://www.googleapis.com/auth/calendar.events"]
SYNCED_CATEGORIES = {"Exam/Test", "Holiday", "School Event"}
PORTION_SCHEDULES_PATH = Path("docs/portion_schedules.json")

# Google Calendar's fixed 11-color event palette, referenced by these
# string IDs. Picked from the paler half of the palette on purpose --
# Tomato (bold red) read as an alarm rather than just "this is a test",
# too shouty for something that isn't actually urgent most of the time.
# A category with no entry here gets Calendar's default color instead of
# raising.
_COLOR_ID = {
    "Exam/Test": "4",     # Flamingo (soft coral)
    "Holiday": "2",       # Sage (soft green)
    "School Event": "1",  # Lavender (soft blue-purple)
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


def _cycles_of(r: dict) -> list:
    # exam_cycle is a plain string on Exam/Test records but a list on
    # Subject Notes records (tag_exam_cycles() in datastore/store.py can
    # tag a chapter to more than one cycle) -- normalize either shape.
    ec = r.get("exam_cycle")
    if isinstance(ec, list):
        return ec
    return [ec] if ec else []


def _latest_exam_cycle(records: list):
    """Port of sortedExamCycles()[0] in docs/index.html: the cycle whose
    most-recently-posted tagged record is newest -- "the exam that's
    current right now"."""
    cycles = {c for r in records for c in _cycles_of(r)}
    if not cycles:
        return None
    def latest_posted(cycle):
        dates = [r["posted_date_iso"] for r in records if cycle in _cycles_of(r)]
        return max(dates) if dates else ""
    return max(cycles, key=latest_posted)


def _synthetic_events(records: list) -> list:
    """One entry per portion_schedules.json row for the current cycle that
    isn't already covered by a real per-subject class-test notice -- see
    the module docstring. Each gets a stable id (see _upsert_event) instead
    of a notices.json-tracked calendar_event_id, since these rows are
    generated fresh every run rather than persisted."""
    if not PORTION_SCHEDULES_PATH.exists():
        return []
    portion_schedules = json.loads(PORTION_SCHEDULES_PATH.read_text())
    cycle = _latest_exam_cycle(records)
    schedule = portion_schedules.get(cycle, {}).get("schedule") if cycle else None
    if not schedule:
        return []

    has_portion_notice = any(
        r["category"] == "Exam/Test" and r.get("material_type") == "Portion" and r.get("exam_cycle") == cycle
        for r in records
    )
    if not has_portion_notice:
        return []

    real_slots = {
        (r["subject"], r["event_date_iso"])
        for r in records
        if r["category"] == "Exam/Test" and r.get("material_type") != "Portion"
        and r.get("exam_cycle") == cycle and r.get("subject")
    }

    return [
        {
            "category": "Exam/Test",
            "material_type": None,
            "subject": row["subject"],
            "chapter": None,
            "event_date_iso": row["date_iso"],
            "text": row["portion"],
            # Not the whole cycle's scanned portion sheet -- pointing every
            # subject's event at the exact same PDF reads as broken rather
            # than helpful (same reasoning as the Upcoming tab's synthetic
            # entries).
            "attachment_url": None,
            "_sync_id": _synthetic_event_id(cycle, row["subject"]),
        }
        for row in schedule
        if (row["subject"], row["date_iso"]) not in real_slots
    ]


def _synthetic_event_id(cycle: str, subject: str) -> str:
    # Calendar event IDs must be lowercase base32hex ([a-v0-9]), 5-1024
    # chars -- a plain hex digest satisfies that (0-9a-f is a subset), but
    # a letter prefix doesn't: an early version prepended "synth", and its
    # "y" (outside a-v) got every synthetic event rejected with "Invalid
    # resource id value." No prefix needed -- the hash is already unique.
    key = f"portion|{cycle}|{subject}"
    return hashlib.sha1(key.encode()).hexdigest()


def _upsert_event(service, calendar_id: str, body: dict, event_id: str = None) -> tuple[str, bool]:
    """Update by event_id if given, falling back to insert if that id was
    never created (or was deleted) -- covers both a real record's
    Google-assigned id (looked up via calendar_event_id) and a synthetic
    row's deterministic one. Returns (event_id, was_update)."""
    if event_id:
        try:
            service.events().update(calendarId=calendar_id, eventId=event_id, body=body).execute()
            return event_id, True
        except HttpError as e:
            if e.resp.status not in (404, 410):
                raise
            body = {**body, "id": event_id}
    event = service.events().insert(calendarId=calendar_id, body=body).execute()
    return event["id"], False


def sync_events(records: list) -> tuple[int, int]:
    """Create/update a calendar event for every eligible record (mutating
    calendar_event_id on each in place) plus every synthetic current-cycle
    entry not yet covered by a real notice. Returns (created, updated)."""
    calendar_id = os.environ["GOOGLE_CALENDAR_ID"]
    service = _service()

    eligible = [
        r for r in records
        if r["category"] in SYNCED_CATEGORIES and r.get("material_type") != "Portion"
    ]

    created = updated = 0
    for r in eligible:
        event_id, was_update = _upsert_event(service, calendar_id, _event_body(r), r.get("calendar_event_id"))
        r["calendar_event_id"] = event_id
        if was_update:
            updated += 1
        else:
            created += 1

    for r in _synthetic_events(records):
        _, was_update = _upsert_event(service, calendar_id, _event_body(r), r["_sync_id"])
        if was_update:
            updated += 1
        else:
            created += 1

    return created, updated
