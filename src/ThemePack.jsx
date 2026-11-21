import { createContext, useContext, useEffect, useState } from 'react';
import { THEMES_REGISTRY } from './site-map';

const ThemePackContext = createContext(null);
const OVERRIDE_KEY = 'agenthub-theme-override';
const CACHE_KEY = 'agenthub-themes-registry';
const CACHE_TTL_MS = 5 * 60 * 1000;

function readPreviewOverride() {
  try {
    const params = new URLSearchParams(location.search);
    const q = params.get('theme') ?? params.get('skin');
    if (q === 'auto') {
      sessionStorage.removeItem(OVERRIDE_KEY);
      return null;
    }
    if (q) {
      sessionStorage.setItem(OVERRIDE_KEY, q);
      return q;
    }
    return sessionStorage.getItem(OVERRIDE_KEY);
  } catch {
    return null;
  }
}

function readCachedRegistry() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
    return parsed?.data ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedRegistry(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

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

function themeSignature(themePack) {
  if (!themePack) return '';
  return JSON.stringify([themePack.id, themePack.home]);
}

export function ThemePackProvider({ children }) {
  const [themePack, setThemePack] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let timer = 0;
    const preview = readPreviewOverride();
    let lastSig = '';

    function schedule(registry) {
      clearTimeout(timer);
      const nextPack = selectHomeTheme(registry, preview);
      const nextSig = themeSignature(nextPack);
      if (nextSig !== lastSig) {
        lastSig = nextSig;
        setThemePack(nextPack);
      }
      const next = (registry?.campaigns || [])
        .flatMap(c => [Date.parse(c.startsAt), Date.parse(c.endsAt)])
        .filter(time => time > Date.now())
        .sort((a, b) => a - b)[0];
      if (next) timer = setTimeout(() => schedule(registry), Math.min(next - Date.now() + 20, 2147483647));
    }

    const cached = readCachedRegistry();
    if (cached?.data) schedule(cached.data);

    const needsFetch = !cached || (Date.now() - (cached.ts || 0)) > CACHE_TTL_MS;
    if (needsFetch) {
      fetch(THEMES_REGISTRY, { signal: controller.signal })
        .then(response => (response.ok ? response.json() : null))
        .then(registry => {
          if (!registry) return;
          writeCachedRegistry(registry);
          schedule(registry);
        })
        .catch(() => {});
    }

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
    let mutated = false;
    const targetId = themePack?.id || '';
    if ((root.dataset.themePack || '') !== targetId) {
      if (targetId) root.dataset.themePack = targetId;
      else delete root.dataset.themePack;
      mutated = true;
    }
    for (const [prop, value] of props) {
      const nextVal = value || '';
      if (root.style.getPropertyValue(prop).trim() !== nextVal) {
        if (nextVal) root.style.setProperty(prop, nextVal);
        else root.style.removeProperty(prop);
        mutated = true;
      }
    }
    if (mutated) window.dispatchEvent(new Event('agenthub:theme'));
  }, [themePack]);

  return <ThemePackContext.Provider value={themePack}>{children}</ThemePackContext.Provider>;
}

export function useThemePack() {
  return useContext(ThemePackContext);
}
