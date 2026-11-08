// Points of light in the dark around Mars, one for each discussion in the archive, named by its direction (the
// discussion's tag). Several directions at a time, the lights that share one reach for each other along faint arcs
// and its name appears: people working on the same thing finding each other. Hovering a light names its direction and
// joins it to the others. Lights are placed only where the poster is dark, away from the planet and the text.
// Up to three directions link at once; a new one starts every SPAWN_MS and each lasts ARC_MS.
const FRAME_MS = 33, ARC_MS = 3000, SPAWN_MS = 900, MAX_ARCS = 3, LINE = '#8fbbe0', TINTS = ['#ffffff', '#eef3ff', '#fff1dc', '#dfe9ff'];

function noise(seed) {
  let value = Math.imul(seed ^ (seed >>> 16), 0x21f0aaad);
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  return ((value ^ (value >>> 15)) >>> 0) / 4294967296;
}
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

// `image` is the poster under the film; `avoid()` returns the rectangles (in viewport coordinates) the lights keep
// clear of, such as the text. `tags` holds one direction per light.
export function createPlanetLights(canvas, image, { tags, avoid }) {
  const context = canvas.getContext('2d');
  if (!context) return null;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const sampler = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  let width = 0, height = 0, lights = [], groups = new Map(), frame = 0, clock = 0, last = 0, visible = false, still = preference.matches;
  let arcs = [], lastSpawn = 0, arcTurn = 0, hovered = null;

  // How bright the poster is at a canvas point, after the same "cover" fit the page gives it.
  function darkness() {
    const iw = image.naturalWidth, ih = image.naturalHeight;
    if (!iw || !ih) return () => true;
    const scale = Math.max(width / iw, height / ih), ox = (width - iw * scale) / 2, oy = (height - ih * scale) / 2;
    const sw = 192, sh = Math.round(192 * ih / iw);
    sampler.canvas.width = sw; sampler.canvas.height = sh;
    sampler.drawImage(image, 0, 0, sw, sh);
    const pixels = sampler.getImageData(0, 0, sw, sh).data;
    const light = (u, v) => { const i = (v * sw + u) * 4; return (pixels[i] * .2126 + pixels[i + 1] * .7152 + pixels[i + 2] * .0722) / 255; };
    // The night side is as dark as space, so recover the whole disc from the lit side: the lit crescent spans the
    // planet's full height, and it hugs one limb. Rows with only a few bright pixels (moons, stars) are ignored.
    let top = -1, bottom = -1, left = sw, right = -1, sum = 0, count = 0;
    for (let v = 0; v < sh; v++) {
      const row = [];
      for (let u = 0; u < sw; u++) if (light(u, v) > .1) row.push(u);
      if (row.length < 3) continue;
      if (top < 0) top = v;
      bottom = v; left = Math.min(left, row[0]); right = Math.max(right, row.at(-1));
      for (const u of row) { sum += u; count++; }
    }
    let disc = null;
    if (top >= 0 && bottom - top > sh * .2) {
      const radius = (bottom - top) / 2, litLeft = sum / count < (left + right) / 2;
      const cu = litLeft ? left + radius : right - radius, cv = top + radius;
      disc = { x: cu / sw * iw * scale + ox, y: cv / sh * ih * scale + oy, r: radius / sw * iw * scale * 1.1 };
    }
    return (x, y) => {
      if (disc && Math.hypot(x - disc.x, y - disc.y) < disc.r) return false;
      // The brightest pixel nearby, so lights stay off the planet's rim and glow as well as its face.
      let peak = 0;
      for (const [dx, dy] of [[0, 0], [-14, 0], [14, 0], [0, -14], [0, 14]]) {
        const u = Math.floor(((x + dx - ox) / scale) / iw * sw), v = Math.floor(((y + dy - oy) / scale) / ih * sh);
        if (u < 0 || v < 0 || u >= sw || v >= sh) continue;
        const i = (v * sw + u) * 4;
        peak = Math.max(peak, (pixels[i] * .2126 + pixels[i + 1] * .7152 + pixels[i + 2] * .0722) / 255);
      }
      return peak < .06;
    };
  }

  function layout() {
    const box = canvas.getBoundingClientRect();
    width = box.width; height = box.height;
    if (!width || !height) return false;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const dark = darkness();
    const blocked = avoid().map(rect => [rect.left - box.left - 28, rect.top - box.top - 28, rect.right - box.left + 28, rect.bottom - box.top + 28]);
    const gap = width < 700 ? 22 : 34, margin = 18;
    lights = [];
    for (let attempt = 0; lights.length < tags.length && attempt < 6000; attempt++) {
      const x = margin + noise(attempt * 2 + 11) * (width - margin * 2), y = margin + noise(attempt * 2 + 12) * (height * .9 - margin);
      if (!dark(x, y) || blocked.some(([l, t, r, b]) => x > l && x < r && y > t && y < b)) continue;
      if (lights.some(light => Math.hypot(light.x - x, light.y - y) < gap)) continue;
      const index = lights.length, seed = index * 7919 + 5;
      lights.push({ x, y, tag: tags[index], r: .7 + Math.pow(noise(seed), 2) * 1.1, phase: noise(seed + 1) * Math.PI * 2,
        speed: .5 + noise(seed + 2) * 1.2, tint: TINTS[Math.floor(noise(seed + 3) * TINTS.length)], glow: 0 });
    }
    groups = new Map(); arcs = []; hovered = null;
    for (const light of lights) groups.set(light.tag, [...(groups.get(light.tag) || []), light]);
    return true;
  }

  // Directions with more than one light take turns drawing their arcs, never one that is already showing.
  function nextArc(now) {
    const shared = [...groups.entries()].filter(([tag, members]) => members.length > 1 && !arcs.some(arc => arc.tag === tag));
    if (!shared.length) return null;
    const [tag, members] = shared[Math.floor(noise(++arcTurn * 104729) * shared.length)];
    return { tag, members, from: members[Math.floor(noise(arcTurn * 7919) * members.length)], start: now };
  }
  function curve(a, b, progress) {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y;
    const cx = mx - dy * .18, cy = my + dx * .18;
    context.beginPath(); context.moveTo(a.x, a.y);
    // Draw the quadratic up to `progress` by splitting it at that point.
    const t = progress, qx = a.x + (cx - a.x) * t, qy = a.y + (cy - a.y) * t;
    const rx = cx + (b.x - cx) * t, ry = cy + (b.y - cy) * t;
    context.quadraticCurveTo(qx, qy, qx + (rx - qx) * t, qy + (ry - qy) * t);
    context.stroke();
  }
  function link(members, from, progress, alpha) {
    context.strokeStyle = LINE; context.lineWidth = .8; context.globalAlpha = alpha;
    for (const member of members) if (member !== from) curve(from, member, progress);
  }
  function name(light, alpha) {
    if (alpha <= .01) return;
    context.globalAlpha = alpha; context.fillStyle = '#dfe9f5';
    context.font = `500 12px 'Inter Variable', 'AgentHub Sans SC', -apple-system, 'PingFang SC', sans-serif`;
    const right = light.x < width - 120;
    context.textAlign = right ? 'left' : 'right'; context.textBaseline = 'middle';
    context.fillText(light.tag, light.x + (right ? 10 : -10), light.y);
  }

  function draw(now) {
    context.clearRect(0, 0, width, height);
    // The directions being shown: the hovered one alone, or the arcs in progress.
    let shown = [];
    if (hovered) shown = [{ tag: hovered.tag, members: groups.get(hovered.tag), from: hovered, progress: 1, fade: 1, label: 1 }];
    else if (!still) {
      arcs = arcs.filter(arc => now - arc.start < ARC_MS);
      if (arcs.length < MAX_ARCS && now - lastSpawn > SPAWN_MS) { const arc = nextArc(now); if (arc) arcs.push(arc); lastSpawn = now; }
      shown = arcs.map(arc => {
        const t = (now - arc.start) / ARC_MS, progress = clamp(t / .3, 0, 1);
        return { ...arc, progress, fade: t < .7 ? 1 : 1 - (t - .7) / .3, label: clamp((progress - .4) / .6, 0, 1) };
      });
    }
    for (const item of shown) link(item.members, item.from, 1 - Math.pow(1 - item.progress, 3), .55 * item.fade);
    for (const light of lights) {
      const lit = shown.some(item => item.tag === light.tag);
      light.glow += ((lit ? 1 : 0) - light.glow) * (still ? 1 : .15);
      const twinkle = still ? .85 : .6 + .4 * Math.pow(.5 + .5 * Math.sin(clock * light.speed + light.phase), 2);
      const r = light.r + light.glow * 1.1, alpha = Math.min(1, twinkle * (.55 + light.r * .25) + light.glow * .5);
      context.globalAlpha = alpha * .35; context.fillStyle = light.tint;
      context.beginPath(); context.arc(light.x, light.y, r * 3.2, 0, Math.PI * 2); context.fill();
      context.globalAlpha = alpha;
      context.beginPath(); context.arc(light.x, light.y, r, 0, Math.PI * 2); context.fill();
    }
    for (const item of shown) name(item.from, item.label * item.fade);
    context.globalAlpha = 1;
  }

  function tick(now) {
    frame = 0;
    if (!visible || still || document.hidden) return;
    if (now - last >= FRAME_MS) { clock += Math.min(now - (last || now), 100) / 1000; last = now; draw(now); }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    if (visible && !still && !document.hidden) frame = requestAnimationFrame(tick);
    else draw(performance.now());
  }
  function move(event) {
    const box = canvas.getBoundingClientRect(), x = event.clientX - box.left, y = event.clientY - box.top;
    let best = null, distance = 18 * 18;
    for (const light of lights) { const d = (light.x - x) ** 2 + (light.y - y) ** 2; if (d < distance) { distance = d; best = light; } }
    if (best !== hovered) { hovered = best; if (!frame) draw(performance.now()); }
  }
  const leave = () => { hovered = null; if (!frame) draw(performance.now()); };
  const relayout = () => { if (layout()) draw(performance.now()); };
  const reduce = event => { still = event.matches; sync(); };
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
  const resizer = new ResizeObserver(relayout);
  observer.observe(canvas); resizer.observe(canvas);
  canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerleave', leave);
  preference.addEventListener('change', reduce); document.addEventListener('visibilitychange', sync);
  // The poster decides where the dark sky is, so lay out again once it (or its narrow-screen version) loads.
  image.addEventListener('load', relayout);
  if (image.complete) relayout();
  return {
    dispose() {
      cancelAnimationFrame(frame); observer.disconnect(); resizer.disconnect();
      canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave);
      preference.removeEventListener('change', reduce); document.removeEventListener('visibilitychange', sync);
      image.removeEventListener('load', relayout);
    },
  };
}
