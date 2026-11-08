import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createAtmosphere } from './community-atmosphere';
import { loadCommunityActors, createCommunityActor } from './community-actors';

export const WORLD_LOCATIONS = [
  { id: 'benchmark', label: '共建 Benchmark', point: [0, 4.5, -1.0], target: [0, 1.6, .5] },
  { id: 'projects', label: '一起做项目', point: [6, 3.7, -4.8], target: [6, 1.4, -3.7] },
  { id: 'commons', label: '围桌聊聊', point: [-6, 3.5, -3.5], target: [-6, 1.35, -2.7] },
];

// Fictional characters inhabit three community activities. No live state is simulated.
export async function createCommunityWorld(canvas, { onReady, onProject, onSpeakers, onMotionChange, onSelect, environmentUrl = 'assets/environment/studio-small-08.hdr', charactersUrl = 'assets/characters/' } = {}) {
  const clockStart = performance.now();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
  const actorsPending = loadCommunityActors(charactersUrl);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.35));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.info.autoReset = false;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#070b13');
  scene.fog = new THREE.FogExp2(new THREE.Color().setRGB(.012, .024, .057), .023);
  const atmosphere = createAtmosphere(scene);
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 150);
  const home = new THREE.Vector3(5.2, 5.5, 18.8), target = new THREE.Vector3(0, 2.0, -.8);
  camera.position.copy(home);
  const controls = new OrbitControls(camera, canvas);
  canvas.style.touchAction = 'pan-y pinch-zoom'; controls.target.copy(target);
  controls.enableDamping = true; controls.dampingFactor = .08;
  controls.enablePan = false; controls.enableZoom = false;
  controls.minPolarAngle = .78; controls.maxPolarAngle = 1.38;
  controls.minAzimuthAngle = -.6; controls.maxAzimuthAngle = 1.05; controls.rotateSpeed = .42; controls.update();

  let hdr = null, env;
  try { hdr = await new HDRLoader().loadAsync(environmentUrl); } catch { /* A local geometric environment is a usable fallback. */ }
  function environmentMap() {
    const generator = new THREE.PMREMGenerator(renderer); env?.dispose();
    if (hdr) { hdr.needsUpdate = true; env = generator.fromEquirectangular(hdr); }
    else { const room = new RoomEnvironment(); env = generator.fromScene(room, .06); room.dispose(); }
    scene.environment = env.texture; generator.dispose();
  }
  environmentMap(); scene.environmentIntensity = .72;
  const key = new THREE.DirectionalLight('#ecf2ff', 2.2); key.position.set(-4, 12, 9); key.castShadow = true;
  key.shadow.autoUpdate = false; key.shadow.needsUpdate = true;
  key.shadow.mapSize.set(1536, 1536); key.shadow.normalBias = .03; key.shadow.bias = -.00015;
  Object.assign(key.shadow.camera, { left: -12, right: 12, top: 10, bottom: -10, near: 1, far: 40 }); scene.add(key);
  const fill = new THREE.DirectionalLight('#7baee6', .8); fill.position.set(-8, 4, -4); scene.add(fill);
  const rim = new THREE.DirectionalLight('#abd3fa', 3.0); rim.position.set(4, 7, -9); scene.add(rim);
  scene.add(new THREE.HemisphereLight('#a1b9de', '#0b101b', .45));

  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 2 }));
  const renderPass = new RenderPass(scene, camera), bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .30, .58, 1.45), outputPass = new OutputPass();
  // Only the diffuse light spill uses a smaller buffer; the scene and text stay sharp.
  const resizeBloom = bloom.setSize.bind(bloom);
  bloom.setSize = (width, height) => resizeBloom(Math.max(1, width / 2), Math.max(1, height / 2));
  composer.addPass(renderPass); composer.addPass(bloom); composer.addPass(outputPass);
  const [characterAssets] = await Promise.all([actorsPending, atmosphere.ready]);
  const animations = [], textures = new Set(), materialCache = new Map();
  const unitBox = new RoundedBoxGeometry(1, 1, 1, 2, .09);
  const sphereGeometry = new THREE.SphereGeometry(1, 24, 16), smallSphereGeometry = new THREE.SphereGeometry(1, 10, 7);
  const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 64), smallCylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 12);
  const smallBoxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const white = material('#dce5eb', .36, .22), graphite = material('#24344a', .3, .7);
  const bronze = material('#d0a081', .33, .76), ink = material('#07121f', .3, .4);
  const stone = material('#172332', .5, .45);
  const mint = new THREE.MeshStandardMaterial({ color: '#92e4eb', emissive: '#6dcbd9', emissiveIntensity: 2.2, roughness: .25 });
  const warm = new THREE.MeshStandardMaterial({ color: '#ebc59e', emissive: '#efae71', emissiveIntensity: 1.9, roughness: .35 });
  function material(color, roughness = .65, metalness = .04) {
    const id = `${color}-${roughness}-${metalness}`;
    if (!materialCache.has(id)) materialCache.set(id, new THREE.MeshStandardMaterial({ color, roughness, metalness }));
    return materialCache.get(id);
  }
  function mesh(geometry, mat, position = [0, 0, 0], parent = scene) {
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(...position); object.castShadow = true; object.receiveShadow = true;
    parent.add(object); return object;
  }
  function box(size, position, mat = white, parent = scene) {
    const object = mesh(Math.min(...size) < .02 || Math.max(...size) < .16 ? smallBoxGeometry : unitBox, mat, position, parent); object.scale.set(...size); return object;
  }
  function sphere(size, position, mat = white, parent = scene) {
    const object = mesh((Array.isArray(size) ? Math.max(...size) : size) < .08 ? smallSphereGeometry : sphereGeometry, mat, position, parent);
    object.scale.set(...(Array.isArray(size) ? size : [size, size, size])); return object;
  }
  function cylinder(radius, height, position, mat = white, parent = scene) {
    const object = mesh(radius < .085 ? smallCylinderGeometry : cylinderGeometry, mat, position, parent); object.scale.set(radius, height, radius); return object;
  }
  function rod(from, to, radius, mat, parent = scene) {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), direction = b.clone().sub(a);
    const object = cylinder(radius, direction.length(), a.clone().add(b).multiplyScalar(.5).toArray(), mat, parent);
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()); return object;
  }
  function ring(radius, tube, position, mat, parent = scene, arc = Math.PI * 2) {
    return mesh(new THREE.TorusGeometry(radius, tube, 8, radius < .2 ? 24 : radius < .8 ? 56 : 100, arc), mat, position, parent);
  }
  function plane(width, height, position, mat, parent = scene) {
    const object = mesh(new THREE.PlaneGeometry(width, height), mat, position, parent);
    object.castShadow = false; return object;
  }
  function texture(draw, width = 1024, height = 512) {
    const image = document.createElement('canvas'); image.width = width; image.height = height;
    draw(image.getContext('2d'), width, height);
    const value = new THREE.CanvasTexture(image); value.colorSpace = THREE.SRGBColorSpace;
    value.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    textures.add(value); return value;
  }
  function screenTexture(title, variant = 0) {
    return texture((ctx, w, h) => {
      ctx.fillStyle = '#102731'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#40666b'; ctx.lineWidth = 2;
      ctx.strokeRect(24, 24, w - 48, h - 48);
      ctx.fillStyle = '#a9d8ce'; ctx.font = '500 37px monospace'; ctx.fillText(title, 54, 84);
      ctx.fillStyle = '#637f83'; ctx.font = '22px monospace'; ctx.fillText('AGENT HUB / RESEARCH NOTES', 54, 125);
      if (variant === 0) {
        for (let row = 0; row < 8; row++) {
          ctx.fillStyle = row % 3 === 0 ? '#d9b693' : '#88b4b0';
          ctx.fillRect(54 + row % 3 * 18, 176 + row * 31, 160 + row * 47 % 290, 8);
          ctx.fillStyle = '#3c5c65'; ctx.fillRect(630, 178 + row * 31, 180 + row * 13, 8);
        }
      } else {
        ctx.strokeStyle = '#91cec1'; ctx.lineWidth = 5; ctx.beginPath();
        for (let i = 0; i <= 70; i++) {
          const x = 65 + i * 12.3, y = 390 - Math.log(i + 1) * 42 + Math.sin(i * .9) * (20 - i * .2);
          if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.stroke(); ctx.strokeStyle = '#34545f'; ctx.lineWidth = 1;
        for (let row = 0; row < 6; row++) { ctx.beginPath(); ctx.moveTo(54, 170 + row * 45); ctx.lineTo(960, 170 + row * 45); ctx.stroke(); }
      }
    });
  }
  function monitor(position, width = 1.5, title = '> agent.run()', angle = 0, parent = scene, variant = 0) {
    const group = new THREE.Group(); parent.add(group); group.position.set(...position); group.rotation.y = angle;
    box([width * 1.06, width * .59, .085], [0, 0, 0], graphite, group);
    const display = new THREE.MeshBasicMaterial({ map: screenTexture(title, variant), toneMapped: false });
    plane(width, width * .52, [0, 0, .049], display, group);
    rod([0, -width * .27, 0], [0, -width * .49, 0], .035, bronze, group);
    box([width * .38, .04, .28], [0, -width * .5, .04], graphite, group);
    return group;
  }
  function facing(group, x, z) { group.rotation.y = Math.atan2(x - group.position.x, z - group.position.z); }

  function human(position, coat, options = {}) {
    const template = characterAssets[options.hairStyle === 'bun' || options.hairStyle === 'curly' ? 1 : 0];
    if (!template) return originalHuman(position, coat, options);
    const actor = createCommunityActor(template, position, coat, options, scene, animations);
    if (options.pose === 'coffee') {
      cylinder(.05, .10, [-.18, 1.18, .355], white, actor);
      cylinder(.041, .006, [-.18, 1.233, .355], material('#433027'), actor);
      ring(.033, .008, [-.126, 1.184, .355], white, actor);
    } else if (options.pose === 'read') {
      const tablet = new THREE.Group(); tablet.position.set(0, 1.115, .36); tablet.rotation.x = .22; actor.add(tablet);
      box([.36, .025, .26], [0, 0, 0], graphite, tablet);
      box([.32, .004, .22], [0, .016, 0], ink, tablet);
      for (let i = 0; i < 4; i++) box([.16 - i % 2 * .045, .002, .008], [-.035, .019, -.065 + i * .035], mint, tablet);
    }
    return actor;
  }
  function originalHuman(position, coat, { skin = '#bc8e6e', hair = '#263137', hairStyle = 'short', pose = 'talk', glasses = false, scale = 1, lookYaw = 0 } = {}) {
    const group = new THREE.Group(); group.position.set(...position); group.scale.setScalar(scale); group.userData.dynamic = true; scene.add(group);
    const clothing = material(coat, .85), skinMaterial = material(skin, .64), hairMaterial = material(hair, .92);
    const trousers = material('#283747', .86), shoes = material('#121d2c', .48, .08);
    // Adult proportions, a shaped jacket, and the small asymmetries of a person
    // listening. No bobblehead or inflated spherical torso.
    const torso = mesh(new THREE.LatheGeometry([
      new THREE.Vector2(.155, 0), new THREE.Vector2(.17, .09), new THREE.Vector2(.18, .33),
      new THREE.Vector2(.19, .43), new THREE.Vector2(.14, .49), new THREE.Vector2(.067, .51),
    ], 20), clothing, [0, .94, 0], group); torso.scale.z = .65;
    sphere([.19, .115, .12], [0, .95, 0], trousers, group);
    cylinder(.055, .12, [0, 1.49, 0], skinMaterial, group);
    // Shirt, open collar, and a quiet jacket seam.
    box([.075, .17, .018], [0, 1.33, .117], material('#d3d6d6', .89), group);
    rod([-.08, 1.435, .085], [-.036, 1.26, .135], .012, clothing, group);
    rod([.08, 1.435, .085], [.036, 1.26, .135], .012, clothing, group);
    rod([0, .975, .115], [0, 1.22, .123], .0035, material('#c3cbd0', .8), group);
    const head = new THREE.Group(); head.name = 'Head'; head.position.set(0, 1.665, 0); head.rotation.set(pose === 'read' ? .13 : 0, lookYaw, 0); head.userData.dynamic = true; group.add(head);
    sphere([.122, .156, .124], [0, 0, .004], skinMaterial, head);
    sphere([.129, .083, .13], [0, .099, -.009], hairMaterial, head);
    sphere([.037, .085, .087], [-.104, .035, -.02], hairMaterial, head);
    sphere([.09, .11, .05], [0, .035, -.085], hairMaterial, head);
    if (hairStyle === 'bun') {
      sphere([.126, .15, .078], [0, -.008, -.08], hairMaterial, head);
      sphere(.075, [.02, .168, -.07], hairMaterial, head);
    } else if (hairStyle === 'curly') {
      for (let i = 0; i < 7; i++) sphere(.064, [Math.cos(i * 1.2) * .083, .13 + i % 2 * .025, Math.sin(i * 1.2) * .073], hairMaterial, head);
    }
    for (const x of [-.121, .121]) sphere([.024, .035, .025], [x, -.012, 0], skinMaterial, head);
    sphere([.019, .027, .025], [0, -.012, .123], skinMaterial, head);
    const eyes = new THREE.Group(); eyes.position.y = .025; eyes.userData.dynamic = true; head.add(eyes);
    for (const x of [-.043, .043]) sphere([.007, .009, .004], [x, 0, .12], ink, eyes);
    if (glasses) {
      for (const x of [-.046, .046]) ring(.035, .005, [x, .027, .132], graphite, head);
      rod([-.013, .03, .136], [.013, .03, .136], .005, graphite, head);
    }
    for (const side of [-1, 1]) {
      const x = side * .092, knee = [x + side * .016, .52, side === 1 ? .015 : .07];
      rod([x, .94, 0], knee, .076, trousers, group);
      sphere(.075, knee, trousers, group);
      rod(knee, [x + side * .025, .15, side === 1 ? -.035 : .115], .061, trousers, group);
      box([.135, .09, .25], [x + side * .025, .079, side === 1 ? .02 : .17], shoes, group);
    }
    const leftArm = new THREE.Group(); leftArm.position.set(-.18, 1.37, 0); group.add(leftArm);
    sphere([.063, .086, .07], [0, 0, 0], clothing, leftArm);
    rod([0, 0, 0], [-.04, -.255, .025], .056, clothing, leftArm);
    rod([-.04, -.255, .025], [-.01, -.44, .14], .047, clothing, leftArm);
    sphere([.038, .068, .036], [-.01, -.49, .17], skinMaterial, leftArm);
    const rightArm = new THREE.Group(); rightArm.position.set(.18, 1.37, 0); rightArm.userData.dynamic = true; group.add(rightArm);
    const elbow = pose === 'talk' ? [.085, -.19, .06] : [.04, -.23, .055];
    const hand = pose === 'talk' ? [.135, -.04, .29] : [-.075, -.26, .30];
    sphere([.063, .085, .07], [0, 0, 0], clothing, rightArm);
    rod([0, 0, 0], elbow, .056, clothing, rightArm); sphere(.053, elbow, clothing, rightArm);
    rod(elbow, hand, .046, clothing, rightArm);
    const palm = sphere([.036, .059, .044], [hand[0], hand[1] + .02, hand[2] + .025], skinMaterial, rightArm); palm.rotation.x = -.65;
    sphere([.023, .035, .025], [hand[0] - .03, hand[1] + .011, hand[2] + .022], skinMaterial, rightArm);
    if (pose === 'coffee') {
      cylinder(.062, .115, [hand[0], hand[1] + .07, hand[2] + .01], white, rightArm);
      cylinder(.052, .004, [hand[0], hand[1] + .13, hand[2] + .01], material('#694b35'), rightArm);
      ring(.043, .01, [hand[0] + .062, hand[1] + .07, hand[2] + .01], white, rightArm);
    }
    if (pose === 'read') { const tablet = box([.33, .021, .42], [-.07, 1.09, .29], graphite, group); tablet.rotation.x = -.2; }
    const phase = position[0] * .7 + position[2];
    animations.push(time => {
      const gesture = Math.pow(Math.max(0, Math.sin(time * .65 + phase)), 2);
      rightArm.rotation.x = Math.sin(time * 1.6 + phase) * (pose === 'talk' ? .14 * gesture : .018);
      rightArm.rotation.z = pose === 'talk' ? gesture * -.07 : 0;
      const blink = (time + Math.abs(phase)) % 5.7;
      eyes.scale.y = blink > 5.45 ? .14 + Math.abs(blink - 5.575) / .125 * .86 : 1;
      group.position.y = position[1] + Math.sin(time * 1.6 + phase) * .005;
    });
    return group;
  }

  function robot(position, color = '#d2ded4', kind = 'screen', scale = 1) {
    const group = new THREE.Group(); group.position.set(...position); group.scale.setScalar(scale); group.userData.dynamic = true; scene.add(group);
    const shell = material(color, .25, .5);
    if (kind === 'round') {
      const body = mesh(new THREE.LatheGeometry([
        new THREE.Vector2(.025, .35), new THREE.Vector2(.11, .36), new THREE.Vector2(.19, .53),
        new THREE.Vector2(.22, .75), new THREE.Vector2(.16, .86), new THREE.Vector2(.06, .87),
      ], 32), shell, [0, 0, 0], group); body.scale.z = .78;
      cylinder(.09, .14, [0, .92, 0], graphite, group);
      const head = new THREE.Group(); head.position.y = 1.18; head.userData.dynamic = true; group.add(head);
      sphere([.35, .27, .3], [0, 0, 0], shell, head);
      sphere([.29, .145, .077], [0, .01, .272], ink, head);
      const eyes = new THREE.Group(); eyes.position.set(0, .02, .345); eyes.userData.dynamic = true; head.add(eyes);
      for (const x of [-.085, .085]) sphere([.028, .039, .013], [x, 0, 0], mint, eyes);
      const arms = [];
      for (const side of [-1, 1]) {
        const arm = new THREE.Group(); arm.position.set(side * .255, .75, 0); arm.userData.dynamic = true; group.add(arm); arms.push(arm);
        sphere(.07, [0, 0, 0], graphite, arm);
        const hand = [side * .095, side === -1 ? -.05 : -.22, .19];
        rod([0, 0, 0], hand, .05, shell, arm);
        sphere([.06, .075, .055], hand, shell, arm);
      }
      const light = ring(.085, .01, [0, .36, 0], mint, group); light.rotation.x = Math.PI / 2;
      const seam = ring(.342, .005, [0, 0, 0], graphite, head); seam.scale.y = .76; seam.rotation.x = Math.PI / 2;
      // Hold the listening pose. Independent yaw, pitch, roll and hover loops
      // made the face wander even when the camera and conversation were still.
      group.position.y = position[1] + .12;
      head.rotation.set(-.025, .1, 0);
      arms[0].rotation.x = -.32;
      arms[1].rotation.x = .02;
      const animate = time => {
        const blink = time % 5.3; eyes.scale.y = blink > 5.10 ? .15 + Math.abs(blink - 5.20) / .10 * .85 : 1;
      };
      animate(0); animations.push(animate);
      return group;
    }
    box([.48, .43, .34], [0, .64, 0], shell, group);
    if (kind === 'screen') {
      box([.57, .43, .4], [0, 1.11, 0], shell, group);
      box([.47, .285, .023], [0, 1.115, .215], ink, group);
      for (const x of [-.1, .1]) box([.047, .076, .01], [x, 1.14, .234], mint, group);
      rod([-.08, 1.03, .235], [.08, 1.03, .235], .008, mint, group);
      rod([.16, 1.32, 0], [.16, 1.5, 0], .018, bronze, group); sphere(.044, [.16, 1.51, 0], warm, group);
    } else {
      sphere([.34, .29, .3], [0, 1.1, 0], shell, group);
      sphere([.24, .14, .04], [0, 1.11, .274], ink, group);
      for (const x of [-.09, .09]) sphere(.036, [x, 1.13, .311], mint, group);
      ring(.13, .024, [.34, 1.13, 0], bronze, group).rotation.y = Math.PI / 2;
      ring(.13, .024, [-.34, 1.13, 0], bronze, group).rotation.y = Math.PI / 2;
    }
    for (const x of [-.145, .145]) {
      rod([x, .46, 0], [x, .18, .02], .06, bronze, group);
      box([.2, .095, .31], [x, .1, .065], graphite, group);
    }
    for (const side of [-1, 1]) {
      sphere(.07, [side * .31, .77, 0], bronze, group);
      rod([side * .31, .77, 0], [side * .4, .52, .15], .047, shell, group);
      sphere(.067, [side * .4, .52, .15], graphite, group);
    }
    box([.15, .08, .019], [0, .68, .18], mint, group);
    return group;
  }


  function workboard(position, title, lines, scale = 1) {
    const group = new THREE.Group(); group.position.set(...position); group.scale.setScalar(scale); scene.add(group);
    const backing = new THREE.MeshPhysicalMaterial({ color: '#4c7395', roughness: .19, metalness: .38,
      transparent: true, opacity: .23, depthWrite: false, clearcoat: 1 });
    box([4.2, 2.48, .042], [0, 0, 0], backing, group);
    const display = texture((ctx, w, h) => {
      ctx.fillStyle = '#0c182842'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#d6eaf9'; ctx.font = '400 54px sans-serif'; ctx.fillText(title, 66, 104);
      ctx.strokeStyle = '#99bdd750'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(66, 143); ctx.lineTo(w - 66, 143); ctx.stroke();
      lines.forEach((line, i) => {
        const x = i % 2 * 475 + 78, y = Math.floor(i / 2) * 158 + 218;
        ctx.fillStyle = i === 0 ? '#a0dfe5' : '#b4c9d8'; ctx.font = '400 34px monospace'; ctx.fillText(line, x, y);
        ctx.strokeStyle = '#b7d4e147'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + 24); ctx.lineTo(x + 340, y + 24); ctx.stroke();
        ctx.strokeRect(x, y + 51, 17, 17); ctx.fillStyle = '#a7c5d374'; ctx.fillRect(x + 34, y + 56, 186, 4);
      });
    }, 1024, 600);
    plane(4.08, 2.39, [0, 0, .025], new THREE.MeshBasicMaterial({ map: display, transparent: true, depthWrite: false, toneMapped: false }), group);
    box([4.06, .009, .009], [0, 1.235, .028], mint, group);
    return group;
  }
  workboard([0, 3.0, -1.45], 'benchmark / together', ['tasks', 'baselines', 'traces', 'reproduce.md']);
  workboard([6, 2.45, -4.8], 'build / together', ['issues', 'pull requests', 'tests', 'README.md'], .78);
  // The coffee-height table belongs to a conversation, not a laboratory.
  cylinder(.55, .65, [-6, .6, -3.0], graphite);
  cylinder(1.26, .09, [-6, .97, -3.0], material('#8a796b', .52, .4));
  for (const x of [-6.6,-5.8]) { cylinder(.09,.16,[x,1.10,-2.9],white); cylinder(.075,.008,[x,1.185,-2.9],material('#3b281d')); }
  box([.55,.035,.75],[-6.05,1.05,-3.1],white).rotation.y=.25;

  const people = [
    human([-1.62,.08,1.3], '#53677f', { skin:'#bd9479', hair:'#252c35', glasses:true, pose:'talk', lookYaw:.16, scale:1.85 }),
    human([4.85,.16,-3.3], '#52788b', { skin:'#8a5e47', hairStyle:'curly', pose:'read', lookYaw:.13, scale:1.38 }),
    human([-7.05,.16,-2.5], '#c1c6bf', { skin:'#c69e83', hairStyle:'bun', pose:'coffee', lookYaw:.18, scale:1.33 }),
    human([-5.08,.16,-3.16], '#738497', { skin:'#d1ae8a', hair:'#9fa7b1', glasses:true, pose:'talk', lookYaw:-.15, scale:1.3 }),
  ];
  people[0].rotation.y=1.26; people[1].rotation.y=1.14; people[2].rotation.y=1.0; people[3].rotation.y=-.85;
  const robots = [robot([1.42,.08,1.18], '#c9d6de','round',1.95), robot([6.87,.16,-3.3],'#d1d6d8','screen',1.5)];
  robots[0].rotation.y=-1.10; robots[1].rotation.y=-1.04;
  const orb = new THREE.Group(); orb.position.set(-6.35,2.18,-2.4); orb.userData.dynamic=true; scene.add(orb);
  sphere(.35,[0,0,0],white,orb); sphere([.24,.16,.046],[0,.025,.32],ink,orb);
  for(const x of [-.078,.078]) sphere(.034,[x,.04,.36],mint,orb);
  const orbRing=ring(.43,.018,[0,0,0],bronze,orb);orbRing.rotation.x=1.25;
  orb.rotation.y=.1;
  people.forEach(actor => { actor.userData.speechHeight = 1.86; });
  robots[0].userData.speechHeight = 1.50; robots[1].userData.speechHeight = 1.60; orb.userData.speechHeight = .42;
  const casts = { benchmark:{human:people[0],agent:robots[0]}, projects:{human:people[1],agent:robots[1]}, commons:{human:people[2],agent:orb} };
  const participants = [...people, ...robots, orb];
  for (const [id, cast] of Object.entries(casts)) Object.values(cast).forEach(actor => { actor.userData.locationId = id; });
  people[3].userData.locationId = 'commons';

  // An idea travels between the participants and their shared working artifact.
  const exchanges = [
    [[-1.45,2.16,1.5],[-.7,3.1,1.3],[.7,3.1,1.3],[1.3,1.9,1.5]],
    [[5.0,1.65,-3.2],[5.5,2.3,-2.9],[6.3,2.3,-2.9],[6.7,1.5,-3.2]],
  ];
  exchanges.forEach((points,index)=>{
    const curve=new THREE.CubicBezierCurve3(...points.map(p=>new THREE.Vector3(...p)));
    const path=mesh(new THREE.TubeGeometry(curve,60,.008,5,false),new THREE.MeshBasicMaterial({color:'#8bd1e8',transparent:true,opacity:.34,depthWrite:false}));path.castShadow=false;
    const phase=index?.42:.22;
    const packet=box([.085,.085,.085],curve.getPoint(phase).toArray(),index?mint:warm);packet.userData.dynamic=true;packet.castShadow=false;
    animations.push(time=>{packet.position.copy(curve.getPoint((time*.095+phase)%1));packet.rotation.y=time*.5;packet.rotation.z=time*.4;});
  });

  // A restrained constellation gives the figures depth without filling the scene with UI.
  const random = (()=>{let seed=7919;return()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};})();
  const starPositions=[],starColors=[];
  for(let i=0;i<380;i++){
    const x=(random()-.5)*150,y=random()*80-15,z=-95-random()*20;
    starPositions.push(x,y,z);const light=.2+random()*.55;starColors.push(light*.62,light*.76,light);
  }
  const stars=new THREE.BufferGeometry();stars.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));stars.setAttribute('color',new THREE.Float32BufferAttribute(starColors,3));
  scene.add(new THREE.Points(stars,new THREE.PointsMaterial({size:.055,vertexColors:true,transparent:true,opacity:.7,depthWrite:false})));
  const glow=texture((ctx,w,h)=>{const g=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'#b2ccff');g.addColorStop(.16,'#91b4fd80');g.addColorStop(.5,'#6490ee18');g.addColorStop(1,'#4772e000');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);},128,128);
  for(let i=0;i<14;i++){
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,transparent:true,opacity:.07+random()*.12,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
    sprite.position.set((random()-.5)*110,random()*70-5,-98-random()*17);sprite.scale.setScalar(.3+random()*1.1);scene.add(sprite);
  }
  // Batch furniture globally and character parts within their nearest moving joint.
  scene.updateMatrixWorld(true);
  const batches = new Map();
  scene.traverse(object => {
    if (!object.isMesh || object.isSkinnedMesh || object.userData.dynamic || object.material.transparent || object.material.map || !object.visible) return;
    let root = scene;
    for (let parent = object.parent; parent; parent = parent.parent) {
      if (!parent.visible) return;
      if (root === scene && parent.userData.dynamic) root = parent;
    }
    const id = `${root.uuid}-${object.geometry.uuid}-${object.material.uuid}-${object.castShadow}`;
    if (!batches.has(id)) batches.set(id, { root, objects: [] });
    batches.get(id).objects.push(object);
  });
  for (const { root, objects } of batches.values()) {
    if (objects.length < 2) continue;
    const batch = new THREE.InstancedMesh(objects[0].geometry, objects[0].material, objects.length);
    batch.castShadow = objects[0].castShadow; batch.receiveShadow = true;
    const inverse = root.matrixWorld.clone().invert(), local = new THREE.Matrix4();
    objects.forEach((object, index) => { batch.setMatrixAt(index, local.multiplyMatrices(inverse, object.matrixWorld)); object.removeFromParent(); });
    root.add(batch);
  }


  let disposed=false,visible=true,moving=true,dirty=true,raf=0,last=0,clock=0,selected='benchmark';
  let width=0,height=0,initialized=false,contextAvailable=true,cameraTravel=null,readyIn=null,frames=0,mobile=null;
  let automaticPause=false,allowAutomaticPause=true,motionFPS=null;
  const frameIntervals=[];
  const projection=new THREE.Vector3();
  function draw(forceShadow=false){
    if(forceShadow||!moving||frames%3===0)key.shadow.needsUpdate=true;
    renderer.info.reset();composer.render(0);
  }
  function finishOrbitInput(){
    const damping=controls.enableDamping;controls.enableDamping=false;controls.update();controls.enableDamping=damping;
  }
  function resetView(){cameraTravel=null;finishOrbitInput();camera.position.copy(home);controls.target.copy(target);camera.zoom=1;camera.updateProjectionMatrix();controls.update();dirty=true;schedule();}
  function focusLocation(location){
    finishOrbitInput();
    const nextTarget=location.id==='benchmark'?target.clone():new THREE.Vector3(...location.target);
    if(width<900&&location.id!=='benchmark')nextTarget.y+=1.25;
    // Author the two closer views so unrelated foreground figures stay outside
    // the conversation, even after visiting the other side of the room.
    const direction=location.id==='commons'?new THREE.Vector3(-.38,.24,1):new THREE.Vector3(-.1,.25,1);
    const nextPosition=location.id==='benchmark'?home.clone():direction.normalize().multiplyScalar(width<900?10.8:11.8).add(nextTarget);
    camera.zoom=1;camera.updateProjectionMatrix();
    if(moving)cameraTravel={start:performance.now(),from:camera.position.clone(),fromTarget:controls.target.clone(),to:nextPosition,toTarget:nextTarget};
    else{camera.position.copy(nextPosition);controls.target.copy(nextTarget);controls.update();}
    dirty=true;schedule();
  }
  function resize(){
    const bounds=canvas.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
    width=bounds.width;height=bounds.height;atmosphere.resize(width,height);renderer.setSize(width,height,false);composer.setSize(width,height);camera.aspect=width/height;
    const narrow=width<900;camera.fov=narrow?THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(43/2))*height/530)):38;
    if(narrow!==mobile){mobile=narrow;home.set(...(narrow?[1.8,4.6,12]:[5.2,5.5,18.8]));target.set(...(narrow?[0,3.1,.3]:[0,2.0,-.8]));camera.position.copy(home);controls.target.copy(target);cameraTravel=null;}
    const exploring=document.fullscreenElement?.contains(canvas);
    // Reserve the upper part of the frame for the archive conversation, including
    // longer English turns. Tablet and phone layouts place the title below the cast.
    camera.setViewOffset(width,height,!narrow&&!exploring?-width*.16:0,narrow?(exploring?0:height*.03):-160,width,height);
    camera.updateProjectionMatrix();dirty=true;schedule();
  }
  function project(point){projection.copy(point).project(camera);return{x:(projection.x*.5+.5)*width,y:(-projection.y*.5+.5)*height,visible:projection.z<1&&Math.abs(projection.x)<1.2&&Math.abs(projection.y)<1.1};}
  function render(time){
    raf=0;if(disposed||!visible||document.hidden||!contextAvailable)return;
    if(cameraTravel){const p=THREE.MathUtils.clamp((time-cameraTravel.start)/1050,0,1),e=1-Math.pow(1-p,3);camera.position.lerpVectors(cameraTravel.from,cameraTravel.to,e);controls.target.lerpVectors(cameraTravel.fromTarget,cameraTravel.toTarget,e);if(p===1)cameraTravel=null;dirty=true;}
    if(moving&&!dirty&&time-last<1000/30-.5){schedule();return;}
    const interval=time-last,delta=THREE.MathUtils.clamp(interval/1000||0,0,.06);last=time;const changed=controls.update();
    if(moving){clock+=delta;animations.forEach(animate=>animate(clock));}
    if(dirty||moving||changed){
      draw();dirty=false;frames++;
      onProject?.(WORLD_LOCATIONS.map(location=>({id:location.id,...project(new THREE.Vector3(...location.point))})));
      const cast=casts[selected];
      onSpeakers?.(Object.entries(cast).map(([role,actor])=>({role,...project(new THREE.Vector3(0,actor.userData.speechHeight,0).applyMatrix4(actor.matrixWorld))})));
      if(!initialized){initialized=true;readyIn??=performance.now()-clockStart;onReady?.();}
      // Slow devices keep a finished scene and responsive reading. A deliberate
      // press of Play overrides this one-time adaptation for the current visit.
      if(moving&&allowAutomaticPause&&frames>3&&!changed&&!cameraTravel){
        frameIntervals.push(interval);
        if(frameIntervals.length===12){
          motionFPS=1000/(frameIntervals.reduce((sum,value)=>sum+value,0)/frameIntervals.length);
          frameIntervals.length=0;
          if(motionFPS<14){moving=false;automaticPause=true;onMotionChange?.(false);}
        }
      }
    }
    if(moving||changed||cameraTravel)schedule();
  }
  function schedule(){if(!raf&&!disposed&&visible&&!document.hidden&&contextAvailable)raf=requestAnimationFrame(render);}
  const controlsChange=()=>{dirty=true;schedule();},controlsStart=()=>{cameraTravel=null;};
  controls.addEventListener('change',controlsChange);controls.addEventListener('start',controlsStart);
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  let pointerStart = null;
  const pointerDown = event => {
    if (event.isPrimary && event.button === 0) pointerStart = { id:event.pointerId, x:event.clientX, y:event.clientY, time:performance.now() };
    else pointerStart = null;
  };
  const pointerMove = event => {
    if (pointerStart && Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>7) pointerStart.dragged = true;
  };
  const pointerCancel = () => { pointerStart = null; };
  const pointerUp = event => {
    const start = pointerStart; pointerStart = null;
    if (!start || start.dragged || start.id !== event.pointerId || Math.hypot(event.clientX-start.x,event.clientY-start.y)>7 || performance.now()-start.time>600) return;
    const bounds = canvas.getBoundingClientRect();
    pointer.set((event.clientX-bounds.left)/bounds.width*2-1,1-(event.clientY-bounds.top)/bounds.height*2);
    raycaster.setFromCamera(pointer,camera);
    const hit = raycaster.intersectObjects(participants,true)[0];
    if (!hit) return;
    let actor = hit.object;
    while (actor && !actor.userData.locationId) actor = actor.parent;
    if (!actor) return;
    if (onSelect) onSelect(actor.userData.locationId);
    else { selected=actor.userData.locationId;focusLocation(WORLD_LOCATIONS.find(location=>location.id===selected)); }
  };
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerCancel);
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{last=performance.now();dirty=true;schedule();}};
  document.addEventListener('visibilitychange',visibility);
  const contextLost=event=>{event.preventDefault();contextAvailable=false;cancelAnimationFrame(raf);raf=0;};
  const contextRestored=()=>{if(disposed)return;environmentMap();contextAvailable=true;initialized=false;dirty=true;last=performance.now();schedule();};
  canvas.addEventListener('webglcontextlost',contextLost);canvas.addEventListener('webglcontextrestored',contextRestored);resize();
  return{
    setVisible(value){visible=value;frameIntervals.length=0;if(value){last=performance.now();dirty=true;schedule();}else{cancelAnimationFrame(raf);raf=0;}},
    setMotion(value,{userInitiated=false}={}){moving=value;if(userInitiated){allowAutomaticPause=false;automaticPause=false;}frameIntervals.length=0;if(!value)cameraTravel=null;last=performance.now();dirty=true;schedule();},
    reset:resetView,
    zoom(direction){cameraTravel=null;camera.zoom=THREE.MathUtils.clamp(camera.zoom+direction*.12,.85,1.5);camera.updateProjectionMatrix();dirty=true;schedule();},
    rotate(direction){cameraTravel=null;const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),direction*.13);camera.position.copy(controls.target).add(offset);controls.update();dirty=true;schedule();},
    select(id,{focus=false}={}){const location=WORLD_LOCATIONS.find(item=>item.id===id);if(!location)return;selected=id;if(focus)focusLocation(location);dirty=true;schedule();},
    capture(){draw(true);return canvas.toDataURL('image/png');},
    stats(){return{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures,moving,visible,selected,readyIn,frames,automaticPause,motionFPS,camera:camera.position.toArray()};},
    dispose(){
      disposed=true;cancelAnimationFrame(raf);resizeObserver.disconnect();controls.dispose();document.removeEventListener('visibilitychange',visibility);
      canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('webglcontextrestored',contextRestored);
      controls.removeEventListener('change',controlsChange);controls.removeEventListener('start',controlsStart);
      canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerCancel);
      const geometries=new Set(),materials=new Set(),skeletons=new Set();scene.traverse(object=>{object.userData.disposeActor?.();if(object.isInstancedMesh)object.dispose();if(object.skeleton)skeletons.add(object.skeleton);if(object.geometry)geometries.add(object.geometry);if(object.material)(Array.isArray(object.material)?object.material:[object.material]).forEach(value=>materials.add(value));});
      geometries.forEach(value=>value.dispose());materials.forEach(value=>value.dispose());textures.forEach(value=>value.dispose());skeletons.forEach(value=>value.dispose());
      [renderPass,bloom,outputPass].forEach(pass=>pass.dispose());composer.dispose();atmosphere.dispose();env.dispose();hdr?.dispose();key.shadow.dispose();renderer.dispose();
    },
  };
}
