import { motion, useTransform } from 'motion/react';
import wordmark from './brand/wordmark.json';

// Bespoke geometric lettering, drawn as paths rather than font outlines.
// Every letter remains whole while it settles into place; no reveal mask.
function ResolvingLetter({ letter, index, progress }) {
  const start = .47 + Math.abs(index - 3.5) * .012;
  const phase = useTransform(progress, value => {
    const t = Math.max(0, Math.min(1, (value - start) / .28));
    return t * t * (3 - 2 * t);
  });
  const x = useTransform(phase, value => (letter.center - wordmark.center) * .075 * (1 - value));
  const y = useTransform(phase, [0, 1], [18, 0]);
  const blur = useTransform(phase, [0, 1], ['blur(2.5px)', 'blur(0px)']);
  return <motion.g className="wordmark-letter" style={{ x, y, opacity: phase, filter: blur }}><path d={letter.d}/></motion.g>;
}

export default function BrandWordmark({ progress, className = '' }) {
  return <svg className={'brand-wordmark ' + className} viewBox={wordmark.viewBox} fill="none" stroke="currentColor" strokeWidth={wordmark.strokeWidth} strokeLinecap="butt" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {wordmark.letters.map((letter, index) => progress
      ? <ResolvingLetter key={letter.char} letter={letter} index={index} progress={progress}/>
      : <path key={letter.char} d={letter.d}/>) }
  </svg>;
}
