import { useEffect, useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import { useHomeLanguage } from './HomeLanguage';
import { HUB_SUMMARY, SITE, sitePath } from './site-map';

const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
const dotted = date => (date || '').replaceAll('-', '.');

// What the groups are discussing now. The static page carries the section links; the newspaper's summary,
// fetched after hydration, adds the latest headlines and counts. If it cannot load, the links still work.
export default function HubSection() {
  const { copy, language } = useHomeLanguage();
  const text = copy.hub;
  const [hub, setHub] = useState(null);
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    const controller = new AbortController();
    fetch(HUB_SUMMARY, { signal: controller.signal, cache: 'no-cache' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error(String(response.status))))
      .then(data => { if (!data?.daily) throw new Error('empty'); setHub(data); setStatus('ready'); })
      .catch(error => { if (error.name !== 'AbortError') setStatus('error'); });
    return () => controller.abort();
  }, []);

  const weeklyRange = hub?.weekly ? `${dotted(hub.weekly.start)} – ${dotted(hub.weekly.end).slice(5)}` : '';
  const count = value => value > 0 ? value.toLocaleString(language === 'en' ? 'en-US' : 'zh-CN') : null;
  // English counts take a singular or plural noun; Chinese reads 招聘 7.
  const openings = kinds => Object.entries(text.kinds).filter(([kind]) => kinds?.[kind]).map(([kind, label]) =>
    Array.isArray(label) ? `${kinds[kind]} ${label[kinds[kind] === 1 ? 0 : 1]}` : `${label} ${kinds[kind]}`).join(' · ');
  // Digests are written in Chinese; the English page names groups and resource types in English.
  const groupName = page => text.groups?.[page.id] || page.label;
  const typeName = item => text.types?.[item.kind] || item.type;
  const tiles = [
    { id: 'weekly', href: hub?.weekly?.path || sitePath('weekly'), quote: hub?.weekly?.pages?.[0]?.title,
      note: hub?.weekly ? fill(text.weeklyNote, { range: weeklyRange, pages: hub.weekly.pages.length }) : text.weeklyFallback },
    { id: 'library', href: sitePath('library'), figure: count(hub?.library?.count), note: text.libraryNote },
    { id: 'glossary', href: sitePath('glossary'), figure: count(hub?.glossary?.count), note: text.glossaryNote },
    { id: 'rank', href: sitePath('rank'), figure: count(hub?.rank?.groups), note: hub?.rank?.groups ? text.rankCount : text.rankNote },
    { id: 'opportunities', href: sitePath('opportunities'), figure: count(hub?.opportunities?.open),
      note: hub?.opportunities?.open ? `${text.opportunitiesOpen} · ${openings(hub.opportunities.kinds)}` : text.opportunitiesNote },
    { id: 'agents', href: sitePath('llms'), code: text.agentsCode, note: text.agentsCodeNote },
  ];
  const label = id => id === 'agents' ? text.agents : id === 'opportunities' ? text.opportunities : SITE.read.find(item => item.id === id)?.[language];

  return <section className="hub-section" id="today" aria-labelledby="hub-title">
    <div className="cinema-wrap hub-inner">
      <div className="hub-lead">
        <p className="hub-eyebrow"><span>{text.eyebrow}</span>{hub?.daily && <time dateTime={hub.daily.date}>{dotted(hub.daily.date)}</time>}</p>
        <h2 id="hub-title">{text.heading[0]}<br/>{text.heading[1]}</h2>
        <p className="hub-intro">{text.intro}</p>
        {status === 'ready'
          ? <ol className="hub-headlines" lang="zh-CN">{hub.daily.pages.map(page => <li key={page.id}><a href={page.path}>
              <span className="hub-group" lang={text.groups?.[page.id] ? 'en' : 'zh-CN'}>{groupName(page)}</span><span className="hub-headline">{page.title}</span><ArrowUpRight size={16} aria-hidden="true"/>
            </a></li>)}</ol>
          : status === 'loading'
            ? <ol className="hub-headlines hub-skeleton" aria-hidden="true">{[0, 1, 2, 3, 4].map(index => <li key={index}><span/></li>)}</ol>
            : <p className="hub-note">{text.unavailable}</p>}
        <div className="scene-actions hub-actions">
          <a className="scene-button" href={hub?.daily?.path || sitePath('daily')}>{text.readIssue}</a>
          {hub && <span className="hub-count">{fill(text.issues, hub.issues)}</span>}
        </div>
        {language === 'en' && status === 'ready' && <p className="hub-language">{text.contentLanguage}</p>}
      </div>
      <div className="hub-side">
        {/* A plain GET form: it reaches the newspaper's search page with ?q= even before scripts load. */}
        <form className="hub-search" action={sitePath('search')} method="get" role="search">
          <label className="hub-search-label" htmlFor="hub-search-input">{text.searchLabel}{hub?.search?.count > 0 && <span>{fill(text.searchScope, { count: count(hub.search.count) })}</span>}</label>
          <div className="hub-search-field">
            <Search size={17} aria-hidden="true"/>
            <input id="hub-search-input" name="q" type="search" placeholder={text.searchPlaceholder} enterKeyHint="search" autoComplete="off"/>
            <button type="submit">{text.searchButton}</button>
          </div>
        </form>
        <ul className="hub-tiles">{tiles.map(tile => <li key={tile.id}><a href={tile.href}>
          <span className="hub-tile-title">{label(tile.id)}<ArrowUpRight size={15} aria-hidden="true"/></span>
          {tile.figure != null && <span className="hub-figure">{tile.figure}</span>}
          {tile.quote && <span className="hub-quote" lang="zh-CN">{tile.quote}</span>}
          {tile.code && <code className="hub-code">{tile.code}</code>}
          <span className="hub-tile-note">{tile.note}</span>
        </a></li>)}</ul>
        {hub?.library?.recent?.length > 0 && <div className="hub-recent">
          <p>{text.recent}</p>
          <ul lang="zh-CN">{hub.library.recent.map(item => <li key={item.path}><a href={item.path}><span lang={text.types?.[item.kind] ? 'en' : 'zh-CN'}>{typeName(item)}</span>{item.title}</a></li>)}</ul>
        </div>}
      </div>
    </div>
  </section>;
}
