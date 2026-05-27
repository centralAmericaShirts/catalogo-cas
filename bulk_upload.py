#!/usr/bin/env python3
"""
Bulk upload products to the CAS Google Apps Script endpoint.

Expected default inputs:
  - inputUpload, inputUpload.csv, or inputUpload.tsv
  - inputImages/

Required input columns:
  imageName, Equipo, Año, Precio, Precio_Oferta, Talla, Tipo,
  Disponible, Tipo_Region, Notas, Estado

Image matching:
  imageName = ParisAwayKit
  main image:      inputImages/ParisAwayKit.(jpg/png/webp/...)
  secondary images: inputImages/ParisAwayKit1..., ParisAwayKit2..., etc.
"""

from __future__ import annotations

import argparse
import base64
import csv
import io
import json
import mimetypes
import re
import sys
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyobnIVz9rLnotfsSGJA7TmOFpla9VXqBL5UbAEvKsdzxVCCdFkj1KI-gQayOUlhGEMpA/exec"

REQUIRED_COLUMNS = [
    "imageName",
    "Equipo",
    "Año",
    "Precio",
    "Precio_Oferta",
    "Talla",
    "Tipo",
    "Disponible",
    "Tipo_Region",
    "Notas",
    "Estado",
]

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

try:
    from PIL import Image
except ImportError:  # Pillow is optional.
    Image = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Bulk upload CAS products from inputUpload and inputImages.")
    parser.add_argument("--input", default=None, help="Input CSV/TSV file. Defaults to inputUpload, inputUpload.csv, or inputUpload.tsv.")
    parser.add_argument("--images-dir", default="inputImages", help="Folder containing product images.")
    parser.add_argument("--endpoint", default=WEB_APP_URL, help="Google Apps Script web app URL.")
    parser.add_argument("--dry-run", action="store_true", help="Validate rows and print what would be uploaded without sending data.")
    parser.add_argument("--yes", action="store_true", help="Skip the interactive upload confirmation.")
    parser.add_argument("--limit", type=int, default=None, help="Only process the first N rows.")
    parser.add_argument("--max-size", type=int, default=1200, help="Max image width/height when Pillow is installed.")
    parser.add_argument("--quality", type=int, default=75, help="JPEG quality when Pillow is installed.")
    return parser.parse_args()


def find_input_file(explicit: str | None) -> Path:
    if explicit:
      path = Path(explicit)
      if not path.exists():
          raise FileNotFoundError(f"Input file not found: {path}")
      return path

    candidates = [Path("inputUpload"), Path("inputUpload.csv"), Path("inputUpload.tsv")]
    for path in candidates:
        if path.exists():
            return path
    raise FileNotFoundError("Could not find inputUpload, inputUpload.csv, or inputUpload.tsv.")


def read_rows(path: Path) -> list[dict[str, str]]:
    text = path.read_text(encoding="utf-8-sig")
    sample = text[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",\t;")
    except csv.Error:
        dialect = csv.excel_tab if path.suffix.lower() == ".tsv" else csv.excel

    reader = csv.DictReader(io.StringIO(text), dialect=dialect)
    if not reader.fieldnames:
        raise ValueError(f"{path} does not contain a header row.")

    missing = [col for col in REQUIRED_COLUMNS if col not in reader.fieldnames]
    if missing:
        raise ValueError(f"{path} is missing required columns: {', '.join(missing)}")

    return [{key: (value or "").strip() for key, value in row.items()} for row in reader]


def truthy(value: str) -> bool:
    return value.strip().lower() in {"si", "sí", "s", "yes", "y", "true", "1", "disponible"}


def image_sort_key(path: Path, image_name: str) -> tuple[int, int, str]:
    suffix = path.stem[len(image_name):]
    if suffix == "":
        return (0, 0, path.name.lower())
    return (1, int(suffix), path.name.lower())


def find_product_images(images_dir: Path, image_name: str) -> list[Path]:
    pattern = re.compile(rf"^{re.escape(image_name)}(\d*)$", re.IGNORECASE)
    matches = [
        path for path in images_dir.iterdir()
        if path.is_file()
        and path.suffix.lower() in IMAGE_EXTENSIONS
        and pattern.match(path.stem)
    ]
    return sorted(matches, key=lambda path: image_sort_key(path, image_name))


def encode_image(path: Path, max_size: int, quality: int) -> dict[str, str]:
    if Image is not None and path.suffix.lower() != ".gif":
        with Image.open(path) as img:
            img.thumbnail((max_size, max_size))
            if img.mode not in ("RGB", "L"):
                img = img.convert("RGB")
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=quality, optimize=True)
            encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
            return {
                "base64": f"data:image/jpeg;base64,{encoded}",
                "name": f"{path.stem}.jpg",
                "type": "image/jpeg",
            }

    mime_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return {
        "base64": f"data:{mime_type};base64,{encoded}",
        "name": path.name,
        "type": mime_type,
    }


def build_payload(row: dict[str, str], image_paths: Iterable[Path], args: argparse.Namespace) -> dict:
    return {
        "action": "addItem",
        "equipo": row["Equipo"],
        "year": row["Año"],
        "precio": row["Precio"],
        "precioOferta": row["Precio_Oferta"],
        "talla": row["Talla"],
        "tipo": row["Tipo"],
        "disponible": truthy(row["Disponible"]),
        "tipoRegion": row["Tipo_Region"],
        "notas": row["Notas"],
        "estado": row["Estado"] or "Activo",
        "images": [encode_image(path, args.max_size, args.quality) for path in image_paths],
    }


def post_payload(endpoint: str, payload: dict, timeout: int = 120) -> dict:
    body = json.dumps(payload).encode("utf-8")
    request = Request(endpoint, data=body, headers={"Content-Type": "application/json"}, method="POST")
    with urlopen(request, timeout=timeout) as response:
        text = response.read().decode("utf-8", errors="replace")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"success": True, "raw": text}


def confirm_upload(total: int) -> None:
    print(f"Ready to upload {total} products.")
    answer = input("Type UPLOAD to continue: ").strip()
    if answer != "UPLOAD":
        raise SystemExit("Upload cancelled.")


def main() -> int:
    args = parse_args()
    input_path = find_input_file(args.input)
    images_dir = Path(args.images_dir)
    if not images_dir.is_dir():
        raise FileNotFoundError(f"Images folder not found: {images_dir}")

    rows = read_rows(input_path)
    if args.limit is not None:
        rows = rows[:args.limit]

    prepared = []
    errors = []
    for row_number, row in enumerate(rows, start=2):
        image_name = row["imageName"]
        if not image_name:
            errors.append(f"Row {row_number}: imageName is empty.")
            continue
        image_paths = find_product_images(images_dir, image_name)
        if not image_paths:
            errors.append(f"Row {row_number}: no images found for imageName '{image_name}'.")
            continue
        prepared.append((row_number, row, image_paths))

    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)

    if errors:
        return 1

    print(f"Input file: {input_path}")
    print(f"Images dir: {images_dir}")
    print(f"Products: {len(prepared)}")
    if Image is None:
        print("Pillow not installed. Images will be uploaded without resizing/compression.")

    for row_number, row, image_paths in prepared:
        names = ", ".join(path.name for path in image_paths)
        print(f"Row {row_number}: {row['Equipo']} ({row['Talla']}) -> {names}")

    if args.dry_run:
        print("Dry run complete. Nothing was uploaded.")
        return 0

    if not args.yes:
        confirm_upload(len(prepared))

    failures = 0
    for index, (row_number, row, image_paths) in enumerate(prepared, start=1):
        print(f"[{index}/{len(prepared)}] Uploading row {row_number}: {row['Equipo']}...")
        payload = build_payload(row, image_paths, args)
        try:
            result = post_payload(args.endpoint, payload)
            if result.get("success") is False:
                failures += 1
                print(f"  FAILED: {result}", file=sys.stderr)
            else:
                sku = result.get("sku", "unknown SKU")
                print(f"  OK: {sku}")
        except (HTTPError, URLError, TimeoutError, OSError) as exc:
            failures += 1
            print(f"  FAILED: {exc}", file=sys.stderr)

    if failures:
        print(f"Finished with {failures} failed uploads.", file=sys.stderr)
        return 1

    print("Bulk upload complete.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
