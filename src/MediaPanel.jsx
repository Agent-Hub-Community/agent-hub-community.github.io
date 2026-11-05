import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { Image as ImageIcon } from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './media-panel.css';

export default function MediaPanel({ items, active, onSelect, variant = 'stack' }) {
  const reduce = useReducedMotion();
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(tiltX, { stiffness: 160, damping: 28 });
  const rotateY = useSpring(tiltY, { stiffness: 160, damping: 28 });
  const sheenX = useTransform(rotateY, [-7, 7], ['-25%', '25%']);
  const item = items[active];
  const reset = () => { tiltX.set(0); tiltY.set(0); };
  const follow = event => {
    if (reduce || event.pointerType !== 'mouse') return;
    const box = event.currentTarget.getBoundingClientRect();
    tiltX.set((.5 - (event.clientY - box.top) / box.height) * 10);
    tiltY.set(((event.clientX - box.left) / box.width - .5) * 14);
  };
  const entrance = variant === 'stack'
    ? { opacity: 0, y: 70, rotate: -8, scale: .9 }
    : { opacity: .2, x: 70, clipPath: 'inset(0 100% 0 0)' };
  return <motion.figure className={'media-panel media-panel--' + variant} aria-label={item.title + (item.src ? ' 配图' : ' 图片位置')} initial={false} whileInView={reduce ? {} : { opacity: [.3, 1], y: [60, 0], rotate: [variant === 'stack' ? -4 : 2, 0] }} viewport={{ once: true, amount: .25 }} transition={{ duration: .95, ease: [.16, 1, .3, 1] }}>
    <div className="media-stage" onPointerMove={follow} onPointerLeave={reset} onPointerCancel={reset}>
      {variant === 'stack' && <div className="media-stack-backs" aria-hidden="true"><span/><span/></div>}
      <motion.div className="media-plane" style={reduce ? {} : { rotateX, rotateY }}>
        <AnimatePresence initial={false} mode="sync">
          <motion.div key={active} className="media-shot" initial={reduce ? false : entrance} animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, clipPath: 'inset(0 0 0 0)' }} exit={reduce ? { opacity: 0 } : { opacity: 0, x: variant === 'stack' ? -24 : -40, y: variant === 'stack' ? -60 : 0, rotate: variant === 'stack' ? 5 : 0 }} transition={{ duration: reduce ? 0 : .7, ease: [.16, 1, .3, 1] }}>
            {item.src
              ? <img src={item.src} alt={item.alt} width="1200" height="1400" loading="lazy"/>
              : <div className="media-empty" aria-hidden="true"><ImageIcon size={24} strokeWidth={1}/><span>{item.title}</span></div>}
            <motion.span className="media-wipe" aria-hidden="true" initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: .7, ease: [.76, 0, .24, 1] }}/>
          </motion.div>
        </AnimatePresence>
        <motion.span className="media-sheen" aria-hidden="true" style={{ x: sheenX }}/>
      </motion.div>
    </div>
    <figcaption className="media-caption"><span>{item.title}</span><span className="media-count"><span className="media-count-digit"><AnimatePresence mode="popLayout" initial={false}><motion.span key={active} initial={reduce ? false : { y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: reduce ? 0 : -16, opacity: 0 }} transition={{ duration: reduce ? 0 : .3 }}>{String(active + 1).padStart(2, '0')}</motion.span></AnimatePresence></span><span> / {String(items.length).padStart(2, '0')}</span></span><span className="media-controls"><button type="button" aria-label="上一幅配图" disabled={active === 0} onClick={() => onSelect(active - 1)}><ChevronLeft size={20}/></button><button type="button" aria-label="下一幅配图" disabled={active === items.length - 1} onClick={() => onSelect(active + 1)}><ChevronRight size={20}/></button></span></figcaption>
  </motion.figure>;
}
