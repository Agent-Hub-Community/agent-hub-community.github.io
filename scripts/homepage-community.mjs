import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Parse each institution entry's <img> tag into a compact data object so neither the HTML nor the
// client bundle ships duplicated inline SVG markup or raw HTML strings.
function parseLogoItem(item) {
  const html = item.html || '';
  const src = html.match(/\bsrc="([^"]+)"/)?.[1] || '';
  const alt = html.match(/\balt="([^"]*)"/)?.[1] || item.title;
  const width = Number(html.match(/\bwidth="(\d+)"/)?.[1]) || undefined;
  const height = Number(html.match(/\bheight="(\d+)"/)?.[1]) || undefined;
  const entry = { title: item.title, src, alt, width, height };
  if (item.className) entry.className = item.className;
  return entry;
}

export function selectHomepageCommunity(community) {
  return {
    discussions: community.discussions,
  };
}

export const homepageCommunityPlugin = {
  name: 'homepage-community',
  setup(build) {
    const file = resolve('src/community-data.json');
    build.onResolve({ filter: /^agenthub:(homepage-community|institutions)$/ }, args => ({
      path: args.path, namespace: 'agenthub-homepage'
    }));
    build.onLoad({ filter: /.*/, namespace: 'agenthub-homepage' }, async args => {
      const community = JSON.parse(await readFile(file, 'utf8'));
      const payload = args.path === 'agenthub:institutions'
        ? community.logos.map(group => group.map(parseLogoItem))
        : selectHomepageCommunity(community);
      return {
        contents: JSON.stringify(payload),
        loader: 'json', watchFiles: [file]
      };
    });
  }
};
