// "Build it together" as a character field, in the opening's glyphs and hand colors. Terms from each discussion
// drift down and dissolve into its braid: a human strand and an agent strand that cross over and under, thicken,
// and close into one point on the card below. Light glyphs read as loose thoughts, dense glyphs as woven work.
const GLYPH_BANDS = [".,:'`", ':;!|il', 'irslt/\\', 'vxzc+=*', 'aeknu235', 'AXYhHZ4', 'GMODU69', 'SW%Q8B&', '@#MWB8&'];
const FRAME_MS = 42, WAVELENGTH = 112, WORDS_PER_BRAID = 3;
// People in the opening's warm white; agents in the accent blue the cards use for their markers.
const COLORS = ['--color-hand-human', '--color-commons-agent'], FALLBACK = ['#eeedf0', '#8fbbe0'];

function noise(seed) {
  let value = Math.imul(seed ^ (seed >>> 16), 0x21f0aaad);
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  return ((value ^ (value >>> 15)) >>> 0) / 4294967296;
}
const smooth = t => t * t * (3 - 2 * t);
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

// `targets()` returns the horizontal center and width of each braid's card in canvas coordinates; `terms` lists the
// words that fall into each braid.
export function createLoom(canvas, targets, terms) {
  const context = canvas.getContext('2d');
  if (!context) return null;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, cellX = 8, cellY = 13, braids = [], words = [], colors = FALLBACK, weight = 500;
  let frame = 0, clock = 3, last = 0, lastDraw = 0, visible = false, still = preference.matches, focus = null;
  const glow = terms.map(() => 1);

  function strandX(braid, y, strand) {
    const t = clamp(y / height, 0, 1), ease = smooth(t);
    // The strands keep crossing most of the way down, then close to a single point where the braid meets its card.
    const close = smooth(clamp((t - .68) / .32, 0, 1));
    const amplitude = braid.span * (.55 + .45 * (1 - ease)) * (1 - close);
    const phase = y * Math.PI * 2 / WAVELENGTH - clock * .9 + braid.index * 2.1 + strand * Math.PI;
    return { x: braid.x + amplitude * Math.sin(phase), depth: Math.cos(phase), t, ease };
  }
  function spawn(word, stage) {
    // A single braid (narrow screens) gathers the terms of every discussion.
    const pool = braids.length === 1 ? terms.flat() : terms[word.braid];
    word.term = pool[Math.floor(noise(word.seed) * pool.length)];
    word.strand = noise(word.seed + 5) < .5 ? 0 : 1;
    word.offset = (noise(word.seed + 11) - .5) * 2.2;
    word.speed = 15 + noise(word.seed + 13) * 10;
    word.y = stage * height * .7 - cellY;
  }
  function resize() {
    const box = canvas.parentElement.getBoundingClientRect();
    width = box.width; height = box.height;
    if (!width || !height) return;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    cellX = width < 700 ? 7 : 8.5; cellY = cellX * 1.55;
    braids = targets().map((target, index) => ({ index, x: target.x, span: Math.min(target.width * .22, 96) }));
    // Stagger the words so each braid always has one arriving, one falling and one dissolving.
    const perBraid = braids.length === 1 ? WORDS_PER_BRAID + 1 : WORDS_PER_BRAID;
    words = braids.flatMap(braid => Array.from({ length: perBraid }, (_, slot) => {
      const word = { braid: braid.index, seed: braid.index * 7919 + slot * 104729 + 1 };
      spawn(word, slot / perBraid + noise(word.seed + 17) * .2);
      return word;
    }));
    const styles = getComputedStyle(canvas);
    colors = COLORS.map((token, index) => styles.getPropertyValue(token).trim() || FALLBACK[index]);
    weight = styles.getPropertyValue('--hand-glyph-weight').trim() || 500;
    draw(0);
  }
  function glyph(column, row, band) {
    // Each cell keeps its character for a few seconds, then changes, as the opening's fields do.
    const tick = Math.floor(clock / 3.5 + noise(column * 131 + row * 977) * 4);
    const pool = GLYPH_BANDS[band];
    return pool[Math.floor(noise(column * 7349 + row * 104729 + tick * 13) * pool.length)];
  }
  function draw(delta) {
    context.clearRect(0, 0, width, height);
    for (let index = 0; index < glow.length; index++) {
      const goal = focus === null ? 1 : focus === index || braids.length === 1 ? 1.6 : .25;
      glow[index] += (goal - glow[index]) * (still ? 1 : Math.min(1, delta * 7));
    }
    // A faint dot field, the same texture as the section above.
    context.fillStyle = colors[1];
    context.globalAlpha = .07;
    for (let y = cellY; y < height; y += cellY * 2) for (let x = cellX * 1.5; x < width; x += cellX * 3) context.fillRect(Math.round(x), Math.round(y), 1, 1);

    context.font = `${weight} ${cellY * .8}px SFMono-Regular, Consolas, monospace`;
    context.textAlign = 'center'; context.textBaseline = 'middle';
    // Words from the discussion: readable while they fall, then letter by letter taken into the weave.
    for (const word of words) {
      const braid = braids[word.braid];
      if (!braid) continue;
      if (!still) {
        word.y += word.speed * delta;
        if (word.y > height * .72) { word.seed += 104729; spawn(word, 0); }
      }
      const t = word.y / height, pull = smooth(clamp(t / .6, 0, 1));
      const x = braid.x + word.offset * braid.span * (1 - pull) + (strandX(braid, word.y, word.strand).x - braid.x) * pull;
      const dissolve = clamp((t - .28) / .32, 0, 1);
      const alpha = clamp(t / .08 + .2, 0, 1) * (1 - clamp((t - .56) / .16, 0, 1)) * .78 * glow[word.braid];
      if (alpha <= .01) continue;
      const row = Math.round(word.y / cellY), start = Math.round(x / cellX) - Math.floor(word.term.length / 2);
      context.fillStyle = colors[word.strand];
      for (let k = 0; k < word.term.length; k++) {
        const taken = noise(word.seed + k * 31) < dissolve;
        context.globalAlpha = Math.min(1, alpha * (taken ? .6 : 1));
        context.fillText(taken ? glyph(start + k, row, 4) : word.term[k], (start + k + .5) * cellX, (row + .5) * cellY);
      }
    }
    // Braids: two ribbons, dense at the center and light at the edges, the front one drawn over the back.
    const rows = Math.ceil(height / cellY);
    for (const braid of braids) {
      for (let row = 0; row < rows; row++) {
        const y = (row + .5) * cellY;
        const strands = [0, 1].map(strand => ({ strand, ...strandX(braid, y, strand) })).sort((a, b) => a.depth - b.depth);
        for (const { strand, x, depth, t, ease } of strands) {
          const presence = clamp((t - .04) / .3, 0, 1);
          if (presence <= 0) continue;
          const knot = clamp((t - .84) / .16, 0, 1);
          const half = Math.max(0, Math.round((.3 + ease * 1.3) * (1 - knot)));
          const center = Math.round(x / cellX), front = depth > 0;
          context.fillStyle = colors[strand];
          for (let offset = -half; offset <= half; offset++) {
            const profile = 1 - Math.abs(offset) / (half + 1);
            const band = clamp(Math.round(ease * 4 + profile * 3 + (front ? 1 : -1)), 0, GLYPH_BANDS.length - 1);
            context.globalAlpha = Math.min(1, presence * (front ? .95 : .34) * (.3 + profile * .7) * (.5 + ease * .5) * glow[braid.index]);
            context.fillText(glyph(center + offset, row, band), (center + offset + .5) * cellX, y);
          }
        }
      }
      // Where the braid closes, a point on the card's edge.
      context.globalAlpha = Math.min(1, .9 * glow[braid.index]);
      context.fillStyle = colors[0];
      context.beginPath(); context.arc(braid.x, height - 3, 3, 0, Math.PI * 2); context.fill();
      context.globalAlpha = Math.min(1, .16 * glow[braid.index]);
      context.beginPath(); context.arc(braid.x, height - 3, 8, 0, Math.PI * 2); context.fill();
    }
    context.globalAlpha = 1;
  }
  function tick(now) {
    frame = 0;
    if (!visible || still || document.hidden) return;
    if (now - lastDraw >= FRAME_MS) {
      const delta = Math.min(now - (last || now), 100) / 1000;
      last = now; lastDraw = now; clock += delta; draw(delta);
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    if (visible && !still && !document.hidden) frame = requestAnimationFrame(tick);
  }
  const reduce = event => { still = event.matches; draw(0); sync(); };
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { rootMargin: '80px' });
  const resizer = new ResizeObserver(resize);
  observer.observe(canvas); resizer.observe(canvas.parentElement);
  preference.addEventListener('change', reduce); document.addEventListener('visibilitychange', sync);
  resize();
  return {
    // Brighten one braid while its card is hovered or focused; null restores all three.
    highlight(index) { focus = index; if (still || !visible) draw(1); },
    dispose() { cancelAnimationFrame(frame); observer.disconnect(); resizer.disconnect(); preference.removeEventListener('change', reduce); document.removeEventListener('visibilitychange', sync); },
  };
}
