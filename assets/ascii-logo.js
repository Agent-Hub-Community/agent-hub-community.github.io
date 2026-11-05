/* The character field is sampled from the community's original galaxy logo. */
(() => {
  const figure = document.querySelector('.ascii-figure');
  const canvas = figure?.querySelector('canvas');
  const context = canvas?.getContext('2d');
  const toggle = document.querySelector('.ascii-toggle');
  if (!context || !toggle) return;

  const source = new Image();
  const sample = document.createElement('canvas');
  const sampler = sample.getContext('2d', { willReadFrequently: true });
  if (!sampler) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const characters = '.:+*ox%#@';
  const animationSpeed = .5;
  const pointer = { x: -1000, y: -1000, active: false };
  let points = [], size = 0, cellWidth = 0, cellHeight = 0, spiral = [];
  let columns = 0, rows = 0, cells = new Float32Array(), coreCells = new Uint8Array();
  let frame = 0, lastTime = 0, time = 0;
  let paused = motion.matches, visible = true, loaded = false;
  let hovering = false, focused = false;
  let coreColor, armColor, glyphFont;

  // Read the two arms' angle at successive radii from the supplied logo.
  // Particles can then move inward along the actual arms, rather than just
  // rotating a flat image or scaling the entire mark toward the center.
  function traceSpiral() {
    sample.width = sample.height = 256;
    sampler.drawImage(source, 0, 0, 256, 256);
    const pixels = sampler.getImageData(0, 0, 256, 256).data;
    spiral = [];
    for (let ring = 0; ring < 64; ring++) {
      const radius = .09 + ring / 63 * .39;
      let real = 0, imaginary = 0;
      for (let ray = 0; ray < 180; ray++) {
        const angle = ray / 180 * Math.PI * 2;
        const x = Math.round(128 + Math.cos(angle) * radius * 256);
        const y = Math.round(128 + Math.sin(angle) * radius * 256);
        const offset = (y * 256 + x) * 4;
        const light = Math.max(0, (pixels[offset] + pixels[offset + 1] + pixels[offset + 2]) / 765 - .09);
        real += light * light * Math.cos(2 * angle);
        imaginary += light * light * Math.sin(2 * angle);
      }
      let angle = Math.atan2(imaginary, real) / 2;
      if (ring) angle += Math.round((spiral[ring - 1] - angle) / Math.PI) * Math.PI;
      spiral.push(angle);
    }
  }
  function armAngle(radius) {
    if (radius < .09) return spiral[0] + 3.2 * Math.log(Math.max(.012, radius) / .09);
    const index = Math.min(63, (radius - .09) / .39 * 63);
    const low = Math.floor(index), high = Math.min(63, low + 1);
    return spiral[low] + (spiral[high] - spiral[low]) * (index - low);
  }

  function resize() {
    if (!loaded) return;
    // Use layout dimensions: parent scaling must not lower the canvas resolution.
    size = figure.clientWidth;
    if (!size) return;
    const theme = getComputedStyle(document.documentElement);
    coreColor = theme.getPropertyValue('--color-galaxy-core').trim();
    armColor = theme.getPropertyValue('--color-galaxy-arm').trim();
    glyphFont = theme.getPropertyValue('--font-outlier').trim();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * ratio);
    canvas.height = Math.round(size * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    // Deliberately coarse: each character has breathing room at normal scale.
    columns = Math.max(38, Math.min(88, Math.round(size / 8.5)));
    rows = Math.round(columns * .56);
    cells = new Float32Array(columns * rows);
    coreCells = new Uint8Array(columns * rows);
    cellWidth = size / columns;
    cellHeight = size / rows;
    sample.width = columns;
    sample.height = rows;
    sampler.drawImage(source, 0, 0, columns, rows);
    const pixels = sampler.getImageData(0, 0, columns, rows).data;
    points = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const offset = (y * columns + x) * 4;
        const light = (pixels[offset] * .2126 + pixels[offset + 1] * .7152 + pixels[offset + 2] * .0722) / 255;
        const strength = Math.pow(Math.max(0, (light - .035) / .85), .65);
        if (strength < .11) continue;
        const px = (x + .5) / columns - .5, py = (y + .5) / rows - .5;
        const radius = Math.hypot(px, py);
        if (radius > .48) continue;
        const angle = Math.atan2(py, px);
        points.push({ radius, angle, armOffset: angle - armAngle(radius),
          dx: 0, dy: 0, vx: 0, vy: 0, strength,
          phase: ((Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1 + 1) % 1 });
      }
    }
    draw(0);
    figure.classList.add('is-ready');
  }

  function draw(delta) {
    context.clearRect(0, 0, size, size);
    context.font = `500 ${cellHeight * .76}px ${glyphFont}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    cells.fill(0);
    coreCells.fill(0);
    const step = Math.min(delta / 33.33, 2);
    for (const point of points) {
      const core = point.radius < .055;
      const inner = .025, outer = .48, span = outer - inner;
      // Constant inward travel with a soft fade at either end of the loop.
      // The angle follows the sampled spiral; the whole galaxy also turns.
      const radius = core ? point.radius : inner + ((point.radius - inner - time * .037) % span + span) % span;
      const angle = core ? point.angle - time * .7 : armAngle(radius) + point.armOffset - time * .18;
      const x = size * (.5 + Math.cos(angle) * radius);
      const y = size * (.5 + Math.sin(angle) * radius);
      const fade = core ? 1 : Math.min(1, (radius - inner) / .035, (outer - radius) / .035);
      if (step) {
        if (pointer.active) {
          const dx = x + point.dx - pointer.x, dy = y + point.dy - pointer.y;
          const distance = Math.hypot(dx, dy);
          const radius = size * .16;
          if (distance < radius) {
            const force = (1 - distance / radius) * 2.3 * step;
            point.vx += dx / Math.max(distance, 1) * force;
            point.vy += dy / Math.max(distance, 1) * force;
          }
        }
        point.vx = (point.vx - point.dx * .04 * step) * Math.pow(.84, step);
        point.vy = (point.vy - point.dy * .04 * step) * Math.pow(.84, step);
        point.dx += point.vx * step;
        point.dy += point.vy * step;
      }
      const shimmer = Math.sin(time * 1.2 + point.phase * 6.28) * .04;
      const light = Math.max(.03, Math.min(1, point.strength + shimmer));
      const column = Math.floor((x + point.dx) / cellWidth);
      const row = Math.floor((y + point.dy) / cellHeight);
      if (column < 0 || column >= columns || row < 0 || row >= rows) continue;
      const cell = row * columns + column;
      const intensity = light * fade;
      // One glyph per cell, including in the core: inward motion never
      // collapses the letters into an unreadable pile.
      if (intensity > cells[cell]) {
        cells[cell] = intensity;
        coreCells[cell] = core || point.strength > .7 ? 1 : 0;
      }
    }
    for (let cell = 0; cell < cells.length; cell++) {
      const light = cells[cell];
      if (light < .045) continue;
      const index = Math.min(characters.length - 1, Math.floor(light * characters.length));
      context.fillStyle = coreCells[cell] ? coreColor : armColor;
      context.globalAlpha = Math.min(1, light * 2.4);
      context.fillText(characters[index], (cell % columns + .5) * cellWidth,
        (Math.floor(cell / columns) + .5) * cellHeight);
    }
    context.globalAlpha = 1;
  }

  function tick(now) {
    frame = 0;
    if (paused || hovering || focused || !visible || document.hidden || !loaded) return;
    const delta = lastTime ? now - lastTime : 33.33;
    if (delta >= 33) {
      time += Math.min(delta, 66) / 1000 * animationSpeed;
      draw(delta);
      lastTime = now;
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    (toggle.querySelector('[data-motion-label]') || toggle).textContent = paused ? '播放动画' : '暂停动画';
    toggle.setAttribute('aria-pressed', String(!paused));
    if (loaded) {
      if (paused) draw(0);
      else if (!hovering && !focused && visible && !document.hidden) frame = requestAnimationFrame(tick);
    }
  }
  toggle.addEventListener('click', () => { paused = !paused; sync(); });
  toggle.addEventListener('focus', () => { focused = true; sync(); });
  toggle.addEventListener('blur', () => { focused = false; sync(); });
  figure.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovering = true; sync(); } });
  figure.addEventListener('pointerleave', () => { hovering = false; sync(); });
  motion.addEventListener('change', event => { paused = event.matches; sync(); });
  document.addEventListener('visibilitychange', sync);
  figure.addEventListener('pointermove', event => {
    const box = figure.getBoundingClientRect();
    pointer.x = event.clientX - box.left;
    pointer.y = event.clientY - box.top;
    pointer.active = true;
  });
  const release = () => { pointer.active = false; };
  figure.addEventListener('pointerleave', release);
  figure.addEventListener('pointerup', event => { if (event.pointerType !== 'mouse') release(); });
  figure.addEventListener('pointercancel', release);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(figure);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(figure);
  else window.addEventListener('resize', resize);
  source.onload = () => {
    loaded = true;
    traceSpiral();
    resize();
    toggle.hidden = false;
    sync();
  };
  source.src = figure.dataset.source;
})();
