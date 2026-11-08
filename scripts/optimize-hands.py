"""Regenerate the lossless opening image; requires Pillow with WebP support.

The PNG remains the editable source. Normal website builds use the checked-in
WebP and do not require Pillow. No resizing or color conversion is applied.
"""
import hashlib
import io
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'assets/human-machine-creation.png'
OUTPUT = ROOT / 'assets/human-machine-creation.webp'
source = Image.open(SOURCE)
buffer = io.BytesIO()
metadata = {key: source.info[key] for key in ['icc_profile', 'exif', 'xmp'] if key in source.info}
source.save(buffer, format='WEBP', lossless=True, quality=100, method=6, exact=True, **metadata)
encoded = buffer.getvalue()
decoded = Image.open(io.BytesIO(encoded))
original_pixels = source.convert('RGBA').tobytes()
if source.size != decoded.size or original_pixels != decoded.convert('RGBA').tobytes():
    raise ValueError('The lossless opening image must preserve every decoded pixel')
OUTPUT.write_bytes(encoded)
report = {
    'source': str(SOURCE.relative_to(ROOT)), 'output': str(OUTPUT.relative_to(ROOT)),
    'dimensions': list(source.size), 'source_bytes': SOURCE.stat().st_size,
    'output_bytes': len(encoded), 'saved_bytes': SOURCE.stat().st_size - len(encoded),
    'source_sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'output_sha256': hashlib.sha256(encoded).hexdigest(),
    'decoded_rgba_sha256': hashlib.sha256(original_pixels).hexdigest(),
    'encoding': 'WebP lossless, quality 100, method 6; no resize; exact RGBA round-trip',
}
(ROOT / 'docs/hands-image.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
