# AgentHub wordmark

The AgentHub wordmark is custom lettering drawn directly as SVG paths. It does not use a typeface or converted font outlines. The eight letters share a monoline, rounded geometric construction, with an open A, a single-storey g, a curved connecting stroke in H and an open shoulder on b. The wide proportions and square terminals pair with the ASCII opening without making the letters themselves pixelated.

`wordmark.json` is the source of truth. It records each hand-drawn centreline, its optical centre, the stroke width and the viewBox. `BrandWordmark.jsx` renders these paths in the opening, header and footer using the current theme's ink colour. The standalone `assets/agenthub-wordmark.svg` is generated from the same source during the build for reuse outside the page.

During the opening, complete letters soften into focus and settle toward their final spacing, starting near the centre. Position and opacity follow a smoothed scroll value with slight per-letter offsets. There is no clipping mask. Reduced motion and no-script rendering show the complete stationary wordmark.

The separate “Human × Agent” slogan still pairs italic Georgia with Space Grotesk. `space-grotesk-latin-450.woff` is a static weight-450 subset covering basic Latin and the multiplication sign, bundled locally through the stylesheet. Its source is Florian Karsten's [Space Grotesk](https://github.com/floriankarsten/space-grotesk/tree/03507d024a01282884232081fc6011c09ff4e849), `fonts/ttf/SpaceGrotesk[wght].ttf`. The SIL Open Font License 1.1 is retained in `space-grotesk-LICENSE.txt` and copied to `assets/licenses/space-grotesk.txt` by the build. This font is not used by the custom wordmark.
