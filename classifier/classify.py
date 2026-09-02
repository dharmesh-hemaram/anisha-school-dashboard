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
# Chapter number + name, e.g. "chapter 4: Let's learn to code with blockly"
# or "Chapter:2 Meet Handware and Software" -- name is on the same line.
_CHAPTER_NUM_NAME_RE = re.compile(r"(?:chapter|topic|lesson)\s*(?:no\.?)?\s*[:\-]?\s*(\d+)\s*[:.\-]?\s*([^\n]*)", re.I)

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
    "art and craft": "Art & Craft",
    "art & craft": "Art & Craft",
    "life skills": "Life Skills",
    "lifeskill": "Life Skills",
    "lifeskills": "Life Skills",
    "speech and drama": "Speech & Drama",
    "speech & drama": "Speech & Drama",
    "reading program": "Reading Program",
    "reading programme": "Reading Program",
    "martial arts": "Martial Arts",
    "marital arts": "Martial Arts",  # common typo seen in real notices
    # Robotics isn't its own paper or period at this school -- the exam
    # portion table covers it under the same Computer Science slot
    # ("Coding: ... Robotics: ..."), and it never appears as its own
    # period in the daily timetable either. Folding it in here keeps a
    # Robotics notice's notes/worksheets on the same Computer Science
    # card everywhere (Exam tab, Notes tab, Daily Class Update periods)
    # instead of splintering off into an orphaned one-subject card.
    "robotics": "Computer Science",
}

# Base subject names -- a raw value that starts with one of these (after
# stripping parenthetical qualifiers like "(Textbook)") collapses to the
# base, so "English Grammer"/"English Literature"/"Hindi Madhushree"/
# "Hindi Vyakaran" all land under one bucket instead of fragmenting.
_BASE_SUBJECTS = [
    "Computer Science", "Social Studies", "English", "Hindi", "Marathi",
    "Science", "Maths", "EVS", "GK",
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
#
# The co-curricular subjects below (Leadership, Art & Craft, Life Skills,
# Assembly, Sports, Dance, Skating, Speech & Drama, Music, Reading Program,
# Martial Arts) never carry an exam/worksheet, so they only ever surface
# through Daily Class Update periods -- without them here those periods
# rendered as unlabeled text instead of a bolded subject like every other
# period.
_KNOWN_SUBJECTS = sorted(
    [
        "Computer Science", "Social Studies", "SST", "Mathematics", "Maths", "Math",
        "Science", "Hindi", "English", "Marathi", "EVS", "Robotics", "GK",
        "Leadership", "Art and Craft", "Art & Craft", "Life Skills", "Lifeskill",
        "Assembly", "Sports", "Dance", "Skating", "Speech and Drama",
        "Speech & Drama", "Music", "Reading Program", "Reading Programme",
        "Martial Arts", "Marital Arts",
    ],
    key=len, reverse=True,
)
_KNOWN_SUBJECTS_RE = re.compile(r"\b(" + "|".join(re.escape(s) for s in _KNOWN_SUBJECTS) + r")\b", re.I)

_SUBJECT_MATERIAL_RE = re.compile(r"\b(worksheet|revision|answer\s*key|culmination)\b", re.I)

# Names an exam cycle when a notice explicitly mentions one -- used to tag
# worksheets/revisions with which exam they're prep for, since numbering
# resets per cycle (PT-1 has a "Revision No. 1", so does Half Yearly).
EXAM_CYCLE_PATTERNS = [
    (re.compile(r"pt\s*-?\s*1\b|periodic\s*test\s*[-–]?\s*1\b", re.I), "PT-1"),
    (re.compile(r"pt\s*-?\s*2\b|periodic\s*test\s*[-–]?\s*2\b", re.I), "PT-2"),
    (re.compile(r"half\s*yearly", re.I), "Half Yearly"),
    (re.compile(r"final\s*exam|annual\s*exam", re.I), "Final Exam"),
    (re.compile(r"unit\s*test", re.I), "Unit Test"),
]


def extract_exam_cycle_label(text: str) -> Optional[str]:
    for pattern, label in EXAM_CYCLE_PATTERNS:
        if pattern.search(text):
            return label
    return None
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
# "the Eid-e-Milad holiday, which was earlier scheduled for 25th August
# 2026, has been rescheduled to 26th August 2026" -- a plain .search() for
# the first date in the text grabs the outdated original date instead of
# the corrected one. Scoped to "holiday ... rescheduled to <date>" so it
# doesn't also fire on a Holiday notice that happens to reschedule an
# unrelated exam in the same breath (the holiday's own date there is the
# first-mentioned one, which the fallback below already gets right).
_HOLIDAY_RESCHEDULE_RE = re.compile(
    r"holiday[^.]*?reschedul\w*\s+to\s+(\d{1,2})(?:st|nd|rd|th)?\s+(" + "|".join(_MONTHS) + r")\s+(\d{4})",
    re.I,
)


def _extract_event_date(text: str) -> Optional[str]:
    m = _HOLIDAY_RESCHEDULE_RE.search(text)
    if m:
        d, month_name, y = m.groups()
        try:
            return date(int(y), _MONTHS.index(month_name.lower()) + 1, int(d)).isoformat()
        except ValueError:
            pass
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
    chapter_number: Optional[int] = None
    event_date_iso: Optional[str] = None
    material_type: Optional[str] = None  # "Notes" | "Worksheet" | "Answer Key" -- Subject Notes only
    worksheet_numbers: list = None  # e.g. [3] or [1, 2, 3, 4] for a batch notice -- see _extract_worksheet_numbers


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
    m = _CHAPTER_NUM_NAME_RE.search(text)
    if m:
        name = m.group(2).strip(" .:-")
        if not name:
            # Some notices put the name on the line after "chapter no:N"
            # instead of the same line, e.g. "Topic: chapter no:1\nMouse
            # and keyboard".
            rest = text[m.end():].lstrip("\n")
            name = rest.split("\n", 1)[0].strip()
        if name:
            return name[:120]
    m = _CHAPTER_RE.search(text)
    return m.group(1).strip(" .")[:120] if m else None


def _extract_chapter_number(text: str) -> Optional[int]:
    m = _CHAPTER_NUM_NAME_RE.search(text)
    return int(m.group(1)) if m else None


_FUTURE_ANSWER_KEY_RE = re.compile(r"answer\s*key\s+will\s+be", re.I)
_WORKSHEET_NUMBER_RE = re.compile(r"(?:worksheet|revision)[^\d\n]{0,15}?(\d+)", re.I)
# A notice can cover a batch rather than a single number -- real examples:
# "Revision-1,2,3,4", "Revision 1 to 4", "Revision No. 1&2", "Revision
# -3(cw) and 4(hw)". After the first number, _extract_worksheet_numbers
# keeps matching one more "<connector> <optional short annotation>
# <number>" in a row; "to" expands to the full inclusive range, everything
# else (",", "&", "and", "-") just appends that one more number. The digit
# must sit immediately after the connector (only whitespace/a short "(...)"
# in between), so this never reaches into an unrelated number elsewhere in
# the notice.
_ADDITIONAL_NUMBER_RE = re.compile(r"\s*(?:\([^)]{0,10}\))?\s*(,|&|and|to|-)\s*(\d+)", re.I)


def _extract_material_type(t_lower: str) -> str:
    # "the answer key will be shared after 3 days" is a worksheet notice
    # forward-referencing an answer key that isn't attached yet -- not an
    # actual answer key delivery. Check that before the generic keyword.
    has_worksheet_word = re.search(r"\bworksheet\b", t_lower) is not None
    if _FUTURE_ANSWER_KEY_RE.search(t_lower):
        return "Worksheet" if has_worksheet_word else "Revision"
    if re.search(r"answer\s*key", t_lower):
        return "Answer Key"
    # "Worksheet" vs "Revision" matters beyond labeling: real answer-key
    # notices always say "answer key for worksheet no. N", never "...for
    # revision no. N" -- Revision is a separate numbered series that
    # doesn't get its own answer key, so it must never enter answer-key
    # pairing (a same-numbered Revision would otherwise steal an answer
    # key from the Worksheet it actually belongs to).
    if has_worksheet_word:
        return "Worksheet"
    if re.search(r"\brevision\b|culmination", t_lower):
        return "Revision"
    return "Notes"


def _extract_worksheet_numbers(text: str) -> Optional[list]:
    m = _WORKSHEET_NUMBER_RE.search(text)
    if not m:
        return None
    numbers = [int(m.group(1))]
    pos = m.end()
    while True:
        m2 = _ADDITIONAL_NUMBER_RE.match(text, pos)
        if not m2:
            break
        connector, num = m2.group(1).lower(), int(m2.group(2))
        if connector == "to":
            numbers.extend(range(numbers[-1] + 1, num + 1))
        else:
            numbers.append(num)
        pos = m2.end()
    return numbers


def classify_pattern(text: str) -> Optional[Classification]:
    t = text.lower()

    if re.search(r"daily class up\w*|\bdcu\b|sharing the time\s*table for", t):
        # A timetable notice names the day it's *for* ("...for 7th April
        # 2026, Tuesday") which is usually tomorrow, not today -- extract it
        # so the dashboard can tell whether that timetable is for today.
        # A plain recap has no such date phrase, so this is a no-op for it.
        return Classification("Daily Class Update", "pattern", 0.9, event_date_iso=_extract_event_date(text))

    if (re.search(r"\bpfa\b", t) and ("notes" in t or " of " in t)) or _SUBJECT_MATERIAL_RE.search(t):
        return Classification(
            "Subject Notes", "pattern", 0.85,
            subject=_extract_subject(text), chapter=_extract_chapter(text),
            chapter_number=_extract_chapter_number(text),
            material_type=_extract_material_type(t),
            worksheet_numbers=_extract_worksheet_numbers(text),
        )

    # "Portion" notices (the syllabus scope for an upcoming exam, e.g. "PFA
    # the PT 1 portion sheet", "Sharing the Portion for Half Yearly Exams")
    # are a distinct kind of Exam/Test notice -- checked ahead of the
    # exam-keyword rule below so a portion notice that also happens to name
    # the exam (e.g. "...for Half Yearly Exams") still gets tagged Portion
    # rather than falling into the generic exam-schedule bucket.
    if re.search(r"\bportion\b", t) and "reschedul" not in t:
        return Classification(
            "Exam/Test", "pattern", 0.85,
            material_type="Portion",
            event_date_iso=_extract_event_date(text),
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
    # General/Other is the true catch-all -- nothing here confirms the
    # notice is even about a curriculum subject at all, so running subject
    # extraction on arbitrary text is pure guesswork with no validation:
    # a "Subject: X" email-style header (X being anything -- "Availability
    # of Winter Jackets") gets taken at face value, and the known-subjects
    # scan can match a co-curricular word embedded in an unrelated proper
    # noun ("Leadership Advisory Council"). Subject Notes and the Exam/Test
    # class-test branch above already call this deliberately, in contexts
    # that confirm the notice is genuinely about a subject -- General/Other
    # never does.
    return Classification("General/Other", "default", 0.5)
