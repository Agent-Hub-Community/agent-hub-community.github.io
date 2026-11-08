"""Make landscape and portrait crops of the NASA Robonaut photograph.

Run: python3 -I scripts/prepare-home-robot.py /path/to/original.jpg
The source and usage terms are recorded in assets/environment/robot-sources.json.
"""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source', type=Path)
args = parser.parse_args()
source = Image.open(args.source).convert('RGB')
source = ImageEnhance.Color(source).enhance(.8)

def smooth(value):
    value = max(0, min(1, value))
    return value * value * (3 - 2 * value)

results = []
for name, size, photo_size, offset in [
    ('landscape', (2560, 1600), (2080, 1664), (570, -25)),
    ('portrait', (1080, 1800), (1240, 992), (-80, 140)),
]:
    image = Image.new('RGB', size, '#000000')
    photo = source.resize(photo_size, Image.Resampling.LANCZOS)
    layer = Image.new('RGB', size, '#000000')
    layer.paste(photo, offset)
    # A wide, soft fade joins the studio black to the page's negative space.
    if name == 'landscape':
        row = bytes(round(255 * smooth((x - 610) / 650)) for x in range(size[0]))
        mask = Image.frombytes('L', (size[0], 1), row).resize(size)
    else:
        column = bytes(round(255 * smooth((y - 100) / 180) * (1 - smooth((y - 880) / 300))) for y in range(size[1]))
        mask = Image.frombytes('L', (1, size[1]), column).resize(size)
    image.paste(layer, (0, 0), mask)
    target = ROOT / 'assets/environment' / ('robot-' + name + '.webp')
    image.save(target, format='WEBP', quality=90, method=6)
    results.append({'file': target.name, 'size': size, 'bytes': target.stat().st_size, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
print(json.dumps(results))
