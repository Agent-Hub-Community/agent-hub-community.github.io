// A night sky of the community's questions. Every archived discussion is one star; the selected one gathers its
// ideas around it as smaller stars, joined to it by lines, with an amber star on a dashed line for what is still
// open. Hovering a star reports it for a preview; clicking selects it.
const FRAME_MS = 33;
const LINE = '#8fbbe0', STAR = '#eeedf0', OPEN = '#e0b86e';
// Star colours from blue-white through white to warm, as in a real sky.
const TINTS = ['#dfe8ff', '#eef3ff', '#ffffff', '#ffffff', '#fff4e6', '#ffe4c4'];
const HAZE = [[118, 140, 196], [146, 128, 196], [226, 196, 160]];

function noise(seed) {
  let value = Math.imul(seed ^ (seed >>> 16), 0x21f0aaad);
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  return ((value ^ (value >>> 15)) >>> 0) / 4294967296;
}
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const ease = t => 1 - Math.pow(1 - t, 3);

function glowSprite() {
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 64;
  const context = sprite.getContext('2d'), gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,.9)'); gradient.addColorStop(.18, 'rgba(255,255,255,.28)'); gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient; context.fillRect(0, 0, 64, 64);
  return sprite;
}

// The still part of the sky, painted once per size: a band of faint haze and thousands of dim stars crossing the
// sky like the Milky Way, dark dust lanes along it, and a sparse field of stars elsewhere. Brightness follows a
// steep power law, so most stars are barely visible and only a few stand out.
function paintBackdrop(target, width, height, ratio, compact) {
  const context = target.getContext('2d');
  target.width = Math.round(width * ratio); target.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const band = t => ({ x: -width * .08 + t * width * 1.16, y: height * (.86 - t * .7) + Math.sin(t * Math.PI * 1.3) * height * .06 });
  const across = Math.atan2(-height * .7, width * 1.16) + Math.PI / 2;
  context.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 70; i++) {
    const t = i / 69, point = band(t), core = 1 - Math.abs(t - .5) * 1.4;
    const offset = (noise(i * 37 + 1) - .5) * height * .12, radius = height * (.16 + noise(i * 37 + 2) * .18);
    const x = point.x + Math.cos(across) * offset, y = point.y + Math.sin(across) * offset;
    const [r, g, b] = HAZE[core > .55 && noise(i * 37 + 3) < .6 ? 2 : Math.floor(noise(i * 37 + 4) * 2)];
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${r},${g},${b},${.035 + core * .03})`); gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
    context.fillStyle = gradient; context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  // Tiny stars: most crowd the band, the rest are scattered.
  const count = Math.round(width * height / (compact ? 120 : 85));
  for (let i = 0; i < count; i++) {
    const seed = i * 7919 + 101, inBand = noise(seed) < .62;
    let x, y;
    if (inBand) {
      const point = band(noise(seed + 1)), spread = (noise(seed + 2) + noise(seed + 3) + noise(seed + 4) - 1.5) * height * .2;
      x = point.x + Math.cos(across) * spread; y = point.y + Math.sin(across) * spread;
    } else { x = noise(seed + 1) * width; y = noise(seed + 2) * height; }
    const magnitude = Math.pow(noise(seed + 5), 4);
    context.globalAlpha = .08 + magnitude * .6 + noise(seed + 6) * .1;
    context.fillStyle = TINTS[Math.floor(noise(seed + 7) * TINTS.length)];
    const size = .35 + magnitude * .9;
    context.fillRect(x, y, size, size);
  }
  // Dark dust lanes break up the band's glow.
  context.globalCompositeOperation = 'source-over';
  // Each lane is stretched along the band, so they read as filaments rather than spots.
  const along = across - Math.PI / 2;
  for (let i = 0; i < 34; i++) {
    const t = .08 + noise(i * 53 + 9) * .84, point = band(t), offset = (noise(i * 53 + 10) - .5) * height * .06;
    const x = point.x + Math.cos(across) * offset, y = point.y + Math.sin(across) * offset, radius = height * (.03 + noise(i * 53 + 11) * .05);
    context.save(); context.translate(x, y); context.rotate(along + (noise(i * 53 + 12) - .5) * .5); context.scale(3.2 + noise(i * 53 + 13) * 2.5, 1);
    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, 'rgba(4,7,13,.32)'); gradient.addColorStop(1, 'rgba(4,7,13,0)');
    context.fillStyle = gradient; context.fillRect(-radius, -radius, radius * 2, radius * 2);
    context.restore();
  }
  context.globalAlpha = 1;
}

// One question star per entry in `groups` (its tag); `weights[i]` (0–1) sets each star's size. `onHover(target)` and
// `onSelect(target)` receive a question or an idea of the open question, with its canvas position (see `nearest`).
export function createSky(canvas, { groups, weights, onHover, onSelect }) {
  const context = canvas.getContext('2d');
  if (!context) return null;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const sprite = glowSprite();
  const backdrop = document.createElement('canvas');
  let width = 0, height = 0, twinklers = [], questions = [], compact = false;
  let frame = 0, clock = 0, last = 0, visible = false, still = preference.matches;
  let selected = 0, ideas = 0, bloom = 1, hovered = null, focusIdea = null, drift = 0;

  function layout() {
    const box = canvas.parentElement.getBoundingClientRect();
    width = box.width; height = box.height;
    if (!width || !height) return false;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    compact = width < 600;
    paintBackdrop(backdrop, width, height + 48, ratio, compact);
    // A few brighter background stars twinkle; only these are drawn every frame.
    const twinkleCount = Math.round(clamp(width * height / 7000, 30, 140));
    twinklers = Array.from({ length: twinkleCount }, (_, index) => {
      const seed = index * 7919 + 13, magnitude = Math.pow(noise(seed + 3), 2.4);
      return { x: noise(seed) * width, y: noise(seed + 1) * (height + 40) - 20, r: .5 + magnitude * 1.1, alpha: .2 + magnitude * .55,
        depth: .5 + noise(seed + 7) * .5, speed: .6 + noise(seed + 9) * 1.6, phase: noise(seed + 11) * Math.PI * 2, tint: TINTS[Math.floor(noise(seed + 15) * TINTS.length)] };
    });
    // Questions that share a tag gather into one cluster; clusters sit on a jittered grid in shuffled order, and a
    // few rounds of separation keep every star clear of its neighbours.
    const tags = [...new Set(groups)];
    const marginX = compact ? 22 : 64, top = height * .2, bottom = height * .9;
    const columns = Math.max(3, Math.round(Math.sqrt(tags.length * (width - marginX * 2) / (bottom - top)))), rows = Math.ceil(tags.length / columns);
    const cells = Array.from({ length: columns * rows }, (_, cell) => cell).sort((a, b) => noise(a * 31 + 7) - noise(b * 31 + 7));
    const centers = new Map(tags.map((tag, index) => {
      const cell = cells[index], column = cell % columns, row = Math.floor(cell / columns), seed = cell * 7349 + 5;
      return [tag, { x: marginX + (column + .15 + noise(seed) * .7) * (width - marginX * 2) / columns, y: top + (row + .15 + noise(seed + 1) * .7) * (bottom - top) / rows }];
    }));
    const spread = compact ? 16 : 30;
    questions = groups.map((tag, index) => {
      const seed = index * 104729 + 3, center = centers.get(tag), angle = noise(seed) * Math.PI * 2, distance = Math.sqrt(noise(seed + 1)) * spread;
      return { x: center.x + Math.cos(angle) * distance * 1.3, y: center.y + Math.sin(angle) * distance,
        r: (compact ? 1 : 1.15) + Math.pow(weights[index] ?? .5, 1.6) * (compact ? 1.4 : 2), phase: noise(seed + 2) * Math.PI * 2, speed: .5 + noise(seed + 4),
        tint: TINTS[Math.floor(noise(seed + 6) * TINTS.length)], spikes: (weights[index] ?? 0) > .78 };
    });
    const gap = compact ? 18 : 30;
    for (let round = 0; round < 24; round++) {
      for (let a = 0; a < questions.length; a++) for (let b = a + 1; b < questions.length; b++) {
        const p = questions[a], q = questions[b], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || .01;
        if (d >= gap) continue;
        const push = (gap - d) / 2, ux = dx / d, uy = dy / d;
        p.x -= ux * push; p.y -= uy * push; q.x += ux * push; q.y += uy * push;
      }
      for (const star of questions) { star.x = clamp(star.x, marginX * .6, width - marginX * .6); star.y = clamp(star.y, top * .8, bottom); }
    }
    return true;
  }

  // Ideas sit on a ring around the selected star, kept inside the sky; the last position is the open point.
  function satellites() {
    const center = questions[selected];
    if (!center) return [];
    // The ideas fan out toward the middle of the sky, so a star near an edge still has room for them.
    const total = ideas + 1, radius = compact ? 48 : 84, arc = Math.PI * (total > 3 ? 1.15 : .95);
    const toward = Math.atan2((height * .55 - center.y) * 1.6, width / 2 - center.x);
    return Array.from({ length: total }, (_, index) => {
      const angle = toward - arc / 2 + index * arc / Math.max(1, total - 1);
      const distance = radius * (.85 + noise(selected * 131 + index) * .35);
      return { x: clamp(center.x + Math.cos(angle) * distance * 1.25, 10, width - 10), y: clamp(center.y + Math.sin(angle) * distance, 10, height - 10), open: index === ideas };
    });
  }

  function drawStar(x, y, radius, color, alpha, halo) {
    if (halo > 0) { context.globalAlpha = Math.min(1, alpha * halo); context.drawImage(sprite, x - radius * 7, y - radius * 7, radius * 14, radius * 14); }
    context.globalAlpha = Math.min(1, alpha); context.fillStyle = color;
    context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill();
  }

  // Four thin diffraction spikes, as bright stars show in photographs.
  function spikes(x, y, radius, color, alpha) {
    const length = 6 + radius * 5;
    context.strokeStyle = color; context.lineWidth = .7;
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const gradient = context.createLinearGradient(x - dx * length, y - dy * length, x + dx * length, y + dy * length);
      gradient.addColorStop(0, 'rgba(255,255,255,0)'); gradient.addColorStop(.5, color); gradient.addColorStop(1, 'rgba(255,255,255,0)');
      context.strokeStyle = gradient; context.globalAlpha = alpha;
      context.beginPath(); context.moveTo(x - dx * length, y - dy * length); context.lineTo(x + dx * length, y + dy * length); context.stroke();
    }
  }

  function draw(delta) {
    context.clearRect(0, 0, width, height);
    const rect = canvas.getBoundingClientRect();
    drift = still ? 0 : clamp((rect.top + rect.height / 2 - innerHeight / 2) * .05, -24, 24);
    context.globalAlpha = 1;
    context.drawImage(backdrop, 0, -24 + drift * .45, width, height + 48);
    for (const star of twinklers) {
      const y = star.y + drift * star.depth;
      if (y < -4 || y > height + 4) continue;
      const twinkle = still ? 1 : .55 + .45 * Math.pow(.5 + .5 * Math.sin(clock * star.speed + star.phase), 2);
      if (star.r > 1.1) drawStar(star.x, y, star.r * .7, star.tint, star.alpha * twinkle, .45);
      else { context.globalAlpha = star.alpha * twinkle; context.fillStyle = star.tint; context.fillRect(star.x, y, star.r * 1.3, star.r * 1.3); }
    }
    bloom = still ? 1 : Math.min(1, bloom + delta * 1.6);
    const grow = ease(bloom), center = questions[selected];
    // The selected question's ideas: lines first, then their stars, numbered to match the list below.
    if (center) {
      const points = satellites();
      context.lineWidth = 1;
      points.forEach((point, index) => {
        const reach = clamp(grow * 1.5 - index * .1, 0, 1);
        if (reach <= 0) return;
        const lit = focusIdea === null || focusIdea === index;
        context.setLineDash(point.open ? [3, 5] : []);
        context.strokeStyle = point.open ? OPEN : LINE; context.globalAlpha = (lit ? .55 : .2) * reach;
        context.beginPath(); context.moveTo(center.x, center.y); context.lineTo(center.x + (point.x - center.x) * reach, center.y + (point.y - center.y) * reach); context.stroke();
      });
      context.setLineDash([]);
      context.font = `500 10px 'AgentHub Grotesk', 'Inter Variable', sans-serif`; context.textAlign = 'center'; context.textBaseline = 'middle';
      points.forEach((point, index) => {
        const reach = clamp(grow * 1.5 - index * .1 - .3, 0, 1);
        if (reach <= 0) return;
        const lit = focusIdea === null || focusIdea === index;
        const pulse = point.open && !still ? .75 + .25 * Math.sin(clock * 2.2) : 1;
        drawStar(point.x, point.y, focusIdea === index ? 2.6 : 1.9, point.open ? OPEN : STAR, (lit ? .95 : .45) * reach * pulse, focusIdea === index ? 1.4 : .7);
        if (!point.open) {
          context.globalAlpha = (lit ? .7 : .3) * reach; context.fillStyle = LINE;
          context.fillText(String(index + 1), point.x + (point.x >= center.x ? 9 : -9), point.y - 8);
        }
      });
    }
    // Every question; the selected and hovered ones carry a ring.
    questions.forEach((star, index) => {
      const twinkle = still ? 1 : .78 + .22 * Math.sin(clock * star.speed + star.phase);
      const isSelected = index === selected, isHovered = index === hovered;
      const alpha = isSelected ? 1 : isHovered ? .95 : (.55 + star.r * .12) * twinkle;
      const radius = isSelected ? star.r + 1.1 : isHovered ? star.r + .6 : star.r;
      if (star.spikes || isSelected) spikes(star.x, star.y, radius, star.tint, alpha * .5);
      drawStar(star.x, star.y, radius, isSelected ? STAR : star.tint, alpha, isSelected ? 1.5 : isHovered ? 1.1 : .45 + star.r * .12);
      if (isSelected || isHovered) {
        context.globalAlpha = isSelected ? .5 : .35; context.strokeStyle = isSelected ? STAR : LINE; context.lineWidth = 1;
        context.beginPath(); context.arc(star.x, star.y, star.r + (isSelected ? 7 + (still ? 0 : Math.sin(clock * 1.6)) : 6), 0, Math.PI * 2); context.stroke();
      }
    });
    context.globalAlpha = 1;
  }

  function tick(now) {
    frame = 0;
    if (!visible || still || document.hidden) return;
    if (now - last >= FRAME_MS) {
      const delta = Math.min(now - (last || now), 100) / 1000;
      last = now; clock += delta; draw(delta);
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    if (visible && !still && !document.hidden) frame = requestAnimationFrame(tick);
    else draw(0);
  }
  // What the pointer is over: one of the open question's ideas first, then the nearest question. Touch reaches
  // further. Returns { kind: 'idea' | 'question', index, x, y } or null.
  function nearest(event) {
    const rect = canvas.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
    const reach = event.pointerType === 'touch' ? 26 : 16;
    let best = null, distance = reach * reach;
    if (bloom > .6) satellites().forEach((point, index) => {
      const d = (point.x - x) ** 2 + (point.y - y) ** 2;
      if (d < distance) { distance = d; best = { kind: 'idea', index, x: point.x, y: point.y }; }
    });
    if (best) return best;
    questions.forEach((star, index) => {
      const d = (star.x - x) ** 2 + (star.y - y) ** 2;
      if (d < distance) { distance = d; best = { kind: 'question', index, x: star.x, y: star.y }; }
    });
    return best;
  }
  let reported = '';
  function report(target) {
    const key = target ? target.kind + target.index : '';
    if (key === reported) return;
    reported = key; hovered = target?.kind === 'question' ? target.index : null;
    canvas.style.cursor = target ? 'pointer' : '';
    onHover(target);
    if (!frame) draw(0);
  }
  const move = event => { if (event.pointerType === 'mouse') report(nearest(event)); };
  const leave = () => report(null);
  const click = event => { const target = nearest(event); if (target) onSelect(target); };

  const reduce = event => { still = event.matches; sync(); };
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { rootMargin: '80px' });
  const resizer = new ResizeObserver(() => { if (layout()) draw(0); });
  observer.observe(canvas); resizer.observe(canvas.parentElement);
  canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerleave', leave); canvas.addEventListener('click', click);
  preference.addEventListener('change', reduce); document.addEventListener('visibilitychange', sync);
  if (layout()) draw(0);
  return {
    // Select a question and say how many ideas to gather around it; the ring grows in again.
    select(index, ideaCount) { if (index !== selected || ideaCount !== ideas) bloom = 0; selected = index; ideas = ideaCount; if (!frame) draw(0); },
    // Brighten one idea while it is hovered or focused in the list.
    focusIdea(index) { focusIdea = index; if (!frame) draw(0); },
    dispose() {
      cancelAnimationFrame(frame); observer.disconnect(); resizer.disconnect();
      canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); canvas.removeEventListener('click', click);
      preference.removeEventListener('change', reduce); document.removeEventListener('visibilitychange', sync);
    },
  };
}
