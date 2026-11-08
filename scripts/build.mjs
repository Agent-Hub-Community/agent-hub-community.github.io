import * as esbuild from 'esbuild';
import { mkdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { homepageCommunityPlugin } from './homepage-community.mjs';

await mkdir('assets/licenses', { recursive: true });
await Promise.all([
  copyFile('src/react-bits/LICENSE.md', 'assets/licenses/react-bits.txt'),
  copyFile('src/amicro/LICENSE', 'assets/licenses/amicro.txt'),
  copyFile('src/brand/space-grotesk-LICENSE.txt', 'assets/licenses/space-grotesk.txt'),
  copyFile('src/brand/noto-serif-sc-OFL.txt', 'assets/licenses/noto-serif-sc.txt'),
  copyFile('src/brand/noto-sans-sc-OFL.txt', 'assets/licenses/noto-sans-sc.txt'),
  copyFile('src/theme-init.js', 'assets/theme.js'),
  copyFile('src/home-routing.js', 'assets/home-routing.js'),
  copyFile('node_modules/@fontsource-variable/inter/LICENSE', 'assets/licenses/inter.txt'),
  copyFile('node_modules/three/LICENSE', 'assets/licenses/three.txt'),
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
  logLevel: 'info'
};

async function renderHTML() {
  const wordmark = JSON.parse(await readFile('src/brand/wordmark.json', 'utf8'));
  await writeFile('assets/agenthub-wordmark.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${wordmark.viewBox}" fill="none" stroke="currentColor" stroke-width="${wordmark.strokeWidth}" stroke-linecap="butt" stroke-linejoin="round" role="img" aria-labelledby="title"><title id="title">AgentHub</title>${wordmark.letters.map(letter => `<path d="${letter.d}"/>`).join('')}</svg>\n`);
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
    build.onEnd(async result => { if (!result.errors.length) await renderHTML(); });
  } });
  const context = await esbuild.context(options);
  await context.watch();
  console.log('Watching source files. Preview: http://127.0.0.1:8000/');
} else {
  await esbuild.build(options);
  await renderHTML();
}
