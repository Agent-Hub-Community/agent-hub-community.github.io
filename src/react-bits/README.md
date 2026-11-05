# React Bits components

Source: https://github.com/DavidHDev/react-bits/tree/e12c22192ac7b4b452c5e2feb9b586d74765d696

The page currently uses LogoLoop, ScrollReveal, ScrollFloat and WarmTooltip. Earlier BlurText, SpotlightCard and SpecularButton source is retained but is not imported by the page. The brand lettering uses Space Grotesk vector outlines; attribution and license are in `src/brand/`.

See LICENSE.md for the original license. Local adaptations:

- BlurText adds an `as` prop for semantic headings.
- ScrollReveal and ScrollFloat use GSAP distribution entry points compatible with static prerendering.
- WarmTooltip guards viewport access during static prerendering.
- Active component colour defaults, fonts and loop masks consume the site's theme tokens.
- The retained SpecularButton adds an `as` prop for native links.
