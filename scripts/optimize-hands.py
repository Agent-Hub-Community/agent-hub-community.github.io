"""Regenerate the opening hands sampling image; requires Pillow with WebP support.

The PNG remains the editable source. Normal website builds use the checked-in
WebP and do not require Pillow. The opening samples this image into a grayscale
ASCII grid (at most 380 columns wide), so a 768x512 grayscale WebP keeps >2x
oversampling while cutting initial transfer weight by ~97%.
"""
import hashlib
import io
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'assets/human-machine-creation.png'
OUTPUT = ROOT / 'assets/human-machine-creation.webp'
TARGET_SIZE = (768, 512)
source = Image.open(SOURCE)
resized = source.convert('L').resize(TARGET_SIZE, Image.Resampling.LANCZOS)
buffer = io.BytesIO()
resized.save(buffer, format='WEBP', quality=85, method=6)
encoded = buffer.getvalue()
OUTPUT.write_bytes(encoded)
report = {
    'source': str(SOURCE.relative_to(ROOT)), 'output': str(OUTPUT.relative_to(ROOT)),
    'source_dimensions': list(source.size), 'dimensions': list(TARGET_SIZE),
    'source_bytes': SOURCE.stat().st_size,
    'output_bytes': len(encoded), 'saved_bytes': SOURCE.stat().st_size - len(encoded),
    'source_sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'output_sha256': hashlib.sha256(encoded).hexdigest(),
    'encoding': 'WebP grayscale lossy, quality 85, method 6, 768x512 Lanczos (>2x ASCII sampling grid)',
}
(ROOT / 'docs/hands-image.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
