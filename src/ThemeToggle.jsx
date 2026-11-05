import { useSyncExternalStore } from 'react';
import { Sun, Moon } from 'lucide-react';
import './theme.css';

const subscribe = callback => {
  window.addEventListener('agenthub:theme', callback);
  return () => window.removeEventListener('agenthub:theme', callback);
};
const snapshot = () => document.documentElement.dataset.theme || 'dark';
const serverSnapshot = () => 'dark';

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const label = theme === 'light' ? '切换夜间模式' : '切换日间模式';
  return <button type="button" className="theme-toggle" aria-label={label} aria-pressed={theme === 'light'} title={label} onClick={() => window.agentHubTheme?.set(theme === 'light' ? 'dark' : 'light')}>
    <Sun className="theme-sun" size={19} strokeWidth={1.5} aria-hidden="true"/>
    <Moon className="theme-moon" size={18} strokeWidth={1.5} aria-hidden="true"/>
  </button>;
}
