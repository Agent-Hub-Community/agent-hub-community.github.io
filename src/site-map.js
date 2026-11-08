// One map of the whole Agent Hub site. The header, the "today" panel and both footers read it, and the newspaper's
// masthead mirrors the same sections (newspaper/lib/brand.mjs). Paths are root-relative: the homepage and
// /newspaper/ are served from the same origin, on GitHub Pages and in the combined local preview.
export const SITE = {
  read: [
    { id: 'daily', path: '/newspaper/', zh: '日报', en: 'Daily' },
    { id: 'weekly', path: '/newspaper/weekly/', zh: '周报', en: 'Weekly' },
    { id: 'library', path: '/newspaper/library/', zh: '资料库', en: 'Library' },
    { id: 'glossary', path: '/newspaper/glossary/', zh: '黑话', en: 'Glossary' },
    { id: 'rank', path: '/newspaper/rank/week/', zh: '活跃榜', en: 'Activity' },
    { id: 'search', path: '/newspaper/search/', zh: '搜索', en: 'Search' },
  ],
  community: [
    { id: 'community', path: '/community.html', zh: '社群资料', en: 'Community' },
    { id: 'topics', path: '/community.html#topics', zh: '研究方向', en: 'Research' },
    { id: 'discussions', path: '/community.html#discussions', zh: '讨论摘录', en: 'Discussions' },
    { id: 'join', path: '/community.html#join', zh: '加入社群', en: 'Join' },
  ],
  agents: [
    { id: 'llms', path: '/newspaper/llms.txt', zh: 'llms.txt', en: 'llms.txt' },
    { id: 'skill', path: '/newspaper/agents/SKILL.md', zh: 'Agent Skill', en: 'Agent skill' },
    { id: 'atom', path: '/newspaper/feed.xml', zh: 'RSS / Atom', en: 'RSS / Atom' },
    { id: 'json', path: '/newspaper/feed.json', zh: 'JSON Feed', en: 'JSON Feed' },
  ],
  source: [
    { id: 'github', path: 'https://github.com/Agent-Hub-Community', zh: 'GitHub', en: 'GitHub' },
    { id: 'newspaper-repo', path: 'https://github.com/Agent-Hub-Community/newspaper', zh: '日报仓库', en: 'Newspaper repo' },
    { id: 'skills-repo', path: 'https://github.com/Agent-Hub-Community/skills', zh: 'Skills 仓库', en: 'Skills repo' },
  ],
};

export const sitePath = id => Object.values(SITE).flat().find(item => item.id === id)?.path;

// The primary header: the five reading sections, then the community page.
export const PRIMARY = [...SITE.read.slice(0, 5), SITE.community[0]];

// The newspaper writes this summary on every daily rebuild (newspaper/lib/hub.mjs).
export const HUB_SUMMARY = '/newspaper/hub.json';
