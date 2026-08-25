"""
notices.json is the source of truth: every notice seen, its classification,
and (once wired up) its linked calendar event. Sr.No. on the ERP is just a
display-position number that shifts as new notices are posted -- not a
stable ID -- so dedup keys on a content hash of (posted_date, text) instead.
"""

import hashlib
import json
from datetime import date, datetime
from pathlib import Path

from classifier.classify import extract_exam_cycle_label
from classifier.periods import parse_periods

EXAM_CYCLE_WINDOW_DAYS = 21


def notice_id(posted_date: str, text: str) -> str:
    return hashlib.sha256(f"{posted_date}|{text}".encode("utf-8")).hexdigest()[:16]


def _to_iso_date(posted_date: str) -> str:
    return datetime.strptime(posted_date, "%d-%m-%Y").date().isoformat()


def build_record(notice, classification) -> dict:
    periods = parse_periods(notice.text) if classification.category == "Daily Class Update" else []
    posted_date_iso = _to_iso_date(notice.posted_date)
    return {
        "id": notice_id(notice.posted_date, notice.text),
        "posted_date": notice.posted_date,
        "posted_date_iso": posted_date_iso,
        # The date the notice is *about* (a test/event/holiday date), which is
        # often different from posted_date_iso -- falls back to posted_date_iso
        # when the body text has no extractable date.
        "event_date_iso": classification.event_date_iso or posted_date_iso,
        "text": notice.text,
        "attachment_url": notice.attachment_url,
        "category": classification.category,
        "method": classification.method,
        "periods": periods,
        "confidence": classification.confidence,
        "subject": classification.subject,
        "chapter": classification.chapter,
        "material_type": classification.material_type,
        "calendar_event_id": None,
    }


def load(path) -> list:
    p = Path(path)
    if not p.exists():
        return []
    with open(p) as f:
        return json.load(f)


def save(path, records) -> None:
    with open(path, "w") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)


def tag_exam_cycles(records: list) -> list:
    """Tag each Worksheet-type item with the nearest named exam cycle.

    Revision/worksheet numbering resets per exam (PT-1's "Revision No. 1"
    and Half Yearly's "Revision No. 1" are unrelated), and the worksheet
    notices themselves never name the cycle -- only the separate exam
    announcement notice does ("Periodic Test-1 examinations will
    commence..."). So: collect every Exam/Test notice that names a cycle
    as an anchor, then tag each worksheet with whichever anchor is
    closest in time (either direction -- an announcement can land before,
    during, or after its prep-worksheet burst), within a 3-week window.
    """
    anchors = []
    for r in records:
        if r["category"] == "Exam/Test":
            label = extract_exam_cycle_label(r["text"])
            if label:
                anchors.append((date.fromisoformat(r["posted_date_iso"]), label))

    for r in records:
        if r["category"] != "Subject Notes" or r.get("material_type") != "Worksheet":
            r["exam_cycle"] = None
            continue
        wd = date.fromisoformat(r["posted_date_iso"])
        best_label, best_dist = None, None
        for anchor_date, label in anchors:
            dist = abs((anchor_date - wd).days)
            if dist <= EXAM_CYCLE_WINDOW_DAYS and (best_dist is None or dist < best_dist):
                best_label, best_dist = label, dist
        r["exam_cycle"] = best_label
    return records


def prune_before(records: list, cutoff_iso: str) -> list:
    """Drop notices posted before `cutoff_iso` -- for excluding a prior
    academic year's notices from a full-year backfill (e.g. Class III F's
    notices only start once the new academic year's welcome notice goes
    out; everything before that is the previous class/year's leftovers)."""
    return [r for r in records if r["posted_date_iso"] >= cutoff_iso]


def merge(existing: list, fresh: list) -> list:
    """Merge freshly-classified notices into the existing store.

    Classification fields (category/method/confidence/subject/chapter) are
    always taken from `fresh` so improved classifier rules propagate on
    rerun. `calendar_event_id` is preserved from `existing` so a reclassify
    doesn't orphan an already-created calendar event. Notices outside the
    current fetch window (older than `fresh` covers) are left untouched.
    """
    existing_by_id = {r["id"]: r for r in existing}
    merged = dict(existing_by_id)
    for rec in fresh:
        prior = existing_by_id.get(rec["id"])
        if prior and prior.get("calendar_event_id"):
            rec["calendar_event_id"] = prior["calendar_event_id"]
        merged[rec["id"]] = rec
    return sorted(merged.values(), key=lambda r: r["posted_date_iso"], reverse=True)
