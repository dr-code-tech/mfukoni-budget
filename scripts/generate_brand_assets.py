from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / "assets" / "images"
ROOT.mkdir(parents=True, exist_ok=True)
SCALE = 3
SIZE = 1024
CANVAS = SIZE * SCALE
NAVY = "#111827"
MINT = "#5EEAD4"
PALE_MINT = "#D1FFF7"


def mark(color=MINT):
    image = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.arc((230 * SCALE, 220 * SCALE, 794 * SCALE, 784 * SCALE), 38, 322, fill=color, width=48 * SCALE)
    bars = [(358, 500, 446, 660), (468, 408, 556, 660), (578, 318, 666, 660)]
    for left, top, right, bottom in bars:
        draw.rounded_rectangle(
            (left * SCALE, top * SCALE, right * SCALE, bottom * SCALE),
            radius=12 * SCALE,
            fill=color,
        )
    return image.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def save_full(name, color=NAVY):
    background = Image.new("RGBA", (SIZE, SIZE), color)
    background.alpha_composite(mark(), (0, 0))
    background.convert("RGB").save(ROOT / name, quality=95)


save_full("icon.png")
save_full("favicon.png")
Image.new("RGB", (SIZE, SIZE), NAVY).save(ROOT / "android-icon-background.png")
mark().save(ROOT / "android-icon-foreground.png")
mark("#FFFFFF").save(ROOT / "android-icon-monochrome.png")
mark(PALE_MINT).save(ROOT / "splash-icon.png")
