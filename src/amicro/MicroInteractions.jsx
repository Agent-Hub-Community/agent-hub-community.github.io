/*! Adapted from Amicro by SYED SUBHAN UDDIN. MIT. See LICENSE. */
import { AnimatePresence, motion, useReducedMotion, useSpring } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

export function IconSwap({ state, children }) {
  const reduce = useReducedMotion();
  return <span className="micro-icon-slot" aria-hidden="true"><AnimatePresence initial={false} mode="popLayout"><motion.span key={String(state)} className="micro-icon-state" initial={{ opacity: 0, scale: reduce ? 1 : .25, rotate: reduce ? 0 : -35 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: reduce ? 1 : .25, rotate: reduce ? 0 : 35 }} transition={{ type: 'spring', duration: reduce ? 0 : .28, bounce: 0 }}>{children}</motion.span></AnimatePresence></span>;
}

// The native link/button keeps its hit box; only its inner glyph follows the pointer.
export function MagneticGlyph({ children }) {
  const reduce = useReducedMotion();
  const x = useSpring(0, { stiffness: 150, damping: 15, mass: .6 });
  const y = useSpring(0, { stiffness: 150, damping: 15, mass: .6 });
  const reset = () => { x.set(0);y.set(0); };
  return <span className="magnetic-hit" onPointerMove={event => {
    if (reduce || event.pointerType !== 'mouse') return;
    const box = event.currentTarget.getBoundingClientRect();
    x.set(Math.max(-6, Math.min(6, (event.clientX - box.left - box.width / 2) * .35)));
    y.set(Math.max(-6, Math.min(6, (event.clientY - box.top - box.height / 2) * .35)));
  }} onPointerLeave={reset} onPointerCancel={reset}><motion.span className="magnetic-glyph" style={reduce ? {} : { x, y }}>{children}</motion.span></span>;
}

export function MicroArrow({ size = 18 }) {
  return <span className="arrow-portal" style={{ '--arrow-size': size + 'px' }} aria-hidden="true"><ArrowUpRight size={size} strokeWidth={1.4}/><ArrowUpRight size={size} strokeWidth={1.4}/></span>;
}

export function RollingLabel({ children }) {
  return <span className="rolling-label"><span>{children}</span><span aria-hidden="true">{children}</span></span>;
}
