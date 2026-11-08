import { SITE } from './site-map';

const GROUPS = [['read', 0], ['community', 1], ['agents', 2], ['source', 3]];

// The full site map shown in every footer, so any page reaches every other one in a single step.
export default function SiteMap({ language = 'zh', headings, label }) {
  return <nav className="site-map" aria-label={label}>
    {GROUPS.map(([group, index]) => <div key={group} className="site-map-group">
      <h2>{headings[index]}</h2>
      <ul>{SITE[group].map(item => <li key={item.id}><a href={item.path} lang={item[language] === item.zh ? 'zh-CN' : undefined}>{item[language]}</a></li>)}</ul>
    </div>)}
  </nav>;
}
