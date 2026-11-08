# AgentHub wordmark

The AgentHub wordmark is custom lettering drawn directly as SVG paths. It does not use a typeface or converted font outlines. The eight letters share a monoline, rounded geometric construction, with an open A, a single-storey g, a curved connecting stroke in H and an open shoulder on b. The wide proportions and square terminals pair with the ASCII opening without making the letters themselves pixelated.

`wordmark.json` is the source of truth. It records each hand-drawn centreline, its optical centre, the stroke width and the viewBox. `BrandWordmark.jsx` renders these paths in the opening, header and footer using the current theme's ink colour. The standalone `assets/agenthub-wordmark.svg` is generated from the same source during the build for reuse outside the page.

During the opening, complete letters soften into focus and settle toward their final spacing, starting near the centre. Position and opacity follow a smoothed scroll value with slight per-letter offsets. There is no clipping mask. Reduced motion and no-script rendering show the complete stationary wordmark.

The separate “Human × Agent” slogan still pairs italic Georgia with Space Grotesk. `space-grotesk-latin-450.woff` is a static weight-450 subset covering basic Latin and the multiplication sign, bundled locally through the stylesheet. Its source is Florian Karsten's [Space Grotesk](https://github.com/floriankarsten/space-grotesk/tree/03507d024a01282884232081fc6011c09ff4e849), `fonts/ttf/SpaceGrotesk[wght].ttf`. The SIL Open Font License 1.1 is retained in `space-grotesk-LICENSE.txt` and copied to `assets/licenses/space-grotesk.txt` by the build. This font is not used by the custom wordmark.

## Chinese body typography

The homepage and navigation pair Inter with locally served [Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC). The opening continues to use its original typography. The Noto subset preserves the 400–600 weight range, allowing a lighter display weight and distinct article headings without synthesized bold strokes.

Journal `h2` and `h3` headings enable the font's `palt` positioning feature for proportional CJK punctuation. The subset script preserves layout features, including the GPOS adjustments used by commas, full stops and question marks. Body prose keeps the font's default spacing.

`noto-sans-sc.css` defines two disjoint Unicode ranges. The `core` subset covers the opening, home scenes, navigation, initial journal text and its first three visible discussions. The `archive` subset covers additional characters in complete discussions and institution names. Exact current byte sizes, character coverage, source version and SHA-256 hashes are recorded in `noto-sans-sc-source.json`. The institution wall contains all names, so browsing the home may load both ranges. The fonts use `font-display: swap`, retain system fallbacks and preserve the SIL Open Font License in the source and build.

After editing Chinese content, regenerate from the original upstream variable TTF with FontTools and Brotli installed:

```sh
python -I scripts/subset-body-font.py /path/to/NotoSansSC.ttf
npm run build
```

The source URL is recorded in the metadata. Keep the matching upstream license when changing source versions. The script derives coverage from the current JSX, scene dialogue JavaScript and JSON, including the first page selected by `discussionHighlights` and research questions selected by each topic's `discussionId`, retains attribution records, checks missing glyphs, and writes the two WOFF2 files, CSS and metadata together. Standard builds use these checked-in assets and do not download fonts or run subsetting.

## Sharing cover

`assets/social-card.png` is the 1200×630 sharing image. It uses the original paths from `wordmark.json`, the existing fonts and the journal's deep blue-gray palette. The cover is rendered from `social-card.html`, with no stock or generated illustration. The PNG is about 39 KB and is referenced through Open Graph metadata; it is not loaded during normal homepage browsing.

Regenerate it after changing the lettering or cover copy:

```sh
python -I scripts/render-social-card.py
```

This optional rendering step requires Python Playwright with Chromium and Pillow, and embeds the existing local font files. Normal npm builds use the checked-in PNG. The cover copy uses the same Chinese characters as the homepage introduction; if that copy changes, ensure the font subset includes the new characters.
