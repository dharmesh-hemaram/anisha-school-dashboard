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
from datetime import date
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
    "evs": "EVS",
}

# Base subject names -- a raw value that starts with one of these (after
# stripping parenthetical qualifiers like "(Textbook)") collapses to the
# base, so "English Grammer"/"English Literature"/"Hindi Madhushree"/
# "Hindi Vyakaran" all land under one bucket instead of fragmenting.
_BASE_SUBJECTS = [
    "Computer Science", "Social Studies", "English", "Hindi", "Marathi",
    "Science", "Maths", "EVS", "Robotics", "GK",
]

# Some notices label the subject in Devanagari script instead of English.
_DEVANAGARI_SUBJECTS = {
    "मराठी": "Marathi",
    "हिंदी": "Hindi",
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

# A notice's *posted* date and the date of the thing it's about (a test, a
# PTM, an activity) are frequently different -- e.g. posted 23rd, event on
# the 25th. These extract the event date out of the body text so the
# dashboard can count down to the right day instead of the posting date.
_MONTHS = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
]
_NUMERIC_EVENT_DATE_RE = re.compile(r"date\s*[:\-]?\s*(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})", re.I)
_TEXT_EVENT_DATE_RE = re.compile(
    r"(\d{1,2})(?:st|nd|rd|th)?\s+(" + "|".join(_MONTHS) + r")\s+(\d{4})", re.I,
)


def _extract_event_date(text: str) -> Optional[str]:
    m = _NUMERIC_EVENT_DATE_RE.search(text)
    if m:
        d, mo, y = (int(g) for g in m.groups())
        y = y + 2000 if y < 100 else y
        try:
            return date(y, mo, d).isoformat()
        except ValueError:
            pass
    m = _TEXT_EVENT_DATE_RE.search(text)
    if m:
        d, month_name, y = m.groups()
        try:
            return date(int(y), _MONTHS.index(month_name.lower()) + 1, int(d)).isoformat()
        except ValueError:
            pass
    return None


@dataclass
class Classification:
    category: str
    method: str  # "pattern" or "default"
    confidence: float
    subject: Optional[str] = None
    chapter: Optional[str] = None
    event_date_iso: Optional[str] = None
    material_type: Optional[str] = None  # "Notes" | "Worksheet" | "Answer Key" -- Subject Notes only


def _normalize_subject(raw: str) -> str:
    cleaned = re.sub(r"\(.*?\)", "", raw).strip(" .:-")
    key = cleaned.lower()
    if key in _SUBJECT_ALIASES:
        return _SUBJECT_ALIASES[key]
    for devanagari, name in _DEVANAGARI_SUBJECTS.items():
        if devanagari in cleaned:
            return name
    title = cleaned.title()
    for base in _BASE_SUBJECTS:
        if title.startswith(base):
            return base
    return title


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


def _extract_material_type(t_lower: str) -> str:
    if re.search(r"answer\s*key", t_lower):
        return "Answer Key"
    if re.search(r"\bworksheet\b|\brevision\b|culmination", t_lower):
        return "Worksheet"
    return "Notes"


def classify_pattern(text: str) -> Optional[Classification]:
    t = text.lower()

    if re.search(r"daily class up\w*|\bdcu\b|sharing the time\s*table for", t):
        return Classification("Daily Class Update", "pattern", 0.9)

    if (re.search(r"\bpfa\b", t) and ("notes" in t or " of " in t)) or _SUBJECT_MATERIAL_RE.search(t):
        return Classification(
            "Subject Notes", "pattern", 0.85,
            subject=_extract_subject(text), chapter=_extract_chapter(text),
            material_type=_extract_material_type(t),
        )

    if re.search(
        r"\bclass test\b|\bpractical exam\b|\bhalf\s*yearly exam|\bperiodic test|\bfinal exam|"
        r"details of the test\b",
        t,
    ):
        return Classification(
            "Exam/Test", "pattern", 0.9,
            subject=_extract_subject(text), chapter=_extract_chapter(text),
            event_date_iso=_extract_event_date(text),
        )

    if _SCHOOL_EVENT_RE.search(t):
        return Classification("School Event", "pattern", 0.8, event_date_iso=_extract_event_date(text))

    if "holiday" in t or "school shall remain closed" in t or "school will remain closed" in t:
        return Classification("Holiday", "pattern", 0.85, event_date_iso=_extract_event_date(text))

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
