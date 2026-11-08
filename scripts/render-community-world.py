"""Export the actual Three.js world as the page's static WebP fallback.

Requires npm ci, Python Playwright with Chromium, and Pillow. No image API is used.
"""
import argparse
import base64
import io
import json
import subprocess
import tempfile
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'assets/community-world.webp')
    args = parser.parse_args()
    (ROOT / '.build').mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='world-export-', dir=ROOT / '.build') as temporary:
        work = Path(temporary)
        (work / 'assets').symlink_to(ROOT / 'assets', target_is_directory=True)
        subprocess.run([
            str(ROOT / 'node_modules/.bin/esbuild'), str(ROOT / 'src/community-world.js'),
            '--bundle', '--format=esm', '--minify', f'--outfile={work / "world.js"}',
        ], check=True, cwd=ROOT)
        (work / 'index.html').write_text('''<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;height:100%}canvas{display:block;width:100%;height:100%}</style></head>
<body><canvas></canvas><script type="module">
import {createCommunityWorld} from './world.js';
window.world = await createCommunityWorld(document.querySelector('canvas'), {
  onReady: () => { window.sceneReady = true; }
});
window.world.setMotion(false);
</script></body></html>''')
        server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=temporary))
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(args=['--enable-unsafe-swiftshader'])
                try:
                    mobile = args.output.with_name(args.output.stem + '-mobile.webp')
                    for width, height, density, output in [(1600, 900, 1, args.output), (390, 1160, 2, mobile)]:
                        context = browser.new_context(viewport={'width': width, 'height': height}, device_scale_factor=density, reduced_motion='reduce')
                        page = context.new_page()
                        page.goto(f'http://127.0.0.1:{server.server_port}/')
                        page.wait_for_function('window.sceneReady === true', timeout=45000)
                        encoded = page.evaluate('window.world.capture()').split(',', 1)[1]
                        picture = Image.open(io.BytesIO(base64.b64decode(encoded)))
                        output.parent.mkdir(parents=True, exist_ok=True)
                        picture.save(output, format='WEBP', quality=90, method=6)
                        print(json.dumps({'output': str(output), 'width': picture.width, 'height': picture.height, 'bytes': output.stat().st_size}))
                        context.close()
                finally:
                    browser.close()
        finally:
            server.shutdown()
            server.server_close()
            thread.join()


if __name__ == '__main__':
    main()
