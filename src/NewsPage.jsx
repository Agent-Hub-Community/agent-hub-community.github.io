import { useEffect, useState } from 'react';
import { ArrowUpRight, Calendar } from 'lucide-react';
import { NEWS_COPY, NEWS_ITEMS } from './news-data';
import { HUB_SUMMARY } from './site-map';
import { useHomeLanguage } from './HomeLanguage';

function formatTemplate(template, values) {
  return Object.entries(values).reduce((out, [key, value]) => out.replace(`{${key}}`, String(value)), template);
}

export default function NewsPage() {
  const { language } = useHomeLanguage();
  const c = NEWS_COPY[language];
  const [filter, setFilter] = useState('all');
  const [hub, setHub] = useState(null);

  useEffect(() => {
    let active = true;
    fetch(HUB_SUMMARY)
      .then(response => (response.ok ? response.json() : null))
      .then(data => { if (active && data) setHub(data); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const items = filter === 'all' ? NEWS_ITEMS : NEWS_ITEMS.filter(item => item.category === filter);

  return <div className="subpage news-page">
    <section className="subpage-hero news-hero" aria-labelledby="news-heading">
      <div className="subpage-hero-glow" aria-hidden="true"/>
      <div className="subpage-shell">
        <p className="subpage-kicker" lang="en">{c.kicker}</p>
        <h1 id="news-heading" className="subpage-title">{c.title}</h1>
        <p className="subpage-lead">{c.lead}</p>
        {hub?.issues && <div className="news-live-bar">
          <span className="news-live-dot" aria-hidden="true"/>
          <span className="news-live-text">
            {c.liveBannerPrefix}{' '}
            <strong>{formatTemplate(c.liveIssues, { daily: hub.issues.daily, weekly: hub.issues.weekly })}</strong>
            {hub.library?.count ? <> · {formatTemplate(c.liveLibrary, { count: hub.library.count })}</> : null}
            {hub.opportunities?.open ? <> · {formatTemplate(c.liveOpenings, { open: hub.opportunities.open })}</> : null}
          </span>
          {hub.opportunities?.path && <a className="news-live-link" href={hub.opportunities.path}>
            {c.liveOpeningsLink}<ArrowUpRight size={13} aria-hidden="true"/>
          </a>}
        </div>}
      </div>
    </section>

    <div className="subpage-shell news-body">
      <div className="news-filters" role="group" aria-label={c.filterLabel}>
        {c.filters.map(item => <button
          key={item.id}
          type="button"
          className={'news-filter' + (filter === item.id ? ' is-active' : '')}
          aria-pressed={filter === item.id}
          onClick={() => setFilter(item.id)}
        >
          {item.label}
        </button>)}
      </div>

      {items.length === 0 ? (
        <p className="news-empty">{c.empty}</p>
      ) : (
        <ol className="news-list">
          {items.map(entry => {
            const detail = entry[language];
            return <li key={entry.id} id={entry.id} className="news-card">
              <div className="news-aside">
                <time className="news-date" dateTime={entry.date}>
                  <Calendar size={13} aria-hidden="true"/>
                  <span>{entry.date}</span>
                </time>
                <div className="news-badges">
                  <span className="news-badge">{c.categoryLabels[entry.category]}</span>
                  <span className={'news-status is-' + entry.status}>{c.statusLabels[entry.status]}</span>
                </div>
              </div>
              <div className="news-main">
                <h2>{detail.title}</h2>
                <p className="news-summary">{detail.summary}</p>
                <div className="news-footer">
                  {detail.meta && <span className="news-meta">{detail.meta}</span>}
                  {detail.links?.length ? <div className="news-links">
                    {detail.links.map(link => <a
                      key={link.href + link.label}
                      className="news-link"
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                    >
                      {link.label}<ArrowUpRight size={14} aria-hidden="true"/>
                    </a>)}
                  </div> : null}
                </div>
              </div>
            </li>;
          })}
        </ol>
      )}
    </div>

    <section className="subpage-cta" aria-labelledby="news-cta-heading">
      <div className="subpage-shell subpage-cta-inner">
        <p className="subpage-cta-lead">{c.ctaLead}</p>
        <h2 id="news-cta-heading" className="subpage-cta-title">{c.ctaTitle}</h2>
        <div className="subpage-cta-actions">
          <a className="subpage-btn-primary" href={c.ctaPrimaryHref} target="_blank" rel="noopener noreferrer">
            {c.ctaPrimary}<ArrowUpRight size={16} aria-hidden="true"/>
          </a>
          <a className="subpage-btn-ghost" href={c.ctaSecondaryHref}>
            {c.ctaSecondary}
          </a>
        </div>
      </div>
    </section>
  </div>;
}
