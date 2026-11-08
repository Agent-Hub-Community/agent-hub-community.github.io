import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, ChevronDown, Copy, Search } from 'lucide-react';
import { useHomeLanguage } from './HomeLanguage';
import { HUB_SUMMARY, SITE, SKILL_SOURCE, sitePath } from './site-map';

const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
const dotted = date => (date || '').replaceAll('-', '.');

// A count that rolls up from zero the first time the section is seen. Until then, and under reduced motion, it
// shows the value itself, so a count that never animates still reads correctly.
function Figure({ value, run, locale }) {
  const [shown, setShown] = useState(null);
  useEffect(() => {
    if (value == null || !run) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(value); return; }
    let frame = 0;
    const start = performance.now(), duration = 1100;
    const step = now => {
      const t = Math.min(1, (now - start) / duration);
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    // Animation frames stop in background tabs; the count still has to end on its value.
    const settle = setTimeout(() => setShown(value), duration + 150);
    return () => { cancelAnimationFrame(frame); clearTimeout(settle); };
  }, [value, run]);
  return value == null ? '—' : (shown ?? value).toLocaleString(locale);
}

// The sentence that has a reader's own agent install the agenthub skill. It is collapsed by default: the card says
// what it does and copies it in one click, and the full text opens on request. Where the clipboard is refused, the
// text opens and is selected for copying by hand.
function AgentPrompt({ text }) {
  const [state, setState] = useState('idle');
  const [open, setOpen] = useState(false);
  const body = useRef(null);
  const prompt = fill(text.installPrompt, { skill: SKILL_SOURCE });
  useEffect(() => {
    if (state !== 'copied') return;
    const reset = setTimeout(() => setState('idle'), 2400);
    return () => clearTimeout(reset);
  }, [state]);
  useEffect(() => {
    if (state !== 'selected' || !body.current) return;
    const range = document.createRange(); range.selectNodeContents(body.current);
    const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
  }, [state, open]);
  async function copy() {
    try { await navigator.clipboard.writeText(prompt); setState('copied'); }
    catch { setOpen(true); setState('selected'); }
  }
  return <div className={'hub-agents' + (open ? ' is-open' : '')}>
    <span className="hub-panel-title">{text.agents}</span>
    <p className="hub-agents-lead">{text.agentsLead}</p>
    <div className="hub-agents-actions">
      <button type="button" className={'hub-copy' + (state === 'copied' ? ' is-done' : '')} onClick={copy}>
        {state === 'copied' ? <Check size={14} aria-hidden="true"/> : <Copy size={14} aria-hidden="true"/>}{state === 'copied' ? text.promptCopied : text.copyPrompt}
      </button>
      <button type="button" className="hub-reveal" aria-expanded={open} aria-controls="hub-install-prompt" onClick={() => { if (open) setState('idle'); setOpen(!open); }}>
        {open ? text.hidePrompt : text.showPrompt}<ChevronDown size={14} aria-hidden="true"/>
      </button>
    </div>
    <div className="hub-prompt" id="hub-install-prompt" hidden={!open}><p ref={body}>{prompt}</p></div>
    {state === 'selected' && <p className="hub-stat-note" aria-live="polite">{text.promptSelected}</p>}
  </div>;
}

// What the groups are discussing now, laid out like a front page: a dateline under two rules, one lead story,
// the other groups in a compact list, then the weekly review, the site's figures and the ways in. The static page
// carries the section links; the newspaper's summary, fetched after hydration, adds headlines and figures. If it
// cannot load, the links still work.
export default function HubSection() {
  const { copy, language } = useHomeLanguage();
  const text = copy.hub;
  const locale = language === 'en' ? 'en-US' : 'zh-CN';
  const section = useRef(null);
  const [hub, setHub] = useState(null);
  const [status, setStatus] = useState('loading');
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(HUB_SUMMARY, { signal: controller.signal, cache: 'no-cache' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error(String(response.status))))
      .then(data => { if (!data?.daily) throw new Error('empty'); setHub(data); setStatus('ready'); })
      .catch(error => { if (error.name !== 'AbortError') setStatus('error'); });
    const observer = new IntersectionObserver(entries => { if (entries[0].isIntersecting) { setSeen(true); observer.disconnect(); } }, { threshold: .2 });
    observer.observe(section.current);
    return () => { controller.abort(); observer.disconnect(); };
  }, []);

  const groupName = page => text.groups?.[page.id] || page.label;
  const groupLang = page => text.groups?.[page.id] ? 'en' : 'zh-CN';
  const typeName = item => text.types?.[item.kind] || item.type;
  const label = id => SITE.read.find(item => item.id === id)?.[language];
  const pages = hub?.daily?.pages || [];
  // The lead is the first group with something new; the rest follow in the newspaper's order.
  const lead = pages.find(page => !page.quiet && page.id.startsWith('group-')) || pages.find(page => !page.quiet);
  const others = pages.filter(page => page !== lead);
  const day = hub?.daily?.date ? new Date(hub.daily.date + 'T12:00:00+08:00') : null;
  // Date and weekday apart: Chinese reads 2026年11月7日 星期六 rather than running them together, English
  // Saturday, November 7, 2026.
  const dateline = day && (language === 'en' ? ['weekday', 'date'] : ['date', 'weekday']).map(part => day.toLocaleDateString(locale, part === 'date'
    ? { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Shanghai' } : { weekday: 'long', timeZone: 'Asia/Shanghai' })).join(language === 'en' ? ', ' : ' ');
  const stats = [
    { id: 'library', value: hub?.library?.count },
    { id: 'glossary', value: hub?.glossary?.count },
    { id: 'rank', value: hub?.rank?.groups },
    { id: 'opportunities', value: hub?.opportunities?.open },
  ];

  return <section className="hub-section" id="today" ref={section} aria-labelledby="hub-title">
    <div className="cinema-wrap hub-inner">
      <div className="hub-lead">
        <h2 id="hub-title">{text.heading[0]}<br/>{text.heading[1]}</h2>
        <p className="hub-intro">{text.intro}</p>
        {/* The dateline, as a newspaper prints it under its rules: issue number, then the date. */}
        {status !== 'error' && <p className="hub-dateline">
          <span>{hub?.issues?.daily ? fill(text.issueNumber, { n: hub.issues.daily }) : '\u00a0'}</span>
          {hub?.daily && <time dateTime={hub.daily.date}>{dateline}</time>}
        </p>}
        {status === 'ready'
          ? <>
            {lead && <a className="hub-story" href={lead.path} lang="zh-CN">
              <span className="hub-story-meta" lang={groupLang(lead)}>{groupName(lead)}</span>
              <span className="hub-story-title">{lead.title}</span>
              <ArrowUpRight size={20} aria-hidden="true"/>
            </a>}
            <ol className="hub-headlines" lang="zh-CN">{others.map(page => <li key={page.id} className={page.quiet ? 'is-quiet' : undefined}><a href={page.quiet ? page.last.path : page.path}>
              <span className="hub-group" lang={groupLang(page)}>{groupName(page)}</span>
              {/* A group with nothing new today keeps its row and leads to its most recent page. */}
              {page.quiet
                ? <span className="hub-headline"><span className="hub-quiet" lang={language === 'en' ? 'en' : 'zh-CN'}>{fill(text.quietLast, { date: dotted(page.last.date).slice(5) })}</span>{page.last.title}</span>
                : <span className="hub-headline">{page.title}</span>}
            </a></li>)}</ol>
          </>
          : status === 'loading'
            ? <div className="hub-skeleton" aria-hidden="true"><span className="is-lead"/><span/><span/><span/><span/></div>
            : <p className="hub-note">{text.unavailable}</p>}
        <div className="scene-actions hub-actions">
          <a className="scene-button" href={hub?.daily?.path || sitePath('daily')}>{text.readIssue}</a>
        </div>
      </div>

      <div className="hub-side">
        {/* A plain GET form: it reaches the newspaper's search page with ?q= even before scripts load. */}
        <form className="hub-search" action={sitePath('search')} method="get" role="search">
          <label className="hub-search-label" htmlFor="hub-search-input">{text.searchLabel}</label>
          <div className="hub-search-field">
            <Search size={17} aria-hidden="true"/>
            <input id="hub-search-input" name="q" type="search" placeholder={text.searchPlaceholder} enterKeyHint="search" autoComplete="off"/>
            <button type="submit">{text.searchButton}</button>
          </div>
        </form>

        <a className="hub-weekly" href={hub?.weekly?.path || sitePath('weekly')}>
          <span className="hub-panel-title">{label('weekly')}<span>{hub?.weekly ? `${dotted(hub.weekly.start).slice(5)} – ${dotted(hub.weekly.end).slice(5)}` : text.weeklyFallback}</span><ArrowUpRight size={15} aria-hidden="true"/></span>
          {hub?.weekly?.pages?.length > 0 && <ol lang="zh-CN">{hub.weekly.pages.slice(0, 4).map(page => <li key={page.id}><span lang={groupLang(page)}>{groupName(page)}</span>{page.title}</li>)}</ol>}
        </a>

        <ul className="hub-stats" aria-label={text.statsLabel}>{stats.map(item => <li key={item.id}><a href={sitePath(item.id)}>
          <span className="hub-figure"><Figure value={item.value > 0 ? item.value : null} run={seen} locale={locale}/></span>
          <span className="hub-stat-label">{item.id === 'opportunities' ? text.opportunities : label(item.id)}<ArrowUpRight size={13} aria-hidden="true"/></span>
        </a></li>)}</ul>

        <div className="hub-bottom">
          {hub?.library?.recent?.length > 0 && <div className="hub-recent">
            <p>{text.recent}</p>
            <ul lang="zh-CN">{hub.library.recent.map(item => <li key={item.path}><a href={item.path}><span lang={text.types?.[item.kind] ? 'en' : 'zh-CN'}>{typeName(item)}</span>{item.title}</a></li>)}</ul>
          </div>}
          <AgentPrompt text={text}/>
        </div>
      </div>
    </div>
  </section>;
}
