#!/usr/bin/env python3
"""Convert RGBA PNG to single-channel grayscale PNG using PIL."""

import sys
from pathlib import Path
from PIL import Image


def convert_to_grayscale(input_path: str, output_path: str | None = None) -> None:
    """Convert RGBA image to grayscale (L mode) or grayscale+alpha (LA mode).

    Args:
        input_path: Path to input RGBA PNG
        output_path: Path for output grayscale PNG. If None, appends '_gray' to filename.
    """
    input_file = Path(input_path)

    if output_path is None:
        output_file = input_file.parent / f"{input_file.stem}_gray{input_file.suffix}"
    else:
        output_file = Path(output_path)

    img = Image.open(input_file)

    if img.mode == "RGBA":
        # Extract R channel (same as G and B for grayscale) and alpha
        r, g, b, a = img.split()
        # Check if image has meaningful alpha (not all 255)
        if a.getextrema() == (255, 255):
            # No transparency, just save as grayscale
            gray = r.convert("L")
        else:
            # Has transparency, save as grayscale + alpha
            gray = Image.merge("LA", (r, a))
    elif img.mode == "RGB":
        # Just take R channel
        r, g, b = img.split()
        gray = r.convert("L")
    else:
        # Already grayscale or other mode
        gray = img.convert("L")

    gray.save(output_file)
    print(f"Saved: {output_file}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python convert_to_grayscale.py <input.png> [output.png]")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    convert_to_grayscale(input_path, output_path)
