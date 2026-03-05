#!/usr/bin/env python3
"""Parse an Apple Numbers workout sheet into app-compatible workout data.

Usage examples:
  python3 scripts/parse_numbers_workout.py /path/workouts.numbers --week 1
  python3 scripts/parse_numbers_workout.py /path/workouts.numbers --week 2 --format ts-array

The script supports multiple weeks through --week by reading the right
week-block columns in each Numbers table.
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any

try:
    from numbers_parser import Document
except ModuleNotFoundError as exc:
    raise SystemExit(
        "Missing dependency: numbers-parser.\n"
        "Install it with:\n"
        "  python3 -m pip install numbers-parser"
    ) from exc


DEFAULT_FOCUS_BY_DAY = {
    1: "Petto / Dorso / Gambe",
    2: "Dorso / Petto / Femorali",
    3: "Spalle / Braccia / Polpacci",
    4: "Petto Alto / Braccia",
}


def _to_ascii_quotes(text: str) -> str:
    return (
        text.replace("’", "'")
        .replace("‘", "'")
        .replace("“", '"')
        .replace("”", '"')
        .replace("′", "'")
        .replace("″", '"')
    )


def _normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _normalize_text(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, float):
        if value.is_integer():
            return str(int(value))
        return str(value)

    text = _normalize_whitespace(_to_ascii_quotes(str(value)))
    return text or None


def _normalize_reps(value: Any) -> str | None:
    text = _normalize_text(value)
    if not text:
        return None
    return re.sub(r"\s*[\\/]\s*", "-", text)


def _normalize_rest(value: Any) -> str | None:
    text = _normalize_text(value)
    if not text:
        return None
    return text.replace(" ", "").replace("''", '"')


def _normalize_weight(value: Any) -> int | float | str | None:
    text = _normalize_text(value)
    if not text:
        return None

    numeric = text.replace(",", ".")
    if re.fullmatch(r"-?\d+", numeric):
        return int(numeric)
    if re.fullmatch(r"-?\d+\.\d+", numeric):
        return float(numeric)
    return text


def _parse_series(value: Any) -> int | None:
    if isinstance(value, float):
        return int(round(value))
    text = _normalize_text(value)
    if not text:
        return None
    match = re.match(r"\d+", text)
    return int(match.group(0)) if match else None


def _is_main_workout_table(table: Any) -> bool:
    def cell(row: int, col: int) -> Any:
        return table.cell(row, col).value

    return (
        table.num_cols >= 6
        and _normalize_text(cell(1, 0)) == "ESERCIZIO"
        and _normalize_text(cell(1, 1)) == "SERIE"
        and _normalize_text(cell(1, 2)) == "RIPETIZIONI"
    )


def _is_post_workout_table(table: Any) -> bool:
    return _normalize_text(table.cell(0, 0).value) == "POST-WORKOUT"


def _main_day_number(table: Any, fallback: int) -> int:
    raw = table.cell(0, 0).value
    if isinstance(raw, float):
        return int(round(raw))
    text = _normalize_text(raw)
    if text and text.isdigit():
        return int(text)
    return fallback


_POST_DAY_FROM_NAME = re.compile(r"-3(?:-(\d+))?$")


def _post_day_number(table: Any, fallback: int) -> int:
    match = _POST_DAY_FROM_NAME.search(table.name)
    if not match:
        return fallback
    suffix = match.group(1)
    if suffix is None:
        return 1
    return int(suffix) + 1


def _build_reps_pattern(entries: list[dict[str, Any]]) -> str:
    if not entries:
        return ""
    if len(entries) == 1:
        return entries[0]["reps"] or ""

    parts: list[str] = []
    for entry in entries:
        reps = entry["reps"]
        if not reps:
            continue
        repeats = entry["series"] or 1
        reps_lower = reps.lower()
        complex_scheme = "-" in reps or "x" in reps_lower or "iso" in reps_lower
        if repeats > 1 and not complex_scheme:
            parts.extend([reps] * repeats)
        else:
            parts.append(reps)
    return "-".join(parts)


def _collect_main_entries(
    table: Any,
    start_row: int,
    end_row: int,
    week: int,
) -> list[dict[str, Any]]:
    if week < 1:
        return []

    # Week block: [SERIE, RIPETIZIONI, PAUSA, CARICO, NOTE]
    base_col = 1 + (week - 1) * 5
    series_col = base_col
    reps_col = base_col + 1
    rest_col = base_col + 2
    load_col = base_col + 3
    note_col = base_col + 4

    entries: list[dict[str, Any]] = []
    for row in range(start_row, end_row):
        series = _parse_series(table.cell(row, series_col).value)
        reps = _normalize_reps(table.cell(row, reps_col).value)
        rest = _normalize_rest(table.cell(row, rest_col).value)
        load = _normalize_weight(table.cell(row, load_col).value)
        note = _normalize_text(table.cell(row, note_col).value)
        if any([series, reps, rest, load, note]):
            entries.append(
                {
                    "series": series,
                    "reps": reps,
                    "rest": rest,
                    "load": load,
                    "note": note,
                }
            )
    return entries


def _parse_main_exercise_block(
    table: Any,
    start_row: int,
    end_row: int,
    week: int,
    fallback_week: int | None = None,
) -> dict[str, Any] | None:
    exercise_name = _normalize_text(table.cell(start_row, 0).value)
    if not exercise_name:
        return None

    entries = _collect_main_entries(table, start_row, end_row, week)
    if not entries and fallback_week:
        entries = _collect_main_entries(table, start_row, end_row, fallback_week)

    if not entries:
        return None

    sets = sum((entry["series"] or (1 if entry["reps"] else 0)) for entry in entries)
    if sets <= 0:
        sets = 1

    reps_pattern = _build_reps_pattern(entries)
    rest = next((entry["rest"] for entry in entries if entry["rest"]), "1'")
    note = next((entry["note"] for entry in entries if entry["note"]), None)
    previous_entry = next((entry for entry in reversed(entries) if entry["load"] is not None), None)

    exercise: dict[str, Any] = {
        "name": exercise_name,
        "sets": int(sets),
        "reps": reps_pattern or "",
        "rest": rest,
    }
    if previous_entry:
        exercise["previous"] = {
            "weight": previous_entry["load"],
            "reps": previous_entry["reps"] or "",
            "date": f"Settimana {week}",
        }
    if note:
        exercise["trainerNote"] = note
    return exercise


def _parse_main_day_table(
    table: Any,
    week: int,
    fallback_week: int | None = None,
) -> list[dict[str, Any]]:
    exercises: list[dict[str, Any]] = []
    row = 2
    while row < table.num_rows:
        exercise_name = _normalize_text(table.cell(row, 0).value)
        if not exercise_name:
            row += 1
            continue

        end_row = row + 1
        while end_row < table.num_rows:
            if _normalize_text(table.cell(end_row, 0).value):
                break
            end_row += 1

        exercise = _parse_main_exercise_block(
            table,
            row,
            end_row,
            week,
            fallback_week=fallback_week,
        )
        if exercise:
            exercises.append(exercise)
        row = end_row

    return exercises


def _collect_post_row_values(
    table: Any,
    row: int,
    week: int,
) -> tuple[int | None, str | None, str | None]:
    if week < 1:
        return (None, None, None)

    # Week block: [SERIE, "SERIE X REPS - PAUSA", NOTE]
    base_col = 1 + (week - 1) * 3
    series = _parse_series(table.cell(row, base_col).value)
    scheme = _normalize_text(table.cell(row, base_col + 1).value)
    note = _normalize_text(table.cell(row, base_col + 2).value)
    return (series, scheme, note)


def _parse_post_workout_table(
    table: Any,
    week: int,
    fallback_week: int | None = None,
) -> list[dict[str, Any]]:
    exercises: list[dict[str, Any]] = []

    for row in range(2, table.num_rows):
        exercise_name = _normalize_text(table.cell(row, 0).value)
        if not exercise_name:
            continue

        series, scheme, note = _collect_post_row_values(table, row, week)
        if not any([series, scheme, note]) and fallback_week:
            series, scheme, note = _collect_post_row_values(table, row, fallback_week)
        if not any([series, scheme, note]):
            continue

        sets = series or 1

        reps = ""
        rest = "1'"
        if scheme:
            parts = re.split(r"\s*-\s*", scheme, maxsplit=1)
            reps = _normalize_reps(parts[0]) or ""
            if len(parts) > 1 and parts[1]:
                rest = _normalize_rest(parts[1]) or rest

        exercise: dict[str, Any] = {
            "name": exercise_name,
            "sets": int(sets),
            "reps": reps,
            "rest": rest,
        }
        if note:
            exercise["trainerNote"] = note
        exercises.append(exercise)

    return exercises


def parse_numbers_workout(
    numbers_path: Path,
    week: int,
    fallback_week: int | None = None,
    focus_by_day: dict[int, str] | None = None,
) -> list[dict[str, Any]]:
    if week < 1:
        raise ValueError("week must be >= 1")
    if fallback_week is not None and fallback_week < 1:
        raise ValueError("fallback_week must be >= 1")

    document = Document(str(numbers_path))
    sheet = document.sheets[0]

    focus_map = focus_by_day or DEFAULT_FOCUS_BY_DAY

    main_tables = [table for table in sheet.tables if _is_main_workout_table(table)]
    post_tables = [table for table in sheet.tables if _is_post_workout_table(table)]

    main_with_day = [
        (_main_day_number(table, fallback=index), table)
        for index, table in enumerate(main_tables, start=1)
    ]
    main_with_day.sort(key=lambda item: item[0])

    post_with_day = [
        (_post_day_number(table, fallback=index), table)
        for index, table in enumerate(post_tables, start=1)
    ]

    workout_days: list[dict[str, Any]] = []
    for day_number, table in main_with_day:
        exercises = _parse_main_day_table(
            table,
            week=week,
            fallback_week=fallback_week,
        )
        for post_day, post_table in post_with_day:
            if post_day == day_number:
                exercises.extend(
                    _parse_post_workout_table(
                        post_table,
                        week=week,
                        fallback_week=fallback_week,
                    )
                )

        for index, exercise in enumerate(exercises):
            exercise["id"] = f"{day_number}{chr(ord('a') + index)}"

        workout_days.append(
            {
                "id": day_number,
                "name": f"Giorno {day_number}",
                "focus": focus_map.get(day_number, "Scheda personalizzata"),
                "exercises": exercises,
            }
        )

    return workout_days


def _to_ts_array_literal(data: list[dict[str, Any]]) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("numbers_file", type=Path, help="Path to the .numbers file")
    parser.add_argument(
        "--week",
        type=int,
        default=1,
        help="Week number to extract (1-based, default: 1)",
    )
    parser.add_argument(
        "--fallback-week",
        type=int,
        default=None,
        help="Optional fallback week when selected week cells are empty",
    )
    parser.add_argument(
        "--format",
        choices=["json", "ts-array"],
        default="json",
        help="Output format (default: json)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Optional output file path (stdout if omitted)",
    )
    args = parser.parse_args()

    data = parse_numbers_workout(
        args.numbers_file,
        week=args.week,
        fallback_week=args.fallback_week,
    )

    if args.format == "json":
        rendered = json.dumps(data, ensure_ascii=False, indent=2)
    else:
        rendered = _to_ts_array_literal(data)

    if args.output:
        args.output.write_text(f"{rendered}\n", encoding="utf-8")
    else:
        print(rendered)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
