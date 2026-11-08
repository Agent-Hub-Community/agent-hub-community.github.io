import * as esbuild from 'esbuild';
import { mkdir, copyFile, readFile, readdir, writeFile, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { join, relative, resolve } from 'node:path';
import { homepageCommunityPlugin } from './homepage-community.mjs';

await mkdir('assets/licenses', { recursive: true });
await Promise.all([
  copyFile('src/brand/space-grotesk-LICENSE.txt', 'assets/licenses/space-grotesk.txt'),
  copyFile('src/brand/noto-serif-sc-OFL.txt', 'assets/licenses/noto-serif-sc.txt'),
  copyFile('src/brand/noto-sans-sc-OFL.txt', 'assets/licenses/noto-sans-sc.txt'),
  copyFile('src/theme-init.js', 'assets/theme.js'),
  copyFile('src/home-routing.js', 'assets/home-routing.js'),
  copyFile('node_modules/@fontsource-variable/inter/LICENSE', 'assets/licenses/inter.txt'),
  copyFile('src/join-example.html', 'join-example.html')
]);

const options = {
  entryPoints: { site: 'src/main.jsx', community: 'src/community.jsx' },
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['es2020'],
  outdir: 'assets',
  splitting: true,
  chunkNames: 'chunks/[name]-[hash]',
  jsx: 'automatic',
  loader: { '.woff2': 'file', '.woff': 'file' },
  assetNames: 'fonts/[name]-[hash]',
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [homepageCommunityPlugin],
  legalComments: 'linked',
  metafile: true,
  logLevel: 'info'
};

// Chunk and font names carry a content hash, so every change writes new files. Remove the ones this build did not
// write; otherwise stale bundles accumulate in the repository and get deployed.
async function pruneOutputs(metafile) {
  const written = new Set(Object.keys(metafile.outputs).map(file => relative('.', file)));
  for (const directory of ['assets/chunks', 'assets/fonts']) {
    const names = await readdir(directory).catch(() => []);
    await Promise.all(names.map(name => join(directory, name)).filter(file => !written.has(file)).map(file => rm(file)));
  }
}

async function renderHTML() {
  const wordmark = JSON.parse(await readFile('src/brand/wordmark.json', 'utf8'));
  const paths = wordmark.letters.map(letter => `<path d="${letter.d}"/>`).join('');
  const attributes = `xmlns="http://www.w3.org/2000/svg" viewBox="${wordmark.viewBox}" fill="none" stroke="currentColor" stroke-width="${wordmark.strokeWidth}" stroke-linecap="butt" stroke-linejoin="round"`;
  await writeFile('assets/agenthub-wordmark.svg', `<svg ${attributes} role="img" aria-labelledby="title"><title id="title">Agent Hub</title>${paths}</svg>\n`);
  // The site-wide 404 page carries the wordmark inline, since it is served at arbitrary paths.
  const notFound = await readFile('src/404.html', 'utf8');
  await writeFile('404.html', notFound.replace('<!--wordmark-->', `<svg ${attributes} aria-hidden="true">${paths}</svg>`));
  const temporary = '.build/prerender.mjs';
  await mkdir('.build', { recursive: true });
  try {
    await esbuild.build({
      entryPoints: ['src/render.jsx'], bundle: true, platform: 'node',
      format: 'esm', packages: 'external', outfile: temporary,
      jsx: 'automatic', loader: { '.css': 'empty' }, plugins: [homepageCommunityPlugin], logLevel: 'silent'
    });
    const { render } = await import(`${pathToFileURL(resolve(temporary))}?build=${Date.now()}`);
    for (const [page, name] of [['home', 'index.html'], ['community', 'community.html']]) {
      const template = await readFile('src/' + name, 'utf8');
      await writeFile(name, template.replace('<!--app-->', render(page)));
    }
  } finally {
    await rm(temporary, { force: true });
  }
}

if (process.argv.includes('--watch')) {
  options.plugins.push({ name: 'prerender', setup(build) {
    build.onEnd(async result => { if (!result.errors.length) { await pruneOutputs(result.metafile); await renderHTML(); } });
  } });
  const context = await esbuild.context(options);
  await context.watch();
  console.log('Watching source files. Preview: http://127.0.0.1:8000/');
} else {
  const result = await esbuild.build(options);
  await pruneOutputs(result.metafile);
  await renderHTML();
}
