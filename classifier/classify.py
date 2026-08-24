"""
Notice classifier: keyword/pattern rules first (fast, free, auditable),
Claude API fallback for anything that doesn't confidently match.

Categories derived from ~1,400 real notices on the SNBP Wagholi ERP
(same 6 categories used in the notice_board_final dashboard prototype).
"""

import logging
import os
import re
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)

CATEGORIES = [
    "Daily Class Update",
    "Subject Notes",
    "Exam/Test",
    "Holiday",
    "Event/Celebration",
    "General/Other",
]

_SUBJECT_RE = re.compile(r"subject\s*[:\-]\s*([^\n]+)", re.I)
_CHAPTER_RE = re.compile(r"(?:chapter|topic|lesson(?:\s*no\.?)?)\s*[:\-]?\s*([^\n]+)", re.I)


@dataclass
class Classification:
    category: str
    method: str  # "pattern" or "ai"
    confidence: float
    subject: Optional[str] = None
    chapter: Optional[str] = None


def _extract_subject(text: str) -> Optional[str]:
    m = _SUBJECT_RE.search(text)
    return m.group(1).strip(" .")[:80] if m else None


def _extract_chapter(text: str) -> Optional[str]:
    m = _CHAPTER_RE.search(text)
    return m.group(1).strip(" .")[:120] if m else None


def classify_pattern(text: str) -> Optional[Classification]:
    t = text.lower()

    if "daily class update" in t:
        return Classification("Daily Class Update", "pattern", 0.95)

    if re.search(r"\bpfa\b", t) and ("notes" in t or " of " in t):
        return Classification(
            "Subject Notes", "pattern", 0.9,
            subject=_extract_subject(text), chapter=_extract_chapter(text),
        )

    if re.search(r"\bclass test\b|\bpractical exam\b|\bhalf\s*yearly exam", t):
        return Classification(
            "Exam/Test", "pattern", 0.9,
            subject=_extract_subject(text), chapter=_extract_chapter(text),
        )

    if "holiday" in t:
        return Classification("Holiday", "pattern", 0.9)

    if "facebook post" in t or "celebration" in t:
        return Classification("Event/Celebration", "pattern", 0.85)

    return None


def classify_ai(text: str) -> Classification:
    import anthropic

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    prompt = (
        "Classify this school notice into exactly one of these categories:\n"
        + "\n".join(f"- {c}" for c in CATEGORIES)
        + "\n\nRespond with only the category name, nothing else.\n\nNotice:\n"
        + text[:2000]
    )
    response = client.messages.create(
        model="claude-opus-5",
        max_tokens=20,
        output_config={"effort": "low"},
        messages=[{"role": "user", "content": prompt}],
    )
    category = next((b.text.strip() for b in response.content if b.type == "text"), "")
    if category not in CATEGORIES:
        logger.warning("AI returned unrecognized category %r, defaulting to General/Other", category)
        category = "General/Other"
    return Classification(category, "ai", 0.6, subject=_extract_subject(text), chapter=_extract_chapter(text))


def classify(text: str) -> Classification:
    result = classify_pattern(text)
    if result is not None:
        return result
    try:
        return classify_ai(text)
    except Exception:
        logger.exception("AI classification failed, defaulting to General/Other")
        return Classification("General/Other", "pattern", 0.3)
