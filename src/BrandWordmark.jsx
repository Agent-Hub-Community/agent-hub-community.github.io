import wordmark from './brand/wordmark.json';

const LETTER_STARTS = wordmark.letters.map((_, index) => .47 + Math.abs(index - 3.5) * .012);
const LETTER_DX = wordmark.letters.map(letter => (letter.center - wordmark.center) * .075);

export function applyWordmarkProgress(elements, progress) {
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (!el) continue;
    const t = Math.max(0, Math.min(1, (progress - LETTER_STARTS[i]) / .28));
    const phase = t * t * (3 - 2 * t);
    const inv = 1 - phase;
    el.style.opacity = String(phase);
    el.style.transform = inv === 0
      ? 'none'
      : `translate3d(${(LETTER_DX[i] * inv).toFixed(2)}px, ${(18 * inv).toFixed(2)}px, 0)`;
  }
}

// Bespoke geometric lettering, drawn as paths rather than font outlines.
// Every letter remains whole while it settles into place; no reveal mask.
export default function BrandWordmark({ letterRefs, className = '' }) {
  return <svg className={'brand-wordmark' + (className ? ' ' + className : '')} viewBox={wordmark.viewBox} fill="none" stroke="currentColor" strokeWidth={wordmark.strokeWidth} strokeLinecap="butt" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {wordmark.letters.map((letter, index) => letterRefs
      ? <g key={letter.char} className="wordmark-letter" ref={el => { letterRefs.current[index] = el; }} style={{ opacity: 0, transform: `translate3d(${LETTER_DX[index].toFixed(2)}px, 18px, 0)` }}><path d={letter.d}/></g>
      : <path key={letter.char} d={letter.d}/>)}
  </svg>;
}
