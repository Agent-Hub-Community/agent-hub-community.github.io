import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowDown } from 'lucide-react';
import BrandWordmark from './BrandWordmark';
import { PlaybackGlyph } from './amicro/MicroInteractions';
import './genesis.css';

// Sample one grayscale plate into two independent character fields. Animation
// changes the glyphs and their positions; the raster never appears over them.
function useAsciiHands(ref, left, right, progress) {
  useEffect(() => {
    const host = ref.current;
    const canvases = [left.current, right.current];
    const contexts = canvases.map(canvas => canvas.getContext('2d'));
    if (contexts.some(context => !context)) return;
    const sample = document.createElement('canvas');
    const sampler = sample.getContext('2d', { willReadFrequently: true });
    const source = new Image();
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const toggle = document.querySelector('.ascii-toggle');
    let fields = [[], []], width = 0, height = 0, cellX = 0, cellY = 0;
    let frame = 0, clock = 0, last = 0, loaded = false, visible = true;
    let paused = preference.matches, active = progress.get() < .72;
    const chars = ' .,:;irsXA253hMHGS#9B&@';
    function draw() {
      contexts.forEach((context, hand) => {
        context.clearRect(0, 0, width, height);
        context.font = `500 ${cellY * .82}px SFMono-Regular, Consolas, monospace`;
        context.textAlign = 'center';context.textBaseline = 'middle';
        context.fillStyle = hand ? '#c5d6e8' : '#efece4';
        for (const point of fields[hand]) {
          const wave = Math.sin(point.x * .012 - clock * .8) * Math.sin(point.y * .014 + clock * .4);
          const light = Math.max(0, Math.min(1, point.light + wave * .045));
          const index = Math.min(chars.length - 1, Math.floor(light * chars.length));
          context.globalAlpha = Math.min(.98, .18 + Math.pow(light, .75) * .8);
          context.fillText(chars[index], point.x + Math.sin(clock * .6 + point.phase) * .5, point.y + wave * .6);
        }
        context.globalAlpha = 1;
      });
    }
    function resize() {
      if (!loaded) return;
      width = host.clientWidth;height = width * source.height / source.width;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvases.forEach((canvas, index) => { canvas.width = Math.round(width * ratio);canvas.height = Math.round(height * ratio);contexts[index].setTransform(ratio, 0, 0, ratio, 0, 0); });
      const columns = Math.max(100, Math.min(380, Math.round(width / 5.2)));
      const rows = Math.round(columns * source.height / source.width * .55);
      cellX = width / columns;cellY = height / rows;
      sample.width = columns;sample.height = rows;sampler.drawImage(source, 0, 0, columns, rows);
      const pixels = sampler.getImageData(0, 0, columns, rows).data;
      fields = [[], []];
      for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
        const i = (y * columns + x) * 4;
        const light = (pixels[i] * .2126 + pixels[i + 1] * .7152 + pixels[i + 2] * .0722) / 255;
        if (light < .055) continue;
        fields[x < columns / 2 ? 0 : 1].push({ x: (x + .5) * cellX, y: (y + .5) * cellY, light: Math.pow(light, .82), phase: x * .7 + y * .3 });
      }
      draw();host.classList.add('is-ready');
    }
    function tick(now) {
      frame = 0;
      if (!visible || !active || paused || document.hidden || !loaded) return;
      if (now - last > 48) { clock += Math.min(now - (last || now), 100) / 1000;last = now;draw(); }
      frame = requestAnimationFrame(tick);
    }
    function sync() { cancelAnimationFrame(frame);last = 0;if (loaded) {draw();if (!paused && active && visible && !document.hidden) frame = requestAnimationFrame(tick);} }
    const stopProgress = progress.on('change', value => { const next = value < .72;if (next !== active) {active = next;sync();} });
    const watchToggle = new MutationObserver(() => { paused = toggle.getAttribute('aria-pressed') !== 'true';sync(); });
    watchToggle.observe(toggle, { attributes: true, attributeFilter: ['aria-pressed'] });
    const change = event => { paused = event.matches;sync(); };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting;sync(); });observer.observe(host);
    const resizeObserver = new ResizeObserver(resize);resizeObserver.observe(host);
    preference.addEventListener('change', change);document.addEventListener('visibilitychange', sync);
    source.onload = () => { loaded = true;resize();sync(); };
    source.src = 'assets/human-machine-source.png';
    return () => { cancelAnimationFrame(frame);stopProgress();observer.disconnect();resizeObserver.disconnect();watchToggle.disconnect();preference.removeEventListener('change', change);document.removeEventListener('visibilitychange', sync);source.onload = null; };
  }, [ref, left, right, progress]);
}

export default function GenesisHero({ interfaceVisible, onInterfaceChange }) {
  const ref = useRef(null), field = useRef(null), left = useRef(null), right = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  // Keep the multi-stage mappings on the JS clock so all layers share exactly
  // the same progress, including browsers with native ScrollTimeline support.
  const progress = useMotionValue(0);
  useMotionValueEvent(scrollYProgress, 'change', value => progress.set(value));
  useEffect(() => { progress.set(scrollYProgress.get()); }, [progress, scrollYProgress]);
  useEffect(() => {
    let previous;
    const sync = value => {
      const visible = Boolean(reduce || value >= .72);
      if (visible !== previous) { previous = visible;onInterfaceChange(visible); }
    };
    sync(progress.get());
    return progress.on('change', sync);
  }, [progress, reduce, onInterfaceChange]);
  const leftX = useTransform(progress, [0, .12, .67], ['0%', '-2%', '-57%']);
  const rightX = useTransform(progress, [0, .12, .67], ['0%', '2%', '57%']);
  const leftRotate = useTransform(progress, [0, .65], [0, -12]);
  const rightRotate = useTransform(progress, [0, .65], [0, 12]);
  const handsOpacity = useTransform(progress, [0, .45, .7], [1, .9, 0]);
  const logoScale = useTransform(progress, [0, .06, .52, .86], [.025, .025, .82, 1]);
  const logoOpacity = useTransform(progress, [0, .05, .22], [0, 0, 1]);
  const titleY = useTransform(progress, [.58, .85], [80, 0]);
  const titleClip = useTransform(progress, [.58, .86], ['inset(100% 0 0 0)', 'inset(0% 0 0 0)']);
  const titleOpacity = useTransform(progress, [.57, .7], [0, 1]);
  const introY = useTransform(progress, [.7, .94], [32, 0]);
  const introOpacity = useTransform(progress, [.7, .92], [0, 1]);
  useAsciiHands(field, left, right, progress);
  useEffect(() => { import('../assets/ascii-logo.js'); }, []);
  return <section id="cover" className="genesis" ref={ref} aria-labelledby="hero-title">
    <div className="genesis-stage">
      <div className="hands-field" ref={field} role="img" aria-label="人手与机械手用 ASCII 字符组成，以创造亚当的姿态伸向彼此。向下滚动，两只手分开，社区标志从中间展开。">
        <img className="hands-fallback" src="assets/human-machine-source.png" alt="" width="1536" height="1024" fetchPriority="high"/>
        <motion.div className="ascii-hand human-hand" style={reduce ? {} : { x: leftX, rotate: leftRotate, opacity: handsOpacity }}><canvas ref={left} aria-hidden="true"/></motion.div>
        <motion.div className="ascii-hand machine-hand" style={reduce ? {} : { x: rightX, rotate: rightRotate, opacity: handsOpacity }}><canvas ref={right} aria-hidden="true"/></motion.div>
      </div>
      <motion.div className="genesis-logo" style={reduce ? {} : { scale: logoScale, opacity: logoOpacity }}>
        <figure className="ascii-figure" data-source="assets/agenthub-galaxy.webp" aria-label="Agent Hub 社区的动态 ASCII 星系标志"><img className="ascii-fallback" src="assets/agenthub-galaxy.webp" width="720" height="720" alt=""/><canvas aria-hidden="true"/></figure>
      </motion.div>
      <motion.div className="genesis-wordmark wrap" style={reduce ? {} : { y: titleY, clipPath: titleClip, opacity: titleOpacity }}><h1 id="hero-title" aria-label="Agent Hub"><span className="visually-hidden">Agent Hub</span><BrandWordmark/></h1></motion.div>
      <motion.div className="genesis-introduction wrap" style={reduce ? {} : { y: introY, opacity: introOpacity }}><p>Agent Hub 是一个中文技术社群，<br/>专注 LLM Agent 的研究与应用。</p><span>成员来自基模团队与高校，分享研究进展和工程经验。</span></motion.div>
      <div className={'genesis-bottom wrap' + (interfaceVisible ? ' is-visible' : '')}><a href="#about" className="genesis-enter"><ArrowDown size={16}/><span>进入主页</span></a><button className="ascii-toggle" type="button" aria-pressed="true" hidden><PlaybackGlyph/><span data-motion-label>暂停动画</span></button></div>
    </div>
  </section>;
}
