// A night sky of the community's questions. Every archived discussion is one star; the selected one gathers its
// ideas around it as smaller stars, joined to it by lines, with an amber star on a dashed line for what is still
// open. Hovering a star reports it for a preview; clicking selects it.
const FRAME_MS = 33;
const LINE = '#8fbbe0', STAR = '#eeedf0', OPEN = '#e0b86e';
const TINTS = ['#eeedf0', '#eeedf0', '#eeedf0', '#b7cddd', '#f3dcc0'];

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

// One question star per entry in `groups` (its tag); `weights[i]` (0–1) sets each star's size. `onHover(index, x, y)` receives canvas
// coordinates, or null; `onSelect(index)` fires on click or tap.
export function createSky(canvas, { groups, weights, onHover, onSelect }) {
  const context = canvas.getContext('2d');
  if (!context) return null;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const sprite = glowSprite();
  let width = 0, height = 0, dust = [], questions = [], compact = false;
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
    const dustCount = Math.round(clamp(width * height / 1500, 120, 560));
    dust = Array.from({ length: dustCount }, (_, index) => {
      const seed = index * 7919 + 13;
      return { x: noise(seed) * width, y: noise(seed + 1) * (height + 40) - 20, r: .4 + Math.pow(noise(seed + 3), 3) * .9, alpha: .1 + noise(seed + 5) * .35,
        depth: .3 + noise(seed + 7) * .7, speed: .4 + noise(seed + 9) * 1.1, phase: noise(seed + 11) * Math.PI * 2, tint: TINTS[Math.floor(noise(seed + 15) * TINTS.length)] };
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
        r: (compact ? 1.4 : 1.6) + (weights[index] ?? .5) * (compact ? 1 : 1.3), phase: noise(seed + 2) * Math.PI * 2, speed: .5 + noise(seed + 4) };
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

  function draw(delta) {
    context.clearRect(0, 0, width, height);
    const rect = canvas.getBoundingClientRect();
    drift = still ? 0 : clamp((rect.top + rect.height / 2 - innerHeight / 2) * .05, -24, 24);
    for (const star of dust) {
      const y = star.y + drift * star.depth;
      if (y < -4 || y > height + 4) continue;
      context.globalAlpha = star.alpha * (still ? 1 : .7 + .3 * Math.sin(clock * star.speed + star.phase));
      context.fillStyle = star.tint; context.fillRect(star.x, y, star.r * 1.4, star.r * 1.4);
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
      const alpha = isSelected ? 1 : isHovered ? .95 : .62 * twinkle;
      drawStar(star.x, star.y, isSelected ? star.r + 1.1 : isHovered ? star.r + .6 : star.r, STAR, alpha, isSelected ? 1.5 : isHovered ? 1.1 : .55);
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
  // The nearest question within reach of the pointer; generous on touch screens.
  function nearest(event) {
    const rect = canvas.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
    const reach = event.pointerType === 'touch' ? 26 : 16;
    let best = null, distance = reach * reach;
    questions.forEach((star, index) => { const d = (star.x - x) ** 2 + (star.y - y) ** 2; if (d < distance) { distance = d; best = index; } });
    return best;
  }
  function report(index) {
    if (index === hovered) return;
    hovered = index; canvas.style.cursor = index === null ? '' : 'pointer';
    onHover(index, index === null ? 0 : questions[index].x, index === null ? 0 : questions[index].y);
    if (!frame) draw(0);
  }
  const move = event => { if (event.pointerType === 'mouse') report(nearest(event)); };
  const leave = () => report(null);
  const click = event => { const index = nearest(event); if (index !== null) onSelect(index); };

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
    // Where a question star sits, for placing its preview.
    position(index) { const star = questions[index]; return star ? { x: star.x, y: star.y } : null; },
    dispose() {
      cancelAnimationFrame(frame); observer.disconnect(); resizer.disconnect();
      canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); canvas.removeEventListener('click', click);
      preference.removeEventListener('change', reduce); document.removeEventListener('visibilitychange', sync);
    },
  };
}
