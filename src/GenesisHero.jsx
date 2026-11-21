import { useEffect, useRef } from 'react';
import { ArrowDownRight } from 'lucide-react';
import BrandWordmark, { applyWordmarkProgress } from './BrandWordmark';
import { useHomeLanguage } from './HomeLanguage';
import { useThemePack } from './ThemePack';
import './genesis.css';

const HANDS_SOURCE = 'assets/human-machine-creation.webp';
const HANDS_SPLIT = .495;
// Similar visual densities preserve shading without turning flat areas into
// long strings of the same character. Every glyph is printable ASCII.
const GLYPH_BANDS = [".,:'`", ':;!|il', 'irslt/\\', 'vxzc+=*', 'aeknu235', 'AXYhHZ4', 'GMODU69', 'SW%Q8B&', '@#MWB8&'];

function cellNoise(seed) {
  let value = Math.imul(seed ^ (seed >>> 16), 0x21f0aaad);
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  return ((value ^ (value >>> 15)) >>> 0) / 4294967296;
}

function lerpRange(value, input, output) {
  if (value <= input[0]) return output[0];
  const last = input.length - 1;
  if (value >= input[last]) return output[last];
  for (let i = 0; i < last; i++) {
    if (value <= input[i + 1]) {
      const t = (value - input[i]) / (input[i + 1] - input[i]);
      return output[i] + (output[i + 1] - output[i]) * t;
    }
  }
  return output[last];
}

// Sample one grayscale plate into two independent character fields. Animation
// changes the glyphs and their positions; the raster never appears over them.
// Glyphs are pre-rasterized onto tiny Retina sprite atlases so 20 fps redraws
// use fast drawImage blits instead of thousands of fillText calls per frame.
function useAsciiHands(ref, left, right, activeRef, glyphBands) {
  useEffect(() => {
    const bands = Array.isArray(glyphBands) && glyphBands.length >= 4 ? glyphBands : GLYPH_BANDS;
    const charset = [];
    const charIndex = new Map();
    const poolIndices = bands.map(band => {
      const arr = new Uint8Array(band.length);
      for (let i = 0; i < band.length; i++) {
        const ch = band[i];
        let idx = charIndex.get(ch);
        if (idx === undefined) { idx = charset.length; charIndex.set(ch, idx); charset.push(ch); }
        arr[i] = idx;
      }
      return arr;
    });
    const host = ref.current;
    const canvases = [left.current, right.current];
    const contexts = canvases.map(canvas => canvas.getContext('2d'));
    if (contexts.some(context => !context)) return;
    const sample = document.createElement('canvas');
    const sampler = sample.getContext('2d', { willReadFrequently: true });
    const atlases = [document.createElement('canvas'), document.createElement('canvas')];
    const atlasContexts = atlases.map(canvas => canvas.getContext('2d'));
    const alphaLut = new Float32Array(256);
    const source = new Image();
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let fields = [[], []], width = 0, height = 0, cellX = 0, cellY = 0, ratio = 1;
    let spriteW = 0, spriteH = 0, bw = 0, bh = 0;
    let handColors = [], glyphWeight = 500, opacityFloor = .18;
    let frame = 0, clock = 0, last = 0, lastDraw = 0, loaded = false, visible = true;
    let paused = preference.matches, active = activeRef.current.active;

    function rebuildAlphaLut() {
      const span = .98 - opacityFloor;
      for (let i = 0; i < 256; i++) {
        alphaLut[i] = Math.min(.98, opacityFloor + Math.pow(i / 255, .75) * span);
      }
    }
    function rebuildAtlases() {
      if (!loaded || !cellY) return;
      spriteW = Math.max(8, Math.ceil(cellX * 1.6));
      spriteH = Math.max(8, Math.ceil(cellY * 1.6));
      bw = Math.ceil(spriteW * ratio);
      bh = Math.ceil(spriteH * ratio);
      const font = `${glyphWeight} ${cellY * .82}px SFMono-Regular, Consolas, monospace`;
      for (let hand = 0; hand < 2; hand++) {
        const atlas = atlases[hand], ctx = atlasContexts[hand];
        atlas.width = charset.length * bw;
        atlas.height = bh;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, charset.length * spriteW, spriteH);
        ctx.font = font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = handColors[hand];
        const cy = spriteH * .5;
        for (let i = 0; i < charset.length; i++) {
          ctx.fillText(charset[i], (i + .5) * spriteW, cy);
        }
      }
    }
    function breathe() {
      const amplitude = Math.min(8, Math.max(3, width * .004));
      canvases.forEach((canvas, hand) => {
        // The inner canvas breathes independently of its parent's scroll motion.
        // A slight phase offset keeps the two hands from moving in lockstep.
        const phase = clock * Math.PI * 2 / 7.8 + hand * .42;
        const breath = paused ? 0 : Math.sin(phase);
        const turn = breath * (hand ? -.24 : .28);
        canvas.style.transform = `translate3d(0, ${(-breath * amplitude).toFixed(2)}px, 0) rotate(${turn.toFixed(3)}deg)`;
      });
    }
    function draw() {
      const t1 = clock * .8, t2 = clock * .4, t3 = clock * .6;
      for (let hand = 0; hand < 2; hand++) {
        const context = contexts[hand], atlas = atlases[hand], list = fields[hand];
        context.clearRect(0, 0, width, height);
        for (let i = 0; i < list.length; i++) {
          const point = list[i];
          if (!paused && clock >= point.nextChange) {
            point.revision += 1;
            const random = cellNoise(point.seed + point.revision * 104729);
            point.glyph = (point.glyph + 1 + Math.floor(random * (point.pool.length - 1))) % point.pool.length;
            point.nextChange = clock + 3.5 + cellNoise(point.seed + point.revision * 130363) * 5;
          }
          const wave = Math.sin(point.kx - t1) * Math.sin(point.ky + t2);
          const li = ((point.light + wave * .025) * 255) | 0;
          context.globalAlpha = alphaLut[li < 0 ? 0 : li > 255 ? 255 : li];
          const si = point.pool[point.glyph];
          context.drawImage(atlas, si * bw, 0, bw, bh,
            point.dx0 + Math.sin(t3 + point.phase) * .3,
            point.dy0 + wave * .35, spriteW, spriteH);
        }
        context.globalAlpha = 1;
      }
    }
    function resize() {
      if (!loaded) return;
      width = host.clientWidth;
      if (!width) return;
      height = width * source.height / source.width;
      // Bound the backing bitmap, not the composition's CSS width, on large displays.
      ratio = Math.min(devicePixelRatio || 1, 2, 4096 / width);
      canvases.forEach((canvas, index) => {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        contexts[index].setTransform(ratio, 0, 0, ratio, 0, 0);
      });
      const columns = Math.max(100, Math.min(380, Math.round(width / 5.2)));
      const rows = Math.round(columns * source.height / source.width * .55);
      cellX = width / columns; cellY = height / rows;
      rebuildAtlases();
      const halfW = spriteW * .5, halfH = spriteH * .5;
      sample.width = columns; sample.height = rows; sampler.drawImage(source, 0, 0, columns, rows);
      const pixels = sampler.getImageData(0, 0, columns, rows).data;
      fields = [[], []];
      for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
        const i = (y * columns + x) * 4;
        const light = (pixels[i] * .2126 + pixels[i + 1] * .7152 + pixels[i + 2] * .0722) / 255;
        if (light < .055) continue;
        const shade = Math.pow(light, .82);
        const pool = poolIndices[Math.min(poolIndices.length - 1, Math.floor(shade * poolIndices.length))];
        const seed = x + y * columns + 1;
        const px = (x + .5) * cellX, py = (y + .5) * cellY;
        fields[(x + .5) / columns < HANDS_SPLIT ? 0 : 1].push({
          dx0: px - halfW, dy0: py - halfH, kx: px * .012, ky: py * .014, light: shade,
          phase: cellNoise(seed + 3571) * Math.PI * 2, pool, seed,
          glyph: Math.floor(cellNoise(seed) * pool.length), revision: 0,
          nextChange: clock + .5 + cellNoise(seed + 7919) * 8,
        });
      }
      breathe(); draw(); host.classList.add('is-ready');
    }
    function tick(now) {
      frame = 0;
      if (!visible || !active || paused || document.hidden || !loaded) return;
      clock += Math.min(now - (last || now), 100) / 1000; last = now;
      breathe();
      // Smooth whole-hand motion at display refresh rate; redraw the characters
      // at about 20 fps to avoid rasterizing two large canvases on every frame.
      if (now - lastDraw > 48) { lastDraw = now; draw(); }
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(frame); last = 0; lastDraw = 0;
      if (loaded) {
        breathe(); draw();
        if (!paused && active && visible && !document.hidden) frame = requestAnimationFrame(tick);
      }
    }
    function updateTheme() {
      const styles = getComputedStyle(document.documentElement);
      handColors = ['--color-hand-machine', '--color-hand-human'].map(token => styles.getPropertyValue(token).trim());
      glyphWeight = styles.getPropertyValue('--hand-glyph-weight').trim() || 500;
      opacityFloor = parseFloat(styles.getPropertyValue('--hand-opacity-floor')) || .18;
      rebuildAlphaLut();
      if (loaded) { rebuildAtlases(); draw(); }
    }
    activeRef.current.onChange = next => {
      if (next !== active) { active = next; sync(); }
    };
    const themeObserver = new MutationObserver(updateTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-theme-pack', 'style'] });
    window.addEventListener('agenthub:theme', updateTheme);
    updateTheme();
    const change = event => { paused = event.matches; sync(); };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }); observer.observe(host);
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
    preference.addEventListener('change', change); document.addEventListener('visibilitychange', sync);
    source.onload = () => { loaded = true; resize(); sync(); };
    source.src = HANDS_SOURCE;
    return () => {
      cancelAnimationFrame(frame); activeRef.current.onChange = null; observer.disconnect(); resizeObserver.disconnect(); themeObserver.disconnect();
      window.removeEventListener('agenthub:theme', updateTheme); preference.removeEventListener('change', change);
      document.removeEventListener('visibilitychange', sync); source.onload = null;
    };
  }, [ref, left, right, activeRef, glyphBands]);
}

export default function GenesisHero({ onInterfaceChange }) {
  const { copy } = useHomeLanguage();
  const themePack = useThemePack();
  const glyphBands = themePack?.home?.asciiHands?.glyphBands;
  const ref = useRef(null), field = useRef(null), left = useRef(null), right = useRef(null);
  const leftLayer = useRef(null), rightLayer = useRef(null), logoLayer = useRef(null);
  const wordmarkLayer = useRef(null), sloganLayer = useRef(null), introLayer = useRef(null);
  const letterRefs = useRef([]);
  const handsState = useRef({ active: true, onChange: null });

  // Drive all scroll-coupled layers directly via rAF + damped spring (zero React re-renders,
  // zero motion library overhead, and stops completely when scroll settles).
  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = preference.matches;
    let target = 0, springPos = 0, springVel = 0;
    let raf = 0, lastTime = 0, previousVisible;

    function measure() {
      const rect = section.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      return travel > 0 ? Math.max(0, Math.min(1, -rect.top / travel)) : 0;
    }
    function paint(p, sp) {
      const visible = Boolean(reduced || p >= .72);
      if (visible !== previousVisible) { previousVisible = visible; onInterfaceChange?.(visible); }
      const nextActive = !reduced && p < .72;
      handsState.current.active = nextActive;
      handsState.current.onChange?.(nextActive);
      if (reduced) {
        for (const el of [leftLayer.current, rightLayer.current, logoLayer.current, wordmarkLayer.current, sloganLayer.current, introLayer.current]) {
          if (el) { el.style.opacity = ''; el.style.transform = ''; }
        }
        for (const el of letterRefs.current) if (el) { el.style.opacity = ''; el.style.transform = ''; }
        return;
      }
      const lx = lerpRange(p, [0, .12, .67], [0, -2, -57]);
      const rx = lerpRange(p, [0, .12, .67], [0, 2, 57]);
      const lr = lerpRange(p, [0, .65], [0, -12]);
      const rr = lerpRange(p, [0, .65], [0, 12]);
      const ho = lerpRange(p, [0, .45, .7], [1, .9, 0]);
      if (leftLayer.current) {
        leftLayer.current.style.opacity = String(ho);
        leftLayer.current.style.transform = (lx === 0 && lr === 0) ? 'none' : `translate3d(${lx.toFixed(2)}%, 0, 0) rotate(${lr.toFixed(2)}deg)`;
      }
      if (rightLayer.current) {
        rightLayer.current.style.opacity = String(ho);
        rightLayer.current.style.transform = (rx === 0 && rr === 0) ? 'none' : `translate3d(${rx.toFixed(2)}%, 0, 0) rotate(${rr.toFixed(2)}deg)`;
      }
      const ls = lerpRange(p, [0, .06, .52, .86], [.025, .025, .82, 1]);
      const lo = lerpRange(p, [0, .05, .22], [0, 0, 1]);
      if (logoLayer.current) {
        logoLayer.current.style.opacity = String(lo);
        logoLayer.current.style.transform = `scale(${ls.toFixed(4)})`;
      }
      const ts = lerpRange(sp, [.47, .84], [.97, 1]);
      if (wordmarkLayer.current) wordmarkLayer.current.style.transform = `scale(${ts.toFixed(4)})`;
      applyWordmarkProgress(letterRefs.current, sp);
      const so = lerpRange(sp, [.56, .8], [0, 1]);
      const sy = lerpRange(sp, [.56, .8], [14, 0]);
      if (sloganLayer.current) {
        sloganLayer.current.style.opacity = String(so);
        sloganLayer.current.style.transform = `translate3d(0, ${sy.toFixed(2)}px, 0)`;
      }
      const iy = lerpRange(p, [.7, .94], [32, 0]);
      const io = lerpRange(p, [.7, .92], [0, 1]);
      if (introLayer.current) {
        introLayer.current.style.opacity = String(io);
        introLayer.current.style.transform = `translate3d(0, ${iy.toFixed(2)}px, 0)`;
      }
    }
    function step(now) {
      raf = 0;
      const dt = Math.min((now - (lastTime || now)) / 1000, .032);
      lastTime = now;
      if (!reduced && dt > 0) {
        // Two sub-steps keep stiffness=120, damping=30, mass=0.6 stable at any refresh rate.
        const sub = dt * .5;
        for (let i = 0; i < 2; i++) {
          const acc = (120 * (target - springPos) - 30 * springVel) / .6;
          springVel += acc * sub;
          springPos += springVel * sub;
        }
      }
      const settled = reduced || (Math.abs(target - springPos) < .0002 && Math.abs(springVel) < .0002);
      if (settled) { springPos = target; springVel = 0; }
      paint(target, springPos);
      if (!settled) raf = requestAnimationFrame(step);
    }
    function onScroll() {
      target = measure();
      if (reduced) { springPos = target; springVel = 0; paint(target, springPos); return; }
      if (!raf) { lastTime = performance.now(); raf = requestAnimationFrame(step); }
    }
    function onMotionChange(event) {
      reduced = event.matches;
      target = measure(); springPos = target; springVel = 0;
      paint(target, springPos);
    }
    target = measure(); springPos = target;
    paint(target, springPos);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    preference.addEventListener('change', onMotionChange);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      preference.removeEventListener('change', onMotionChange);
    };
  }, [onInterfaceChange]);

  useAsciiHands(field, left, right, handsState, glyphBands);
  useEffect(() => {
    const load = () => { import('../assets/ascii-logo.js'); };
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(load, { timeout: 600 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(load, 120);
    return () => clearTimeout(id);
  }, []);

  return <section id="cover" className="genesis" ref={ref} aria-labelledby="hero-title">
    <div className="genesis-stage">
      <div className="hands-field" ref={field} role="img" aria-label={copy.handsAlt}>
        <img className="hands-fallback" src={HANDS_SOURCE} alt="" width="768" height="512" fetchPriority="high"/>
        <div className="ascii-hand machine-hand left-hand" ref={leftLayer} style={{ opacity: 1, transform: 'none' }}><canvas ref={left} aria-hidden="true"/></div>
        <div className="ascii-hand human-hand right-hand" ref={rightLayer} style={{ opacity: 1, transform: 'none' }}><canvas ref={right} aria-hidden="true"/></div>
      </div>
      <div className="genesis-logo" ref={logoLayer} style={{ opacity: 0, transform: 'scale(0.025)' }}>
        <figure className="ascii-figure" data-source="assets/agenthub-galaxy.webp" aria-label={copy.galaxyAlt}><img className="ascii-fallback" src="assets/agenthub-galaxy.webp" width="512" height="512" loading="lazy" decoding="async" alt=""/><canvas aria-hidden="true"/></figure>
      </div>
      <div className="genesis-wordmark wrap" ref={wordmarkLayer} style={{ transform: 'scale(0.97)' }}><h1 id="hero-title" aria-label="Agent Hub"><span className="visually-hidden">Agent Hub</span><BrandWordmark letterRefs={letterRefs}/></h1><p className="genesis-slogan" ref={sloganLayer} lang="en" style={{ opacity: 0, transform: 'translate3d(0, 14px, 0)' }}><span className="slogan-human">Human</span>{' '}<span className="slogan-cross">×</span>{' '}<span className="slogan-agent">Agent</span></p></div>
      <div className="genesis-introduction wrap" ref={introLayer} style={{ opacity: 0, transform: 'translate3d(0, 32px, 0)' }}><p>{copy.genesis[0]}<br/>{copy.genesis[1]}</p></div>
      <a className="genesis-portal" href="#about">{copy.explore}<ArrowDownRight size={17} aria-hidden="true"/></a>
    </div>
  </section>;
}
