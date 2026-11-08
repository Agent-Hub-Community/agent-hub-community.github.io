// Loaded before CSS on both pages so a saved theme is applied before first paint.
(() => {
  const root = document.documentElement;
  const key = 'agenthub-theme';
  const system = matchMedia('(prefers-color-scheme: light)');
  const valid = value => value === 'light' || value === 'dark';
  let saved;
  try { saved = localStorage.getItem(key); } catch {}
  let manual = valid(saved);
  let paletteFrame = 0;
  function apply(theme) {
    const app = document.getElementById('root');
    const paletteChanged = app && root.dataset.theme && root.dataset.theme !== theme;
    if (paletteChanged) {
      cancelAnimationFrame(paletteFrame);
      app.classList.add('is-changing-theme');
    }
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', root.dataset.page === 'home' ? '#000000' : theme === 'light' ? '#f7f9fc' : '#0c1320');
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.setAttribute('aria-label', theme === 'light' ? '切换夜间模式' : '切换日间模式');
      button.setAttribute('aria-pressed', String(theme === 'light'));
    });
    window.dispatchEvent(new Event('agenthub:theme'));
    if (paletteChanged) {
      // Resolve the new colors together before restoring hover color transitions.
      // Movement and disclosure durations do not use the temporary paint token.
      void app.offsetHeight;
      paletteFrame = requestAnimationFrame(() => {
        app.classList.remove('is-changing-theme');
        paletteFrame = 0;
      });
    }
  }
  window.agentHubTheme = {
    get: () => root.dataset.theme,
    set(theme) {
      if (!valid(theme)) return;
      manual = true;
      try { localStorage.setItem(key, theme); } catch {}
      apply(theme);
    }
  };
  apply(manual ? saved : system.matches ? 'light' : 'dark');
  root.classList.add('js');
  system.addEventListener('change', () => { if (!manual) apply(system.matches ? 'light' : 'dark'); });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    manual = valid(event.newValue);
    apply(manual ? event.newValue : system.matches ? 'light' : 'dark');
  });
  document.addEventListener('DOMContentLoaded', () => apply(root.dataset.theme), { once: true });
  // The standalone example form uses the same theme store as the React homepage.
  document.addEventListener('click', event => {
    if (event.target.closest('[data-theme-toggle]')) window.agentHubTheme.set(root.dataset.theme === 'light' ? 'dark' : 'light');
  });
})();
