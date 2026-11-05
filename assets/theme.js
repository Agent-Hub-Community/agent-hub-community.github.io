// Loaded before CSS on both pages so a saved theme is applied before first paint.
(() => {
  const root = document.documentElement;
  const key = 'agenthub-theme';
  const system = matchMedia('(prefers-color-scheme: light)');
  const valid = value => value === 'light' || value === 'dark';
  let saved;
  try { saved = localStorage.getItem(key); } catch {}
  let manual = valid(saved);
  function apply(theme) {
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f3f2ed' : '#101111');
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.setAttribute('aria-label', theme === 'light' ? '切换夜间模式' : '切换日间模式');
      button.setAttribute('aria-pressed', String(theme === 'light'));
    });
    window.dispatchEvent(new Event('agenthub:theme'));
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
    if (event.key !== key) return;
    manual = valid(event.newValue);
    apply(manual ? event.newValue : system.matches ? 'light' : 'dark');
  });
  document.addEventListener('DOMContentLoaded', () => apply(root.dataset.theme), { once: true });
  // The standalone example form uses the same theme store as the React homepage.
  document.addEventListener('click', event => {
    if (event.target.closest('[data-theme-toggle]')) window.agentHubTheme.set(root.dataset.theme === 'light' ? 'dark' : 'light');
  });
})();
