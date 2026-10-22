# Builds og-image.jpg (1200x630), the picture link previews show: the title over the card images in a 3x2 grid.
#
#   python tools/make-og.py
#
# Uses the first six images in index.html order. Needs Windows' Segoe UI fonts.

import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
WIDTH, HEIGHT = 1200, 630
MARGIN, GAP = 44, 16
COLUMNS, ROWS = 3, 2
BACKGROUND = (13, 12, 22)
TEXT = (244, 241, 255)
MUTED = (177, 171, 207)
FONTS = Path("C:/Windows/Fonts")


def card_images() -> list[Path]:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    names = re.findall(r'<img src="(img/[^"]+)"', html)
    return [ROOT / name for name in names[: COLUMNS * ROWS]]


def rounded(image: Image.Image, radius: int) -> Image.Image:
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, image.width - 1, image.height - 1), radius, fill=255)
    out = Image.new("RGBA", image.size)
    out.paste(image, (0, 0), mask)
    return out


def main() -> None:
    canvas = Image.new("RGB", (WIDTH, HEIGHT), BACKGROUND)
    draw = ImageDraw.Draw(canvas)

    tile_width = (WIDTH - 2 * MARGIN - (COLUMNS - 1) * GAP) // COLUMNS
    tile_height = round(tile_width * 9 / 16)
    grid_top = HEIGHT - MARGIN - ROWS * tile_height - (ROWS - 1) * GAP

    title_font = ImageFont.truetype(str(FONTS / "seguibl.ttf"), 64)
    tag_font = ImageFont.truetype(str(FONTS / "segoeuib.ttf"), 26)
    draw.text((MARGIN, 24), "DemiDummy Games", font=title_font, fill=TEXT)
    draw.text((MARGIN + 4, 106), "Little games you can play right now, free in your browser.", font=tag_font, fill=MUTED)

    for index, path in enumerate(card_images()):
        column, row = index % COLUMNS, index // COLUMNS
        tile = Image.open(path).convert("RGB").resize((tile_width, tile_height), Image.LANCZOS)
        x = MARGIN + column * (tile_width + GAP)
        y = grid_top + row * (tile_height + GAP)
        tile = rounded(tile, 14)
        canvas.paste(tile, (x, y), tile)

    target = ROOT / "og-image.jpg"
    canvas.save(target, "JPEG", quality=86, optimize=True, progressive=True)
    print(f"{target}: {WIDTH}x{HEIGHT}, grid starts at y={grid_top}")


main()
