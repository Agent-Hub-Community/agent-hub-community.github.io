// A night sky above the three discussions. Each discussion is a constellation: its brightest star is the question,
// two stars are the positions taken, and an amber star, joined only by a dashed line, is what is still open.
// Hovering a card or a constellation draws its lines in and names its stars; clicking a constellation goes to its card.
const FRAME_MS = 33;
const LINE = '#8fbbe0', STAR = '#eeedf0', OPEN = '#e0b86e', LABEL = '#c8d0d8';
const TINTS = ['#eeedf0', '#eeedf0', '#eeedf0', '#eeedf0', '#b7cddd', '#f3dcc0'];
// Hand-placed shapes in a unit box; roles map to the card's question, its two turns and its open point.
const SHAPES = [
  { lift: -.04, stars: [['question', 0, -.18], ['turn', -.78, .26], ['turn', .58, .42], ['open', .96, -.58], ['minor', -.34, .74], ['minor', -.98, -.42]],
    lines: [[0, 1], [0, 2], [1, 4], [1, 5]], open: [0, 3] },
  { lift: .07, stars: [['question', -.08, .08], ['turn', -.82, -.46], ['turn', .72, -.22], ['open', .34, .82], ['minor', -.58, .66], ['minor', .98, .3]],
    lines: [[0, 1], [0, 2], [1, 4], [2, 5]], open: [0, 3] },
  { lift: -.02, stars: [['question', .14, -.12], ['turn', -.66, -.62], ['turn', -.5, .52], ['open', .88, .46], ['minor', .78, -.72], ['minor', -.98, .02]],
    lines: [[0, 1], [0, 2], [0, 4], [2, 5]], open: [0, 3] },
];

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

// `targets()` gives each constellation's horizontal center and available width in canvas coordinates.
export function createSky(canvas, { targets, onHover, onSelect }) {
  const context = canvas.getContext('2d');
  if (!context) return null;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const sprite = glowSprite();
  let width = 0, height = 0, stars = [], constellations = [], labels = [], compact = false;
  let frame = 0, clock = 0, last = 0, visible = false, still = preference.matches, active = null, hovered = null;

  function layout() {
    const box = canvas.parentElement.getBoundingClientRect();
    width = box.width; height = box.height;
    if (!width || !height) return false;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    compact = width < 600;
    // Background stars, mostly faint; a few bright ones carry a soft glow. Extra margin covers the parallax shift.
    const count = Math.round(clamp(width * height / 1400, 140, 620));
    stars = Array.from({ length: count }, (_, index) => {
      const seed = index * 7919 + 13, size = Math.pow(noise(seed + 3), 3);
      return { x: noise(seed) * width, y: noise(seed + 1) * (height + 40) - 20, r: .45 + size * 1.25, alpha: .18 + noise(seed + 5) * .5 + size * .3,
        depth: .3 + noise(seed + 7) * .7, speed: .4 + noise(seed + 9) * 1.1, phase: noise(seed + 11) * Math.PI * 2,
        tint: TINTS[Math.floor(noise(seed + 15) * TINTS.length)] };
    });
    constellations = targets().map((target, index) => {
      const shape = SHAPES[index % SHAPES.length];
      const sx = Math.min(target.width * (compact ? .3 : .3), compact ? 46 : 150), sy = height * (compact ? .2 : .25);
      const cx = target.x, cy = height * (.46 + shape.lift);
      const points = shape.stars.map(([role, x, y]) => ({ role, x: cx + x * sx, y: cy + y * sy }));
      const xs = points.map(point => point.x), ys = points.map(point => point.y);
      return { index, shape, points, cx, cy, box: [Math.min(...xs) - 36, Math.min(...ys) - 36, Math.max(...xs) + 36, Math.max(...ys) + 52], progress: 0, focus: 1 };
    });
    return true;
  }

  function drawLine(a, b, fraction, dashed) {
    context.setLineDash(dashed ? [3, 5] : []);
    context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(a.x + (b.x - a.x) * fraction, a.y + (b.y - a.y) * fraction); context.stroke();
  }
  function drawStar(x, y, radius, color, alpha, halo) {
    if (halo > 0) { context.globalAlpha = alpha * halo; context.drawImage(sprite, x - radius * 7, y - radius * 7, radius * 14, radius * 14); }
    context.globalAlpha = alpha; context.fillStyle = color;
    context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill();
  }
  function label(text, x, y, color, alpha, align = 'left') {
    if (!text || alpha <= .01) return;
    context.globalAlpha = alpha; context.fillStyle = color; context.textAlign = align;
    context.fillText(text, x, y);
  }

  function draw(delta) {
    context.clearRect(0, 0, width, height);
    // A slight parallax with page scroll gives the sky depth; nearer stars move more.
    const rect = canvas.getBoundingClientRect();
    const drift = still ? 0 : clamp((rect.top + rect.height / 2 - innerHeight / 2) * .05, -24, 24);
    for (const star of stars) {
      const twinkle = still ? 1 : .72 + .28 * Math.sin(clock * star.speed + star.phase);
      const y = star.y + drift * star.depth;
      if (y < -4 || y > height + 4) continue;
      if (star.r > 1.2) drawStar(star.x, y, star.r * .8, star.tint, star.alpha * twinkle, .5);
      else { context.globalAlpha = star.alpha * twinkle; context.fillStyle = star.tint; context.fillRect(star.x, y, star.r * 1.4, star.r * 1.4); }
    }

    const step = still ? 1 : Math.min(1, delta * 3.2);
    context.lineWidth = 1;
    for (const item of constellations) {
      const target = active === item.index ? 1 : 0, focus = active === null || active === item.index ? 1 : .42;
      item.progress += (target - item.progress) * (still ? 1 : step);
      item.focus += (focus - item.focus) * (still ? 1 : step);
      const p = ease(clamp(item.progress, 0, 1)), f = item.focus, { points, shape } = item;
      const shift = drift * .35;
      const at = point => ({ x: point.x, y: point.y + shift });
      // Resting lines are faint; the active constellation draws brighter lines in over them.
      context.strokeStyle = LINE;
      context.globalAlpha = .2 * f;
      for (const [a, b] of shape.lines) drawLine(at(points[a]), at(points[b]), 1, false);
      context.strokeStyle = OPEN; context.globalAlpha = .26 * f;
      drawLine(at(points[shape.open[0]]), at(points[shape.open[1]]), 1, true);
      if (p > 0) {
        context.strokeStyle = LINE; context.globalAlpha = .7 * p;
        shape.lines.forEach(([a, b], order) => drawLine(at(points[a]), at(points[b]), clamp(p * 1.6 - order * .15, 0, 1), false));
        context.strokeStyle = OPEN; context.globalAlpha = .8 * p;
        drawLine(at(points[shape.open[0]]), at(points[shape.open[1]]), clamp(p * 1.4 - .4, 0, 1), true);
      }
      context.setLineDash([]);
      for (const point of points) {
        const { x, y } = at(point);
        if (point.role === 'question') drawStar(x, y, 2.6 + p * .6, STAR, f, .9 + p * .6);
        else if (point.role === 'turn') drawStar(x, y, 1.9 + p * .4, STAR, .9 * f, .6 + p * .5);
        else if (point.role === 'open') drawStar(x, y, 2.1, OPEN, (still ? .9 : .7 + .3 * Math.sin(clock * 2.2 + item.index)) * f, .7 + p * .4);
        else drawStar(x, y, 1.2, STAR, .55 * f, .3);
      }
      // The topic sits under its constellation; star names appear while it is active.
      const names = labels[item.index];
      if (!names) continue;
      const numberFont = `500 11px 'AgentHub Grotesk', 'Inter Variable', 'AgentHub Sans SC', sans-serif`;
      const topicFont = `12px 'Inter Variable', 'AgentHub Sans SC', -apple-system, 'PingFang SC', sans-serif`;
      context.textBaseline = 'alphabetic';
      // Keep the number and topic inside the canvas when a constellation sits near an edge.
      context.font = numberFont; const before = context.measureText(names.number).width + 4;
      context.font = topicFont; const after = context.measureText(names.topic).width + 4;
      const anchor = clamp(item.cx, 12 + before, width - 12 - after);
      context.font = numberFont;
      label(names.number, anchor - 4, item.box[3] + shift, '#5f6f80', .9 * f, 'right');
      context.font = topicFont;
      label(names.topic, anchor + 4, item.box[3] + shift, LINE, (.62 + .38 * p) * f);
      if (compact) continue;
      let turn = 0;
      for (const point of points) {
        if (point.role === 'minor' || point.role === 'question') continue;
        const text = point.role === 'open' ? names.open : names.turns[turn++];
        const { x, y } = at(point), right = x > item.cx;
        label(text, x + (right ? 10 : -10), y + 4, point.role === 'open' ? OPEN : LABEL, p * .95, right ? 'left' : 'right');
      }
    }
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
  function hit(event) {
    const rect = canvas.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
    const item = constellations.find(({ box }) => x >= box[0] && x <= box[2] && y >= box[1] && y <= box[3] + 16);
    return item ? item.index : null;
  }
  function move(event) {
    const index = hit(event);
    canvas.style.cursor = index === null ? '' : 'pointer';
    if (index !== hovered) { hovered = index; onHover(index); }
  }
  function leave() { canvas.style.cursor = ''; if (hovered !== null) { hovered = null; onHover(null); } }
  function click(event) { const index = hit(event); if (index !== null) onSelect(index); }

  const reduce = event => { still = event.matches; sync(); };
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { rootMargin: '80px' });
  const resizer = new ResizeObserver(() => { if (layout()) draw(0); });
  observer.observe(canvas); resizer.observe(canvas.parentElement);
  canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerleave', leave); canvas.addEventListener('click', click);
  preference.addEventListener('change', reduce); document.addEventListener('visibilitychange', sync);
  if (layout()) draw(0);
  return {
    setActive(index) { active = index; if (!frame) draw(0); },
    // Per constellation: { number, topic, turns: [two labels], open }.
    setLabels(next) { labels = next; if (!frame) draw(0); },
    dispose() {
      cancelAnimationFrame(frame); observer.disconnect(); resizer.disconnect();
      canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); canvas.removeEventListener('click', click);
      preference.removeEventListener('change', reduce); document.removeEventListener('visibilitychange', sync);
    },
  };
}
