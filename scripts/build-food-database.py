#!/usr/bin/env python3
"""Build the local food index from Livsmedelsverket's official XLSX export.

The output is a compact, checked-in runtime asset. The app never calls the
upstream API or export endpoint while a user logs food.
"""

from __future__ import annotations

import io
import json
import re
import urllib.request
import zipfile
from pathlib import Path
from xml.etree import ElementTree


EXPORT_URL = "https://soknaringsinnehall.livsmedelsverket.se/Spara/HamtaHelaDatabasen"
SOURCE_URL = "https://soknaringsinnehall.livsmedelsverket.se/"
OUTPUT = Path(__file__).resolve().parents[1] / "app" / "data" / "swedish-foods.json"
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"


def column_index(reference: str) -> int:
    letters = re.match(r"[A-Z]+", reference)
    if not letters:
        raise ValueError(f"Ogiltig cellreferens: {reference}")
    value = 0
    for character in letters.group(0):
        value = value * 26 + ord(character) - 64
    return value - 1


def shared_strings(archive: zipfile.ZipFile) -> list[str]:
    try:
        root = ElementTree.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    return ["".join(node.text or "" for node in item.iter(f"{NS}t")) for item in root]


def cell_value(cell: ElementTree.Element, strings: list[str]):
    kind = cell.attrib.get("t")
    if kind == "inlineStr":
        return "".join(node.text or "" for node in cell.iter(f"{NS}t"))
    value = cell.find(f"{NS}v")
    if value is None or value.text is None:
        return None
    if kind == "s":
        return strings[int(value.text)]
    try:
        number = float(value.text)
        return int(number) if number.is_integer() else number
    except ValueError:
        return value.text


def worksheet_rows(workbook: bytes) -> list[list[object]]:
    with zipfile.ZipFile(io.BytesIO(workbook)) as archive:
        strings = shared_strings(archive)
        root = ElementTree.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        rows: list[list[object]] = []
        for row in root.iter(f"{NS}row"):
            values: list[object] = []
            for cell in row.findall(f"{NS}c"):
                index = column_index(cell.attrib.get("r", ""))
                while len(values) <= index:
                    values.append(None)
                values[index] = cell_value(cell, strings)
            rows.append(values)
        return rows


def main() -> None:
    request = urllib.request.Request(EXPORT_URL, data=b"", method="POST")
    request.add_header("User-Agent", "Joxo-Training food database builder")
    with urllib.request.urlopen(request, timeout=120) as response:
        workbook = response.read()

    rows = worksheet_rows(workbook)
    if len(rows) < 2_500:
        raise RuntimeError(f"Exporten innehöll oväntat få rader: {len(rows)}")

    title = str(rows[0][0])
    version_match = re.search(r"(\d{4}-\d{2}-\d{2})", title)
    if not version_match:
        raise RuntimeError(f"Kunde inte läsa databasversion från: {title}")

    headers = {str(value): index for index, value in enumerate(rows[2]) if value is not None}
    required = {
        "Livsmedelsnamn",
        "Livsmedelsnummer",
        "Gruppering",
        "Energi (kcal)",
        "Fett, totalt (g)",
        "Protein (g)",
        "Kolhydrater, tillgängliga (g)",
        "Fiber (g)",
    }
    missing = required - headers.keys()
    if missing:
        raise RuntimeError(f"Exporten saknar kolumner: {', '.join(sorted(missing))}")

    def value(row: list[object], heading: str):
        index = headers[heading]
        return row[index] if index < len(row) else None

    foods = []
    for row in rows[3:]:
        name = value(row, "Livsmedelsnamn")
        food_id = value(row, "Livsmedelsnummer")
        if not isinstance(name, str) or not isinstance(food_id, (int, float)):
            continue
        foods.append(
            {
                "id": int(food_id),
                "name": name,
                "group": value(row, "Gruppering"),
                "kcal": value(row, "Energi (kcal)"),
                "protein": value(row, "Protein (g)"),
                "carbs": value(row, "Kolhydrater, tillgängliga (g)"),
                "fat": value(row, "Fett, totalt (g)"),
                "fiber": value(row, "Fiber (g)"),
            }
        )

    if len(foods) < 2_500:
        raise RuntimeError(f"Endast {len(foods)} livsmedel kunde läsas")

    payload = {
        "source": "Livsmedelsverkets Livsmedelsdatabas",
        "version": version_match.group(1),
        "basis": "100 g livsmedel",
        "license": "CC BY 4.0",
        "sourceUrl": SOURCE_URL,
        "count": len(foods),
        "foods": foods,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    print(f"Skrev {len(foods)} livsmedel från version {payload['version']} till {OUTPUT}")


if __name__ == "__main__":
    main()
