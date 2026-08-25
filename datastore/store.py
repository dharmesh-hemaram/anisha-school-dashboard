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
from classifier.periods import parse_periods, parse_timetable, TIMETABLE_HEADER_RE

EXAM_CYCLE_WINDOW_DAYS = 21


def notice_id(posted_date: str, text: str) -> str:
    return hashlib.sha256(f"{posted_date}|{text}".encode("utf-8")).hexdigest()[:16]


def _to_iso_date(posted_date: str) -> str:
    return datetime.strptime(posted_date, "%d-%m-%Y").date().isoformat()


def build_record(notice, classification) -> dict:
    # A "sharing the timetable for <date>" notice shares the Daily Class
    # Update category but is next school day's book list, not a recap --
    # flagged separately so the dashboard can label it distinctly. Some of
    # these still use "Period N:" phrasing (parse_periods handles them);
    # the rest are a bare one-subject-per-line list (parse_timetable).
    is_timetable = classification.category == "Daily Class Update" and bool(
        TIMETABLE_HEADER_RE.search(notice.text)
    )
    periods = []
    if classification.category == "Daily Class Update":
        periods = parse_periods(notice.text)
        if not periods and is_timetable:
            periods = parse_timetable(notice.text)

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
        "is_timetable": is_timetable,
        "confidence": classification.confidence,
        "subject": classification.subject,
        "chapter": classification.chapter,
        "chapter_number": classification.chapter_number,
        "material_type": classification.material_type,
        "worksheet_number": classification.worksheet_number,
        "answer_key_url": None,
        "paired": False,
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


EXAM_SCHEDULE_WINDOW_DAYS = 90


def tag_exam_cycles(records: list) -> list:
    """Tag each Exam/Test, Worksheet/Revision and Chapter Notes item with
    the nearest named exam cycle, powering the Exam Prep tab.

    Only a few Exam/Test notices ever name a cycle in their own text -- the
    portion sheet ("PFA the PT 1 portion sheet"), the announcement
    ("Periodic Test-1 examinations will commence..."), a reschedule notice.
    Every individual subject's "class test" notice (the actual date/time
    for that subject's PT-1 or Half Yearly paper) never says which cycle
    it belongs to -- it's identifiable only by *when* it was posted,
    clustered within a couple months of that cycle's named anchor. So:
    collect the handful of self-named anchors first, then assign every
    other record to its nearest anchor in time.

    Worksheet/Revision/Notes get a tight 3-week window (they're general
    teaching material that may not be exam-specific at all, so a notice
    posted long before or after any exam shouldn't get roped in). Exam/Test
    class-test notices get a much wider window -- per-subject testing for
    one cycle can span a couple of months in practice -- since everything
    in that category genuinely is part of some exam's schedule.
    """
    anchors = []
    for r in records:
        if r["category"] == "Exam/Test":
            label = extract_exam_cycle_label(r["text"])
            if label:
                anchors.append((date.fromisoformat(r["posted_date_iso"]), label))

    def nearest_cycle(wd, window_days):
        best_label, best_dist = None, None
        for anchor_date, label in anchors:
            dist = abs((anchor_date - wd).days)
            if dist <= window_days and (best_dist is None or dist < best_dist):
                best_label, best_dist = label, dist
        return best_label

    for r in records:
        wd = date.fromisoformat(r["posted_date_iso"])
        if r["category"] == "Exam/Test":
            r["exam_cycle"] = nearest_cycle(wd, EXAM_SCHEDULE_WINDOW_DAYS)
        elif r["category"] == "Subject Notes" and r.get("material_type") in ("Worksheet", "Revision", "Notes"):
            r["exam_cycle"] = nearest_cycle(wd, EXAM_CYCLE_WINDOW_DAYS)
        else:
            r["exam_cycle"] = None
    return records


def prune_before(records: list, cutoff_iso: str) -> list:
    """Drop notices posted before `cutoff_iso` -- for excluding a prior
    academic year's notices from a full-year backfill (e.g. Class III F's
    notices only start once the new academic year's welcome notice goes
    out; everything before that is the previous class/year's leftovers)."""
    return [r for r in records if r["posted_date_iso"] >= cutoff_iso]


PAIR_WINDOW_DAYS = 30


def pair_worksheets(records: list) -> list:
    """Pair each Worksheet with its Answer Key so the dashboard can render
    one card with both links instead of two separate cards/sections.

    Only material_type == "Worksheet" is eligible -- "Revision" is
    excluded entirely, since real answer-key notices always say "answer
    key for worksheet no. N", never "...for revision no. N". Revision
    and Worksheet are separate numbered series that can collide on the
    same number (e.g. "Revision No. 2" and "Culmination Worksheet No. 2"
    posted the same week) -- letting Revision into the candidate pool let
    a same-numbered Revision steal an answer key from the Worksheet it
    actually belongs to.

    Even within Worksheet-only candidates, numbers can still be noisy, so
    this does one global greedy match per subject: consider every
    worksheet/answer-key pair within a 30-day window, sort by date gap
    (same-number pairs break ties), and assign smallest-gap-first. Paired
    answer keys are flagged `paired=True` so the dashboard skips rendering
    them as their own card.
    """
    by_subject = {}
    for r in records:
        if r["category"] == "Subject Notes" and r["subject"] and r["material_type"] in ("Worksheet", "Answer Key"):
            r["answer_key_url"] = None
            r["paired"] = False
            by_subject.setdefault(r["subject"], []).append(r)

    for items in by_subject.values():
        worksheets = [r for r in items if r["material_type"] == "Worksheet"]
        answer_keys = [r for r in items if r["material_type"] == "Answer Key"]

        candidates = []
        for w in worksheets:
            wd = date.fromisoformat(w["posted_date_iso"])
            for a in answer_keys:
                gap = abs((date.fromisoformat(a["posted_date_iso"]) - wd).days)
                if gap > PAIR_WINDOW_DAYS:
                    continue
                same_number = w["worksheet_number"] is not None and w["worksheet_number"] == a["worksheet_number"]
                candidates.append((0 if same_number else 1, gap, w, a))

        # A genuine number match is a stronger signal than mere same-day
        # coincidence -- rank all number matches ahead of all date-only
        # matches, then break ties by gap within each group.
        candidates.sort(key=lambda c: (c[0], c[1]))
        claimed_w, claimed_a = set(), set()
        for _, _, w, a in candidates:
            if id(w) in claimed_w or id(a) in claimed_a:
                continue
            w["answer_key_url"] = a["attachment_url"]
            a["paired"] = True
            claimed_w.add(id(w))
            claimed_a.add(id(a))

    return records


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
