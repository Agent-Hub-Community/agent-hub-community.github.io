# Amicro micro-interactions

Reference and adapted sources: https://github.com/Subhan-code/Amicro--Micro-transitions-/tree/5a037fc0bfb538bdf3c634a64bdb12022ea13282

- `src/components/IconSwap.tsx`: spring-based entering and exiting icon states.
- `registry/ui/hover/magnetic-button.tsx`: pointer-distance response and spring return.
- The gallery's sliding arrow and text reveal patterns inform the local CSS treatments.

Local adaptations use the existing `motion/react` package, JSX and site colours. Native buttons and links retain their hit boxes. Pointer movement affects only inner icons, is limited to 6px, and is disabled for touch/reduced-motion. Icon swaps support keyboard-triggered state changes. Arrow portals and rolling labels are local CSS implementations; duplicated glyphs/text are hidden from assistive technology.

The upstream MIT license is retained in LICENSE and exported to assets/licenses/amicro.txt.
