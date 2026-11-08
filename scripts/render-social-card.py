"""Render the sharing cover from the original lettering and local fonts.

Requires Python Playwright with Chromium and Pillow. Standard npm builds use
the checked-in PNG, and do not need these optional image-generation tools.
"""
import argparse
import asyncio
import base64
import html
import json
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent


def data_url(path, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()


async def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--theme', choices=['light', 'dark'], default='dark')
    parser.add_argument('--output', type=Path, default=ROOT / 'assets/social-card.png')
    args = parser.parse_args()
    mark = json.loads((ROOT / 'src/brand/wordmark.json').read_text())
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{html.escape(mark["viewBox"])}" fill="none" stroke="currentColor" stroke-width="{mark["strokeWidth"]}" stroke-linecap="butt" stroke-linejoin="round">'
    svg += ''.join(f'<path d="{html.escape(letter["d"])}"/>' for letter in mark['letters']) + '</svg>'
    document = (ROOT / 'src/brand/social-card.html').read_text()
    replacements = {
        'THEME': args.theme,
        'WORDMARK': svg,
        'FONT_INTER': data_url(ROOT / 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', 'font/woff2'),
        'FONT_CJK': data_url(ROOT / 'src/brand/noto-sans-sc-core.woff2', 'font/woff2'),
        'FONT_GROTESK': data_url(ROOT / 'src/brand/space-grotesk-latin-450.woff', 'font/woff'),
    }
    for key, value in replacements.items():
        document = document.replace('{{' + key + '}}', value)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        page = await browser.new_page(viewport={'width': 1200, 'height': 630}, device_scale_factor=1)
        await page.set_content(document, wait_until='networkidle')
        await page.evaluate('document.fonts.ready')
        assert await page.evaluate('document.fonts.check(\'440 29px "Noto Sans SC"\', "做的人在这里相遇")')
        assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth || document.documentElement.scrollHeight>innerHeight')
        await page.screenshot(path=str(args.output))
        await browser.close()
    Image.open(args.output).convert('RGB').save(args.output, format='PNG', optimize=True, compress_level=9)
    print(json.dumps({'file': str(args.output), 'theme': args.theme, 'size': [1200, 630], 'bytes': args.output.stat().st_size}))


asyncio.run(main())
