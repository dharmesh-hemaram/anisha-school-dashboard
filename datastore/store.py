"""
notices.json is the source of truth: every notice seen, its classification,
and (once wired up) its linked calendar event. Sr.No. on the ERP is just a
display-position number that shifts as new notices are posted -- not a
stable ID -- so dedup keys on a content hash of (posted_date, text) instead.
"""

import hashlib
import json
from datetime import datetime
from pathlib import Path


def notice_id(posted_date: str, text: str) -> str:
    return hashlib.sha256(f"{posted_date}|{text}".encode("utf-8")).hexdigest()[:16]


def _to_iso_date(posted_date: str) -> str:
    return datetime.strptime(posted_date, "%d-%m-%Y").date().isoformat()


def build_record(notice, classification) -> dict:
    return {
        "id": notice_id(notice.posted_date, notice.text),
        "posted_date": notice.posted_date,
        "posted_date_iso": _to_iso_date(notice.posted_date),
        "text": notice.text,
        "attachment_url": notice.attachment_url,
        "category": classification.category,
        "method": classification.method,
        "confidence": classification.confidence,
        "subject": classification.subject,
        "chapter": classification.chapter,
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
