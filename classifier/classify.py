"""
Notice classifier: keyword/pattern rules only. Anything that doesn't
confidently match a rule lands in General/Other -- no AI fallback, no
external dependency or cost for classification.

Categories derived from a full year (517 notices, 2026) on the SNBP Wagholi
ERP. The original 6-category guess (from a 50-notice sample) only covered
49% of the full year -- these rules were expanded against the real spread:
  - "Subject Notes" broadened to also catch worksheets/revisions/answer
    keys, which turned out to be the single largest bucket in the full
    year and mostly don't use the "PFA notes for Subject: X" phrasing the
    original rule expected.
  - "Daily Class Update" broadened to catch the "sharing the timetable for
    <tomorrow>" variant and the "DCU"/typo'd "Upadte" spellings actually
    used on site.
  - New "School Event" category for forward-looking scheduled events (PTM,
    Annual Concert, Picnic, tournaments, enrichment/seek-kit/robotics
    activities) -- distinct from "Event/Celebration", which is retrospective
    Facebook-photo recaps of things already done.
"""

import re
from dataclasses import dataclass
from typing import Optional

CATEGORIES = [
    "Daily Class Update",
    "Subject Notes",
    "Exam/Test",
    "School Event",
    "Holiday",
    "Event/Celebration",
    "General/Other",
]

_SUBJECT_LABEL_RE = re.compile(r"subject\s*[:\-]\s*([^\n]+)", re.I)
_CHAPTER_RE = re.compile(r"(?:chapter|topic|lesson(?:\s*no\.?)?)\s*[:\-]?\s*([^\n]+)", re.I)

# Maps loose/abbreviated spellings seen in real notices to one canonical
# label per subject, so the dashboard's subject picker doesn't fragment
# into near-duplicates (e.g. "SST" / "S.S.T" / "Social studies").
_SUBJECT_ALIASES = {
    "sst": "Social Studies",
    "s.s.t": "Social Studies",
    "computer science": "Computer Science",
    "comp science": "Computer Science",
    "eng": "English",
    "hindi grammar": "Hindi",
    "gk": "GK",
    "seek/gk": "GK",
    "math": "Maths",
    "maths": "Maths",
    "mathematics": "Maths",
}

# Known subject names, used as a fallback scan when a notice mentions a
# subject inline ("PFA Math Revision No. 8", "answer key ... of Hindi")
# without the explicit "Subject: X" label the primary regex expects.
# Longest-first so "Computer Science" matches before a bare "Science" would.
_KNOWN_SUBJECTS = sorted(
    [
        "Computer Science", "Social Studies", "SST", "Mathematics", "Maths", "Math",
        "Science", "Hindi", "English", "Marathi", "EVS", "Robotics", "GK",
    ],
    key=len, reverse=True,
)
_KNOWN_SUBJECTS_RE = re.compile(r"\b(" + "|".join(re.escape(s) for s in _KNOWN_SUBJECTS) + r")\b", re.I)

_SUBJECT_MATERIAL_RE = re.compile(r"\b(worksheet|revision|answer\s*key|culmination)\b", re.I)
_SCHOOL_EVENT_RE = re.compile(
    r"\bptm\b|annual concert|school picnic|\btournament\b|selection trials|"
    r"recruitment drive|enrichment activity|seek kit activity|robotics activity",
    re.I,
)


@dataclass
class Classification:
    category: str
    method: str  # "pattern" or "default"
    confidence: float
    subject: Optional[str] = None
    chapter: Optional[str] = None


def _normalize_subject(raw: str) -> str:
    key = raw.strip(" .").lower()
    if key in _SUBJECT_ALIASES:
        return _SUBJECT_ALIASES[key]
    return raw.strip(" .").title()


def _extract_subject(text: str) -> Optional[str]:
    m = _SUBJECT_LABEL_RE.search(text)
    if m:
        return _normalize_subject(m.group(1)[:80])
    m = _KNOWN_SUBJECTS_RE.search(text)
    if m:
        return _normalize_subject(m.group(1))
    return None


def _extract_chapter(text: str) -> Optional[str]:
    m = _CHAPTER_RE.search(text)
    return m.group(1).strip(" .")[:120] if m else None


def classify_pattern(text: str) -> Optional[Classification]:
    t = text.lower()

    if re.search(r"daily class up\w*|\bdcu\b|sharing the time\s*table for", t):
        return Classification("Daily Class Update", "pattern", 0.9)

    if (re.search(r"\bpfa\b", t) and ("notes" in t or " of " in t)) or _SUBJECT_MATERIAL_RE.search(t):
        return Classification(
            "Subject Notes", "pattern", 0.85,
            subject=_extract_subject(text), chapter=_extract_chapter(text),
        )

    if re.search(
        r"\bclass test\b|\bpractical exam\b|\bhalf\s*yearly exam|\bperiodic test|\bfinal exam|"
        r"details of the test\b",
        t,
    ):
        return Classification(
            "Exam/Test", "pattern", 0.9,
            subject=_extract_subject(text), chapter=_extract_chapter(text),
        )

    if _SCHOOL_EVENT_RE.search(t):
        return Classification("School Event", "pattern", 0.8)

    if "holiday" in t or "school shall remain closed" in t or "school will remain closed" in t:
        return Classification("Holiday", "pattern", 0.85)

    if "facebook post" in t or "celebration" in t:
        return Classification("Event/Celebration", "pattern", 0.85)

    return None


def classify(text: str) -> Classification:
    result = classify_pattern(text)
    if result is not None:
        return result
    return Classification(
        "General/Other", "default", 0.5,
        subject=_extract_subject(text), chapter=_extract_chapter(text),
    )
