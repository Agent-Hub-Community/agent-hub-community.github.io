import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// The reading page keeps every discussion and institution name. The cinematic
// homepage imports the complete logo groups separately, without the archive.
export function selectHomepageCommunity(community, selections) {
  return {
    discussions: community.discussions,
    institutions: community.logos.map(row => row.map(item => item.title)),
    featuredInstitutions: selections.flatMap((names, rowIndex) => names.map(name => {
      const item = community.logos[rowIndex]?.find(institution => institution.title === name);
      if (!item) throw new Error(`Unknown featured institution in group ${rowIndex + 1}: ${name}`);
      return item;
    }))
  };
}

export const homepageCommunityPlugin = {
  name: 'homepage-community',
  setup(build) {
    const files = [resolve('src/community-data.json'), resolve('src/journal-content.json')];
    build.onResolve({ filter: /^agenthub:(homepage-community|institutions)$/ }, args => ({
      path: args.path, namespace: 'agenthub-homepage'
    }));
    build.onLoad({ filter: /.*/, namespace: 'agenthub-homepage' }, async args => {
      const [community, journal] = await Promise.all(files.map(async file => JSON.parse(await readFile(file, 'utf8'))));
      return {
        contents: JSON.stringify(args.path === 'agenthub:institutions' ? community.logos : selectHomepageCommunity(community, journal.featuredInstitutions)),
        loader: 'json', watchFiles: files
      };
    });
  }
};
