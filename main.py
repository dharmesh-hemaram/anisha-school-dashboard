"""
Entry point for the notice pipeline: login -> fetch -> classify -> merge
into docs/notices.json.

Usage:
  python main.py               # daily mode: last N recent notices
  python main.py --year 2026   # backfill mode: every notice from that year
"""

import argparse
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

from attachments.download import download
from attachments.master_docs import OUTPUT_PATHS, PARSERS, detect
from calendar_sync import sync_events
from classifier.classify import classify
from datastore.store import build_record, load, merge, pair_worksheets, prune_before, save, tag_exam_cycles
from scraper.login import build_session_from_env
from scraper.notices import fetch_notices, fetch_notices_for_year

DATA_PATH = "docs/notices.json"
LAST_UPDATED_PATH = "docs/last_updated.json"
PORTION_SCHEDULES_PATH = "docs/portion_schedules.json"

logger = logging.getLogger(__name__)


def process_master_docs(session, notices) -> None:
    """Holiday List / Special Days & Events / Time Table are once-a-year
    attachments carrying structured data notice text never has -- detect
    them, download+parse, and refresh their dedicated output file. Only
    ever a couple of matches per run, so failures are logged and skipped
    rather than aborting the whole pipeline over one bad attachment."""
    for n in notices:
        doc_type = detect(n.text)
        if not doc_type or not n.attachment_url:
            continue
        out_path = OUTPUT_PATHS[doc_type]
        try:
            data = PARSERS[doc_type](download(session, n.attachment_url))
        except Exception:
            logger.exception("Failed to process %s attachment from notice posted %s", doc_type, n.posted_date)
            continue
        with open(out_path, "w") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        logger.info("Wrote %s from notice posted %s", out_path, n.posted_date)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, help="Backfill mode: pull every notice from this year")
    parser.add_argument("--recent", type=int, default=50, help="Daily mode: how many recent notices to fetch")
    parser.add_argument("--since", type=str, help="Exclude notices posted before this ISO date (YYYY-MM-DD) -- for dropping a prior academic year's leftovers from a backfill")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    load_dotenv()

    session = build_session_from_env()
    session.login()

    notices = (
        fetch_notices_for_year(session, args.year)
        if args.year
        else fetch_notices(session, limit=args.recent)
    )

    process_master_docs(session, notices)

    method_counts = {"pattern": 0, "default": 0}
    fresh_records = []
    for n in notices:
        c = classify(n.text)
        method_counts[c.method] = method_counts.get(c.method, 0) + 1
        fresh_records.append(build_record(n, c))

    existing = load(DATA_PATH)
    merged = merge(existing, fresh_records)
    if args.since:
        before = len(merged)
        merged = prune_before(merged, args.since)
        logger.info("Pruned %d notices before %s", before - len(merged), args.since)
    portion_schedules = load(PORTION_SCHEDULES_PATH) if Path(PORTION_SCHEDULES_PATH).exists() else {}
    merged = tag_exam_cycles(merged, portion_schedules)
    merged = pair_worksheets(merged)

    # Optional -- most contributors won't have the calendar set up. Sync
    # mutates calendar_event_id on eligible records in place, so it has to
    # run before save(); a Calendar API hiccup should never block the
    # notices themselves from being written.
    if os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON"):
        try:
            created, updated = sync_events(merged)
            logger.info("Synced calendar events: %d created, %d updated", created, updated)
        except Exception:
            logger.exception("Calendar sync failed -- continuing without it")
    else:
        logger.info("GOOGLE_SERVICE_ACCOUNT_JSON not set -- skipping calendar sync")

    save(DATA_PATH, merged)

    # Real fetch time, not "whenever the page happens to be viewed" -- the
    # dashboard footer reads this to show when the data actually last changed.
    with open(LAST_UPDATED_PATH, "w") as f:
        json.dump({"last_updated": datetime.now(timezone.utc).isoformat()}, f)

    logger.info(
        "Wrote %d total records (%d fresh: %d pattern-matched, %d defaulted to General/Other) to %s",
        len(merged), len(fresh_records), method_counts["pattern"], method_counts["default"], DATA_PATH,
    )


if __name__ == "__main__":
    main()
