import { ArrowUpRight, Layers, ShieldCheck, Terminal } from 'lucide-react';
import { ABOUT_COPY, FOUNDERS } from './about-data';
import { useHomeLanguage } from './HomeLanguage';

const ICONS = {
  terminal: Terminal,
  shield: ShieldCheck,
  layers: Layers,
};

export default function AboutPage() {
  const { language } = useHomeLanguage();
  const c = ABOUT_COPY[language];
  const sep = language === 'zh' ? '、' : ', ';
  const lastSep = language === 'zh' ? '，以及' : ', and ';

  return <div className="subpage about-page">
    <section className="subpage-hero about-hero" aria-labelledby="about-heading">
      <div className="subpage-hero-glow" aria-hidden="true"/>
      <div className="subpage-shell">
        <p className="subpage-kicker" lang="en">{c.kicker}</p>
        <h1 id="about-heading" className="subpage-title">
          {c.heroTitle.map((line, i) => <span key={i}>{line}</span>)}
        </h1>
        <p className="subpage-lead">{c.heroLead}</p>
      </div>
    </section>

    <div className="subpage-shell about-body">
      <section className="about-block about-vision-block" aria-label={language === 'zh' ? '愿景' : 'Vision'}>
        <p className="about-vision">
          {c.visionPrefix}
          <strong>{c.visionEm[0]}</strong>{sep}
          <strong>{c.visionEm[1]}</strong>{lastSep}
          <strong>{c.visionEm[2]}</strong>
          {c.visionSuffix}
        </p>
        <p className="about-vision-close">{c.visionClose}</p>
      </section>

      <section className="about-block" aria-labelledby="beliefs-heading">
        <h2 id="beliefs-heading" className="about-section-heading">{c.beliefsHeading}</h2>
        <div className="about-beliefs">
          {c.beliefs.map(item => <article key={item.index} className="about-belief">
            <span className="about-index" aria-hidden="true">{item.index}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>)}
        </div>
      </section>

      <section className="about-block" aria-labelledby="operate-heading">
        <h2 id="operate-heading" className="about-section-heading">{c.operateHeading}</h2>
        <div className="about-operations">
          {c.operations.map(item => {
            const Icon = ICONS[item.icon] || Terminal;
            return <article key={item.title} className="about-operation">
              <div className="about-op-badge" style={{ '--badge-accent': item.accent }} aria-hidden="true">
                <Icon size={20} strokeWidth={1.75}/>
              </div>
              <div className="about-op-copy">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>;
          })}
        </div>
      </section>

      <section className="about-block" aria-labelledby="building-heading">
        <h2 id="building-heading" className="about-section-heading">{c.buildingHeading}</h2>
        <ul className="about-building">
          {c.building.map(item => <li key={item.text} className="about-building-item">
            <span className="about-building-dot" style={{ backgroundColor: item.dot }} aria-hidden="true"/>
            <p>{item.text}</p>
          </li>)}
        </ul>
      </section>

      <section className="about-block" id="founders" aria-labelledby="team-heading">
        <div className="about-section-head">
          <h2 id="team-heading" className="about-section-heading">{c.teamHeading}</h2>
          <p className="about-section-sub">{c.teamSub}</p>
        </div>
        <div className="about-team">
          {FOUNDERS.map(person => {
            const info = person[language];
            return <article key={person.id} className="founder-card">
              <a className="founder-portrait" href={person.homepage} target="_blank" rel="noopener noreferrer" aria-label={`${info.name} — ${c.visitHomepage}`}>
                <img src={person.photo} alt={info.name} width="512" height="512" loading="lazy" decoding="async"/>
              </a>
              <div className="founder-info">
                <div className="founder-head">
                  <h3>
                    <a href={person.homepage} target="_blank" rel="noopener noreferrer">
                      {info.name}
                      <span className="founder-subname" lang={language === 'zh' ? 'en' : 'zh-CN'}>{info.subname}</span>
                    </a>
                  </h3>
                  <span className="founder-role">{info.role}</span>
                </div>
                <p className="founder-affiliation">{info.affiliation}</p>
                <p className="founder-bio">{info.bio}</p>
                <div className="founder-links">
                  <a className="founder-link" href={person.homepage} target="_blank" rel="noopener noreferrer">
                    {c.visitHomepage}<ArrowUpRight size={14} aria-hidden="true"/>
                  </a>
                  {person.scholar && <a className="founder-link" href={person.scholar} target="_blank" rel="noopener noreferrer">
                    {c.scholarLabel}<ArrowUpRight size={14} aria-hidden="true"/>
                  </a>}
                  {person.github && <a className="founder-link" href={person.github} target="_blank" rel="noopener noreferrer">
                    {c.githubLabel}<ArrowUpRight size={14} aria-hidden="true"/>
                  </a>}
                </div>
              </div>
            </article>;
          })}
        </div>
      </section>
    </div>

    <section className="subpage-cta" aria-labelledby="about-cta-heading">
      <div className="subpage-shell subpage-cta-inner">
        <p className="subpage-cta-lead">{c.ctaLead}</p>
        <h2 id="about-cta-heading" className="subpage-cta-title">{c.ctaTitle}</h2>
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
