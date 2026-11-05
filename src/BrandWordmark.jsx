// Original geometric lettering, drawn as vectors so the brand is consistent at every size.
const letters = [
  'M 12 130 L 65 27 Q 72 13 80 27 L 135 130',
  'M 238 57 H 194 Q 169 57 169 82 V 105 Q 169 130 194 130 H 211 Q 238 130 238 105 V 57 V 135 Q 238 155 216 155 H 177',
  'M 337 130 H 295 Q 270 130 270 105 V 82 Q 270 57 295 57 H 312 Q 337 57 337 82 V 93 H 272',
  'M 370 130 V 83 Q 370 57 396 57 H 412 Q 438 57 438 83 V 130',
  'M 477 25 V 104 Q 477 130 503 130 H 519 M 460 57 H 517',
  'M 574 20 V 130 M 650 20 V 130 M 574 75 H 650',
  'M 685 57 V 104 Q 685 130 711 130 H 727 Q 753 130 753 104 V 57',
  'M 790 20 V 104 Q 790 130 816 130 H 832 Q 858 130 858 104 V 83 Q 858 57 832 57 H 809'
];

export default function BrandWordmark({ animated = false, className = '' }) {
  return <svg className={'brand-wordmark ' + (animated ? 'is-animated ' : '') + className} viewBox="0 0 870 168" fill="none" aria-hidden="true" focusable="false">
    <g stroke="currentColor" strokeWidth="16" strokeLinejoin="round" strokeLinecap="butt">
      {letters.map((d, index) => <path key={index} d={d} pathLength="1" style={{ '--letter-index': index }}/>) }
    </g>
  </svg>;
}
