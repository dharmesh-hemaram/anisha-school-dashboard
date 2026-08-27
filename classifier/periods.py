"""
Parse "Period N: ..." breakdowns out of Daily Class Update notices, so the
dashboard can render them period-by-period instead of one wall of text.

Typical raw text:
  "Class III F Daily Class Update 21/08/2026 Period 1: Assembly: Assembly
   was conducted Period 2: Maths - Proxy Period 3: SST Notebook Writing...
   Period 4: Maths Written work... HW - Complete Review Exercise..."

A second, forward-looking notice shape shares the "Daily Class Update"
category but isn't a recap at all -- it's next school day's timetable, one
subject per line (occasionally "1.\tSubject"), with no notes or homework:
  "Sharing the timetable for 7th April 2026, Tuesday. Kindly send the books
   with your ward accordingly.
   1.  Assembly
   2.  Science
   3.  Math ..."
parse_timetable() handles that shape; build_record() falls back to it only
when parse_periods() finds no "Period N:" markers.
"""

import re
from typing import Optional

from classifier.classify import _KNOWN_SUBJECTS_RE, _normalize_subject

_PERIOD_SPLIT_RE = re.compile(r"period\s*(\d+)\s*[:\-]?\s*", re.I)
# The marker is often "(h.w)" or "(H.W)" rather than a bare "HW-" -- e.g.
# "Hindi(h.w)- अपठित..." -- so the closing paren must be consumed here too,
# or it leaks into the extracted homework text as a stray leading ")".
_HW_SPLIT_RE = re.compile(r"\(?\s*\bh\s*\.?\s*w\.?\s*\)?\s*[:\-]?\s*|\(?\s*\bhomework\)?\s*[:\-]?\s*", re.I)

TIMETABLE_HEADER_RE = re.compile(r"sharing the time\s*table for", re.I)
_LEADING_NUMBER_RE = re.compile(r"^\s*\d+[.)]\s*")
# Sign-off/instruction/date lines that sit among the subject list but
# aren't subjects themselves -- e.g. "Please send the books accordingly.",
# "Kindly send the books with your ward accordingly", "Regards", or a
# leftover "17th June 2026, Wednesday" when the date and the "Kindly send
# the books..." sentence land on separate lines from the header.
_TIMETABLE_SKIP_LINE_RE = re.compile(
    r"\b(please|kindly|send\b.*\bbooks\b|accordingly|regards|thank\s*you|thanks|"
    r"monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{4})\b", re.I,
)


def parse_periods(text: str) -> list:
    cleaned = text.replace("*", "")
    matches = list(_PERIOD_SPLIT_RE.finditer(cleaned))
    periods = []
    for i, m in enumerate(matches):
        period_num = int(m.group(1))
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(cleaned)
        segment = cleaned[start:end].strip(" \n-:")
        if not segment:
            continue

        hw = None
        note = segment
        hw_match = _HW_SPLIT_RE.search(segment)
        if hw_match:
            note = segment[: hw_match.start()].strip(" .\n-")
            hw = segment[hw_match.end() :].strip(" .\n-") or None

        subject: Optional[str] = None
        subj_match = _KNOWN_SUBJECTS_RE.match(note)
        if subj_match:
            subject = _normalize_subject(subj_match.group(1))
            note = note[subj_match.end() :].lstrip(" -:").strip() or None

        periods.append({"period": period_num, "subject": subject, "note": note or None, "hw": hw})
    return periods


def parse_timetable(text: str) -> list:
    header = TIMETABLE_HEADER_RE.search(text)
    if not header:
        return []

    body = text[header.end():]
    periods = []
    for raw_line in body.split("\n"):
        line = _LEADING_NUMBER_RE.sub("", raw_line).strip(" \t-")
        if not line or _TIMETABLE_SKIP_LINE_RE.search(line):
            continue

        subject: Optional[str] = None
        note = line
        subj_match = _KNOWN_SUBJECTS_RE.match(line)
        if subj_match:
            subject = _normalize_subject(subj_match.group(1))
            note = line[subj_match.end():].strip(" -:()") or None

        periods.append({"period": len(periods) + 1, "subject": subject, "note": note, "hw": None})
    return periods
