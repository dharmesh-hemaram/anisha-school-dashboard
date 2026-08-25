"""
Entry point for the notice pipeline: login -> fetch -> classify -> merge
into docs/notices.json.

Usage:
  python main.py               # daily mode: last N recent notices
  python main.py --year 2026   # backfill mode: every notice from that year
"""

import argparse
import logging

from dotenv import load_dotenv

from classifier.classify import classify
from datastore.store import build_record, load, merge, pair_worksheets, prune_before, save, tag_exam_cycles
from scraper.login import build_session_from_env
from scraper.notices import fetch_notices, fetch_notices_for_year

DATA_PATH = "docs/notices.json"

logger = logging.getLogger(__name__)


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
    merged = tag_exam_cycles(merged)
    merged = pair_worksheets(merged)
    save(DATA_PATH, merged)

    logger.info(
        "Wrote %d total records (%d fresh: %d pattern-matched, %d defaulted to General/Other) to %s",
        len(merged), len(fresh_records), method_counts["pattern"], method_counts["default"], DATA_PATH,
    )


if __name__ == "__main__":
    main()
