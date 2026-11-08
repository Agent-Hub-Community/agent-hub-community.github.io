"""Render the home-page Earth plates from the locally held NASA textures.

Requires the local preview at port 4173, Python Playwright, Pillow, and the
project's npm dependencies. The website itself does not need WebGL to show
these plates. Run with python3 -I scripts/render-home-earth.py.
"""
import json
import subprocess
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / '.build'
BUILD.mkdir(exist_ok=True)
ENTRY = BUILD / 'home-earth-entry.js'
BUNDLE = BUILD / 'home-earth-capture.js'
HTML = BUILD / 'home-earth-capture.html'
ENTRY.write_text('''
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createEarth } from '../src/community-earth.js';

const portrait = new URLSearchParams(location.search).has('portrait');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(portrait ? 52 : 42, innerWidth / innerHeight, .1, 1000);
const earth = createEarth(scene);
const group = scene.getObjectByName('earth-backdrop');
group.position.set(...(portrait ? [25, 49, -175] : [48, -10, -172]));
group.scale.setScalar(portrait ? 1.12 : .93);
group.rotation.set(.16, 3.32, -.12);
scene.getObjectByName('earth-surface').material.uniforms.sunDirection.value.set(-.68, .5, .18).normalize();
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new OutputPass());
await earth.ready;
composer.render();
window.captureReady = true;
''')
HTML.write_text('<!doctype html><html><head><base href="../"><style>html,body{margin:0;background:#000;overflow:hidden}canvas{display:block}</style></head><body><script type="module" src=".build/home-earth-capture.js"></script></body></html>')
subprocess.run(['node', '--input-type=module', '-e', "import{build}from'esbuild';await build({entryPoints:['.build/home-earth-entry.js'],bundle:true,format:'esm',target:'es2022',outfile:'.build/home-earth-capture.js',logLevel:'warning'});"], cwd=ROOT, check=True)
results = []
try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(args=['--enable-unsafe-swiftshader'])
        for name, size in [('landscape', (2560, 1600)), ('portrait', (1080, 1800))]:
            page = browser.new_page(viewport={'width': size[0], 'height': size[1]}, device_scale_factor=1)
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto('http://127.0.0.1:4173/.build/home-earth-capture.html' + ('?portrait' if name == 'portrait' else ''))
            page.wait_for_function('window.captureReady === true', timeout=60000)
            if errors:
                raise RuntimeError(errors)
            png = BUILD / ('home-earth-' + name + '.png')
            page.locator('canvas').screenshot(path=str(png))
            target = ROOT / 'assets/environment' / ('earth-' + name + '.webp')
            with Image.open(png) as image:
                image.convert('RGB').save(target, format='WEBP', quality=91, method=6)
            results.append({'file': target.name, 'size': size, 'bytes': target.stat().st_size})
            page.close()
        browser.close()
finally:
    for path in [ENTRY, BUNDLE, HTML]:
        path.unlink(missing_ok=True)
print(json.dumps(results))
