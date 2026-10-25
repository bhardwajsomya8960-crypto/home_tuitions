"""Builds the logo and app icons in frontend/public from the source logo at the repo root.

Run from the repo root:  python3 frontend/scripts/build-brand-assets.py [source.png]
Needs Pillow and numpy. Outputs:
  public/brand/logo.webp        full logo with wordmark, transparent (light backgrounds only)
  public/brand/logo-mark.webp   house mark only, transparent, square
  public/favicon.ico            16, 32, 48 and 64 px
  public/icons/icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
"""
import sys
import numpy as np
from PIL import Image, ImageDraw

SOURCE = sys.argv[1] if len(sys.argv) > 1 else 'Gemini_Generated_Image_wfem6dwfem6dwfem.png'
OUT = 'frontend/public'
BACKGROUND = np.array([253, 249, 237])  # cream behind the artwork in the source
IVORY = (255, 252, 244, 255)            # site background, used behind the icons
FULL_BOX = (304, 423, 2096, 1372)       # artwork + wordmark in the source (left, top, right, bottom)
MARK_RIGHT = 1081                       # the house mark ends here; the wordmark starts after it
PAD = 24

rgb = np.array(Image.open(SOURCE).convert('RGB')).astype(int)
diff = np.abs(rgb - BACKGROUND).sum(2)

# Clear only the background connected to the edges, so cream areas inside the artwork stay.
near = Image.fromarray(((diff < 60) * 255).astype(np.uint8), 'L').copy()
for corner in [(0, 0), (near.width - 1, 0), (0, near.height - 1), (near.width - 1, near.height - 1)]:
    ImageDraw.floodfill(near, corner, 128)
outside = np.array(near) == 128
alpha = np.full(diff.shape, 255.0)
alpha[outside] = np.clip((diff[outside] - 12) / 48 * 255, 0, 255)  # soft edge instead of a hard cut
art = Image.fromarray(np.dstack([rgb, alpha]).astype(np.uint8), 'RGBA')

left, top, right, bottom = FULL_BOX
full = art.crop((left - PAD, top - PAD, right + PAD, bottom + PAD))
mark = art.crop((left - PAD, top - PAD, MARK_RIGHT + PAD, bottom + PAD))
side = max(mark.size)
square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
square.paste(mark, ((side - mark.width) // 2, (side - mark.height) // 2))

def resized(image, width):
    return image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)

resized(full, 720).save(f'{OUT}/brand/logo.webp', 'WEBP', quality=88, method=6)
resized(square, 256).save(f'{OUT}/brand/logo-mark.webp', 'WEBP', quality=88, method=6)

def icon(size, scale):
    canvas = Image.new('RGBA', (size, size), IVORY)
    inner = square.resize((round(size * scale),) * 2, Image.LANCZOS)
    canvas.alpha_composite(inner, ((size - inner.width) // 2, (size - inner.height) // 2))
    return canvas.convert('RGB')

def save_png(image, path):
    image.quantize(colors=96, dither=Image.Dither.NONE).save(path, optimize=True)

save_png(icon(512, 0.92), f'{OUT}/icons/icon-512.png')
save_png(icon(192, 0.92), f'{OUT}/icons/icon-192.png')
save_png(icon(512, 0.72), f'{OUT}/icons/icon-maskable-512.png')  # keeps the art inside the maskable safe zone
save_png(icon(180, 0.88), f'{OUT}/icons/apple-touch-icon.png')
icon(256, 1.0).save(f'{OUT}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
print('Brand assets written to', OUT)
