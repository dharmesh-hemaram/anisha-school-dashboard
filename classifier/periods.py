"""
Parse "Period N: ..." breakdowns out of Daily Class Update notices, so the
dashboard can render them period-by-period instead of one wall of text.

Typical raw text:
  "Class III F Daily Class Update 21/08/2026 Period 1: Assembly: Assembly
   was conducted Period 2: Maths - Proxy Period 3: SST Notebook Writing...
   Period 4: Maths Written work... HW - Complete Review Exercise..."
"""

import re
from typing import Optional

from classifier.classify import _KNOWN_SUBJECTS_RE, _normalize_subject

_PERIOD_SPLIT_RE = re.compile(r"period\s*(\d+)\s*[:\-]?\s*", re.I)
_HW_SPLIT_RE = re.compile(r"\bh\s*\.?\s*w\.?\s*[:\-]?\s*|\bhomework\s*[:\-]?\s*", re.I)


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
