import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import BrandWordmark from './BrandWordmark';
import './genesis.css';

const HANDS_SOURCE = 'assets/human-machine-creation.png';
const HANDS_SPLIT = .495;
// Similar visual densities preserve shading without turning flat areas into
// long strings of the same character. Every glyph is printable ASCII.
const GLYPH_BANDS = [".,:'`", ':;!|il', 'irslt/\\', 'vxzc+=*', 'aeknu235', 'AXYhHZ4', 'GMODU69', 'SW%Q8B&', '@#MWB8&'];

function cellNoise(seed) {
  let value = Math.imul(seed ^ (seed >>> 16), 0x21f0aaad);
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  return ((value ^ (value >>> 15)) >>> 0) / 4294967296;
}

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
    let fields = [[], []], width = 0, height = 0, cellX = 0, cellY = 0;
    let handColors = [], glyphWeight = 500, opacityFloor = .18;
    let frame = 0, clock = 0, last = 0, lastDraw = 0, loaded = false, visible = true;
    let paused = preference.matches, active = progress.get() < .72;
    function breathe() {
      const amplitude = Math.min(8, Math.max(3, width * .004));
      canvases.forEach((canvas, hand) => {
        // The inner canvas breathes independently of its parent's scroll motion.
        // A slight phase offset keeps the two hands from moving in lockstep.
        const phase = clock * Math.PI * 2 / 7.8 + hand * .42;
        const breath = paused ? 0 : Math.sin(phase);
        const turn = breath * (hand ? -.24 : .28);
        canvas.style.transform = `translate3d(0, ${-breath * amplitude}px, 0) rotate(${turn}deg)`;
      });
    }
    function draw() {
      contexts.forEach((context, hand) => {
        context.clearRect(0, 0, width, height);
        context.font = `${glyphWeight} ${cellY * .82}px SFMono-Regular, Consolas, monospace`;
        context.textAlign = 'center';context.textBaseline = 'middle';
        context.fillStyle = handColors[hand];
        for (const point of fields[hand]) {
          if (!paused && clock >= point.nextChange) {
            point.revision += 1;
            const random = cellNoise(point.seed + point.revision * 104729);
            point.glyph = (point.glyph + 1 + Math.floor(random * (point.pool.length - 1))) % point.pool.length;
            point.nextChange = clock + 3.5 + cellNoise(point.seed + point.revision * 130363) * 5;
          }
          const wave = Math.sin(point.x * .012 - clock * .8) * Math.sin(point.y * .014 + clock * .4);
          const light = Math.max(0, Math.min(1, point.light + wave * .025));
          context.globalAlpha = Math.min(.98, opacityFloor + Math.pow(light, .75) * (.98 - opacityFloor));
          context.fillText(point.pool[point.glyph], point.x + Math.sin(clock * .6 + point.phase) * .3, point.y + wave * .35);
        }
        context.globalAlpha = 1;
      });
    }
    function resize() {
      if (!loaded) return;
      width = host.clientWidth;height = width * source.height / source.width;
      // Bound the backing bitmap, not the composition's CSS width, on large displays.
      const ratio = Math.min(devicePixelRatio || 1, 2, 4096 / width);
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
        const shade = Math.pow(light, .82);
        const pool = GLYPH_BANDS[Math.min(GLYPH_BANDS.length - 1, Math.floor(shade * GLYPH_BANDS.length))];
        const seed = x + y * columns + 1;
        fields[(x + .5) / columns < HANDS_SPLIT ? 0 : 1].push({
          x: (x + .5) * cellX, y: (y + .5) * cellY, light: shade,
          phase: cellNoise(seed + 3571) * Math.PI * 2, pool, seed,
          glyph: Math.floor(cellNoise(seed) * pool.length), revision: 0,
          nextChange: clock + .5 + cellNoise(seed + 7919) * 8,
        });
      }
      breathe();draw();host.classList.add('is-ready');
    }
    function tick(now) {
      frame = 0;
      if (!visible || !active || paused || document.hidden || !loaded) return;
      clock += Math.min(now - (last || now), 100) / 1000;last = now;
      breathe();
      // Smooth whole-hand motion at display refresh rate; redraw the characters
      // at about 20 fps to avoid rasterizing two large canvases on every frame.
      if (now - lastDraw > 48) { lastDraw = now;draw(); }
      frame = requestAnimationFrame(tick);
    }
    function sync() { cancelAnimationFrame(frame);last = 0;lastDraw = 0;if (loaded) {breathe();draw();if (!paused && active && visible && !document.hidden) frame = requestAnimationFrame(tick);} }
    function updateTheme() {
      const styles = getComputedStyle(document.documentElement);
      handColors = ['--color-hand-machine', '--color-hand-human'].map(token => styles.getPropertyValue(token).trim());
      glyphWeight = styles.getPropertyValue('--hand-glyph-weight').trim() || 500;
      opacityFloor = parseFloat(styles.getPropertyValue('--hand-opacity-floor')) || .18;
      if (loaded) draw();
    }
    const themeObserver = new MutationObserver(updateTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    updateTheme();
    const stopProgress = progress.on('change', value => { const next = value < .72;if (next !== active) {active = next;sync();} });
    const change = event => { paused = event.matches;sync(); };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting;sync(); });observer.observe(host);
    const resizeObserver = new ResizeObserver(resize);resizeObserver.observe(host);
    preference.addEventListener('change', change);document.addEventListener('visibilitychange', sync);
    source.onload = () => { loaded = true;resize();sync(); };
    source.src = HANDS_SOURCE;
    return () => { cancelAnimationFrame(frame);stopProgress();observer.disconnect();resizeObserver.disconnect();themeObserver.disconnect();preference.removeEventListener('change', change);document.removeEventListener('visibilitychange', sync);source.onload = null; };
  }, [ref, left, right, progress]);
}

export default function GenesisHero({ onInterfaceChange }) {
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
  const titleProgress = useSpring(progress, { stiffness: 120, damping: 30, mass: .6 });
  const titleScale = useTransform(titleProgress, [.47, .84], [.97, 1]);
  const sloganOpacity = useTransform(titleProgress, [.56, .8], [0, 1]);
  const sloganY = useTransform(titleProgress, [.56, .8], [14, 0]);
  const introY = useTransform(progress, [.7, .94], [32, 0]);
  const introOpacity = useTransform(progress, [.7, .92], [0, 1]);
  useAsciiHands(field, left, right, progress);
  useEffect(() => { import('../assets/ascii-logo.js'); }, []);
  return <section id="cover" className="genesis" ref={ref} aria-labelledby="hero-title">
    <div className="genesis-stage">
      <div className="hands-field" ref={field} role="img" aria-label="左侧机器手对应亚当，右侧人手对应上帝，以创造亚当的姿态伸向彼此。两只手由 ASCII 字符组成，随滚动分开，社区标志从中间展开。">
        <img className="hands-fallback" src={HANDS_SOURCE} alt="" width="1536" height="1024" fetchPriority="high"/>
        <motion.div className="ascii-hand machine-hand left-hand" style={reduce ? {} : { x: leftX, rotate: leftRotate, opacity: handsOpacity }}><canvas ref={left} aria-hidden="true"/></motion.div>
        <motion.div className="ascii-hand human-hand right-hand" style={reduce ? {} : { x: rightX, rotate: rightRotate, opacity: handsOpacity }}><canvas ref={right} aria-hidden="true"/></motion.div>
      </div>
      <motion.div className="genesis-logo" style={reduce ? {} : { scale: logoScale, opacity: logoOpacity }}>
        <figure className="ascii-figure" data-source="assets/agenthub-galaxy.webp" aria-label="Agent Hub 社区的动态 ASCII 星系标志"><img className="ascii-fallback" src="assets/agenthub-galaxy.webp" width="720" height="720" alt=""/><canvas aria-hidden="true"/></figure>
      </motion.div>
      <motion.div className="genesis-wordmark wrap" style={reduce ? {} : { scale: titleScale }}><h1 id="hero-title" aria-label="Agent Hub"><span className="visually-hidden">Agent Hub</span><BrandWordmark progress={titleProgress}/></h1><motion.p className="genesis-slogan" lang="en" style={reduce ? {} : { opacity: sloganOpacity, y: sloganY }}><span className="slogan-human">Human</span>{' '}<span className="slogan-cross">×</span>{' '}<span className="slogan-agent">Agent</span></motion.p></motion.div>
      <motion.div className="genesis-introduction wrap" style={reduce ? {} : { y: introY, opacity: introOpacity }}><p>Agent Hub 是一个中文技术社群，<br/>专注 LLM Agent 的研究与应用。</p><span>成员来自基模团队与高校，分享研究进展和工程经验。</span></motion.div>
    </div>
  </section>;
}
