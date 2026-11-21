import { createContext, useContext, useEffect, useState } from 'react';
import { THEMES_REGISTRY } from './site-map';

const ThemePackContext = createContext(null);

function selectHomeTheme(registry, preview, now = Date.now()) {
  if (!registry || preview === 'default') return null;
  const plugins = Array.isArray(registry.plugins) ? registry.plugins : [];
  const campaigns = Array.isArray(registry.campaigns) ? registry.campaigns : [];
  const eligible = plugin => plugin?.home && (!Array.isArray(plugin.targets) || plugin.targets.includes('home'));
  if (preview) {
    const explicit = plugins.find(plugin => plugin.id === preview && eligible(plugin));
    if (explicit) return explicit;
  }
  const active = campaigns.find(c => Date.parse(c.startsAt) <= now && now < Date.parse(c.endsAt));
  if (!active) return null;
  const matched = plugins.find(plugin => plugin.id === active.skin && eligible(plugin));
  return matched || null;
}

export function ThemePackProvider({ children }) {
  const [themePack, setThemePack] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let timer = 0;
    const params = new URLSearchParams(location.search);
    const preview = params.get('theme') ?? params.get('skin');

    function schedule(registry) {
      clearTimeout(timer);
      setThemePack(selectHomeTheme(registry, preview));
      const next = (registry?.campaigns || [])
        .flatMap(c => [Date.parse(c.startsAt), Date.parse(c.endsAt)])
        .filter(time => time > Date.now())
        .sort((a, b) => a - b)[0];
      if (next) timer = setTimeout(() => schedule(registry), Math.min(next - Date.now() + 20, 2147483647));
    }

    fetch(THEMES_REGISTRY, { signal: controller.signal, cache: 'no-cache' })
      .then(response => (response.ok ? response.json() : null))
      .then(registry => { if (registry) schedule(registry); })
      .catch(() => {});

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const home = themePack?.home;
    const props = [
      ['--color-hand-human', home?.asciiHands?.humanColor],
      ['--color-hand-machine', home?.asciiHands?.machineColor],
      ['--color-galaxy-core', home?.galaxyCore],
      ['--color-galaxy-arm', home?.galaxyArm],
      ['--theme-pack-accent', home?.accent],
      ['--theme-pack-bg', home?.bandBg],
    ];
    if (themePack?.id) root.dataset.themePack = themePack.id;
    else delete root.dataset.themePack;
    for (const [prop, value] of props) {
      if (value) root.style.setProperty(prop, value);
      else root.style.removeProperty(prop);
    }
    window.dispatchEvent(new Event('agenthub:theme'));
    return () => {
      delete root.dataset.themePack;
      for (const [prop] of props) root.style.removeProperty(prop);
    };
  }, [themePack]);

  return <ThemePackContext.Provider value={themePack}>{children}</ThemePackContext.Provider>;
}

export function useThemePack() {
  return useContext(ThemePackContext);
}
