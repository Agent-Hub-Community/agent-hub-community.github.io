import { createContext, useContext, useEffect, useState } from 'react';
import { HOME_COPY } from './home-copy';

const HomeLanguage = createContext({ language: 'zh', copy: HOME_COPY.zh });
const STORAGE_KEY = 'agenthub-language';

export function HomeLanguageProvider({ page = 'home', children }) {
  // The static document and every first visit start in Chinese, regardless of
  // the browser's preferred language. Restore an explicit choice after hydration.
  const [language, setLanguage] = useState('zh');
  useEffect(() => {
    try { if (localStorage.getItem(STORAGE_KEY) === 'en') setLanguage('en'); } catch {}
  }, []);
  useEffect(() => {
    const meta = HOME_COPY[language].pageMeta?.[page];
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    document.title = meta?.title ?? HOME_COPY[language].title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta?.description ?? HOME_COPY[language].intro);
  }, [language, page]);
  function changeLanguage(value) {
    if (value !== 'zh' && value !== 'en') return;
    setLanguage(value);
    try { localStorage.setItem(STORAGE_KEY, value); } catch {}
  }
  return <HomeLanguage.Provider value={{ language, copy: HOME_COPY[language], changeLanguage }}>{children}</HomeLanguage.Provider>;
}

export function useHomeLanguage() { return useContext(HomeLanguage); }

export function LanguageSwitch() {
  const { language, changeLanguage } = useHomeLanguage();
  return <div className="language-switch" role="group" aria-label="语言 / Language">
    <button type="button" lang="zh-CN" aria-label="切换到中文" aria-pressed={language === 'zh'} onClick={() => changeLanguage('zh')}>中文</button>
    <span aria-hidden="true">/</span>
    <button type="button" lang="en" aria-label="Switch to English" aria-pressed={language === 'en'} onClick={() => changeLanguage('en')}>EN</button>
  </div>;
}
