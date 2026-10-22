# Turns a screenshot into a card image: crops to 16:9 around the centre, scales to at most 960x540, saves WebP.
#
#   python tools/make-card.py <screenshot.png> img/<game>.webp
#
# Grab screenshots with `node tools/shot.mjs <url> <out.png>`.

import sys
from PIL import Image

MAX_WIDTH = 960
ASPECT = 16 / 9


def main() -> None:
    if len(sys.argv) != 3:
        print("usage: python tools/make-card.py <in.png> <out.webp>")
        sys.exit(2)
    source, target = sys.argv[1], sys.argv[2]

    image = Image.open(source).convert("RGB")
    width, height = image.size
    if width / height > ASPECT:
        crop_width = round(height * ASPECT)
        left = (width - crop_width) // 2
        image = image.crop((left, 0, left + crop_width, height))
    else:
        crop_height = round(width / ASPECT)
        top = (height - crop_height) // 2
        image = image.crop((0, top, width, top + crop_height))

    if image.width > MAX_WIDTH:
        image = image.resize((MAX_WIDTH, round(MAX_WIDTH / ASPECT)), Image.LANCZOS)

    image.save(target, "WEBP", quality=82, method=6)
    print(f"{target}: {image.width}x{image.height}")


main()
