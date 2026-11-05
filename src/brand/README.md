# AgentHub wordmark

The compact AgentHub wordmark uses outlines from Space Grotesk by Florian Karsten, with weight 450 and tracking of -30 font units. Its upright, geometric forms retain the warm-white brand colour. Header, opening and footer share the same outlines.

Source: https://github.com/floriankarsten/space-grotesk/tree/03507d024a01282884232081fc6011c09ff4e849
Font file: `fonts/ttf/SpaceGrotesk[wght].ttf`
License: SIL Open Font License 1.1, retained in `space-grotesk-LICENSE.txt` and copied to `assets/licenses/space-grotesk.txt` by the build.

`wordmark.json` contains the eight glyphs converted to SVG outlines with fontTools. The font was instantiated at weight 450, transformed by `(0.16, 0, 0, -0.16, cursor, 116)`, and advanced using each glyph's horizontal metric minus 30 font units. The page does not request a separate font or a third-party service for the wordmark.

During the opening, complete letters soften into focus and settle toward their final spacing, starting near the centre. Position and opacity follow a smoothed scroll value with slight per-letter offsets. There is no clipping mask. Reduced motion and no-script rendering show the complete stationary wordmark.
