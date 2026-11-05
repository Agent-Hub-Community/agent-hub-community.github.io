import { AnimatePresence, motion, useReducedMotion, useScroll } from 'motion/react';
import WarmTooltip from './react-bits/WarmTooltip';

export function Tip({ label, children, side = 'top', className = '' }) {
  return <WarmTooltip content={label} side={side} size="sm" surfaceColor="var(--color-paper-3)" inkColor="var(--color-ink)" radius={0} gap={8} popBlur={0} popScale={1} popDuration={130} className={className}>{children}</WarmTooltip>;
}

export function AccordionMark() {
  return <span className="accordion-mark" aria-hidden="true"><span/><span/></span>;
}

export function PageCounter({ value, total }) {
  const reduce = useReducedMotion();
  return <span className="page-counter" aria-label={'第 ' + value + ' 组，共 ' + total + ' 组'}><span className="page-digit"><AnimatePresence mode="popLayout" initial={false}><motion.span key={value} initial={{ y: reduce ? 0 : 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: reduce ? 0 : -6, opacity: 0 }} transition={{ duration: reduce ? 0 : .16 }}>{String(value).padStart(2, '0')}</motion.span></AnimatePresence></span><i>/ {String(total).padStart(2, '0')}</i></span>;
}

export function PageProgress({ visible = true }) {
  const { scrollYProgress } = useScroll();
  return <motion.div className={'page-reading-progress' + (visible ? ' is-visible' : '')} aria-hidden="true" style={{ scaleX: scrollYProgress }}/>;
}
