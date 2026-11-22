"""Date parsing and month arithmetic for experience. Pure Python, no LLM.

Months are counted inclusively: "Jan 2024 - Mar 2024" is 3 months.
A year without a month ("2019 - 2021") uses July for both ends, so it counts the
middle of each year instead of assuming the longest possible span.
"""
import re
from datetime import date

MONTHS = {
    "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3, "apr": 4, "april": 4,
    "may": 5, "jun": 6, "june": 6, "jul": 7, "july": 7, "aug": 8, "august": 8,
    "sep": 9, "sept": 9, "september": 9, "oct": 10, "october": 10, "nov": 11, "november": 11,
    "dec": 12, "december": 12,
}
PRESENT = {"present", "current", "currently", "now", "today", "ongoing", "till date", "to date", "till now", "date"}
YEAR_ONLY_MONTH = 7
_EARLIEST_YEAR = 1950

MonthIndex = int  # year * 12 + (month - 1)


def to_index(year: int, month: int) -> MonthIndex:
    return year * 12 + (month - 1)


def today_index(today: date | None = None) -> MonthIndex:
    today = today or date.today()
    return to_index(today.year, today.month)


def parse_month(value, today: date | None = None) -> MonthIndex | None:
    """'2024-01', '2024/1', '01/2024', 'Jan 2024', 'January, 2024', '2024', 'present' -> month index."""
    if value is None:
        return None
    text = str(value).strip().lower().replace("’", "'")
    if not text:
        return None
    if text in PRESENT:
        return today_index(today)

    year = month = None
    m = re.fullmatch(r"(\d{4})\s*[-/.]\s*(\d{1,2})(?:\s*[-/.]\s*\d{1,2})?", text)          # 2024-01(-15)
    if m:
        year, month = int(m.group(1)), int(m.group(2))
    if year is None:
        m = re.fullmatch(r"(\d{1,2})\s*[-/.]\s*(\d{4})", text)                                # 01/2024
        if m:
            month, year = int(m.group(1)), int(m.group(2))
    if year is None:
        m = re.fullmatch(r"([a-z]+)\.?,?\s*'?(\d{4}|\d{2})", text)                            # Jan 2024 / Jan '24
        if m and m.group(1) in MONTHS:
            month = MONTHS[m.group(1)]
            year = int(m.group(2))
            year = year + 2000 if year < 100 else year
    if year is None:
        m = re.fullmatch(r"(\d{4})", text)                                                     # 2024
        if m:
            year, month = int(m.group(1)), YEAR_ONLY_MONTH

    if year is None or not (1 <= (month or 0) <= 12):
        return None
    index = to_index(year, month)
    if year < _EARLIEST_YEAR or index > today_index(today):
        return None
    return index


def months_between(start: MonthIndex, end: MonthIndex) -> int:
    return end - start + 1


def merged_months(intervals: list[tuple[MonthIndex, MonthIndex]]) -> int:
    """Total months covered, counting overlapping periods once."""
    total = 0
    current = None
    for start, end in sorted(intervals):
        if current is None or start > current[1] + 1:
            if current:
                total += months_between(*current)
            current = [start, end]
        else:
            current[1] = max(current[1], end)
    if current:
        total += months_between(*current)
    return total


def format_months(months: int | None) -> str:
    """Same wording as the frontend's formatDuration()."""
    if months is None:
        return "unknown"
    years, rest = divmod(int(months), 12)
    parts = []
    if years:
        parts.append(f"{years} {'year' if years == 1 else 'years'}")
    if rest or not years:
        parts.append(f"{rest} {'month' if rest == 1 else 'months'}")
    return ", ".join(parts)
