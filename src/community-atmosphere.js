import * as THREE from 'three';
// A quiet digital commons: distant light, a shared floor, and room for people.
// The planetary backdrop belongs only to the separate Mars section.
export function createAtmosphere(scene) {
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    depthWrite: false, depthTest: false,
    uniforms: { aspect: { value: 1 }, offset: { value: .66 } },
    vertexShader: `varying vec2 uvScreen;
      void main() { uvScreen = uv; gl_Position = vec4(position.xy, .9999, 1.0); }`,
    fragmentShader: `varying vec2 uvScreen; uniform float aspect; uniform float offset;
      void main() {
        vec2 p = uvScreen - vec2(offset, .56); p.x *= min(aspect, 1.65);
        float atmosphere = exp(-dot(p * vec2(1.1, 1.65), p * vec2(1.1, 1.65)) * 4.0);
        float horizon = exp(-pow((uvScreen.y - .32) * 9.0, 2.0));
        vec3 colour = vec3(.006, .012, .027);
        colour += vec3(.021, .047, .11) * atmosphere;
        colour += vec3(.009, .019, .036) * horizon;
        gl_FragColor = vec4(colour, 1.0);
      }`,
  }));
  sky.frustumCulled = false; sky.renderOrder = -1000; scene.add(sky);

  const maskCanvas = document.createElement('canvas'); maskCanvas.width = maskCanvas.height = 256;
  const ctx = maskCanvas.getContext('2d');
  const fade = ctx.createRadialGradient(128, 128, 12, 128, 128, 112);
  fade.addColorStop(0, '#fff'); fade.addColorStop(.22, '#fff'); fade.addColorStop(1, '#000');
  ctx.fillStyle = fade; ctx.fillRect(0, 0, 256, 256);
  const mask = new THREE.CanvasTexture(maskCanvas);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), new THREE.MeshStandardMaterial({
    color: '#0f1c2b', metalness: .12, roughness: .85, envMapIntensity: .23, transparent: true, alphaMap: mask, depthWrite: false,
  }));
  floor.name = 'community-ground';
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -.12, -4); floor.receiveShadow = true; scene.add(floor);

  const pathMaterial = new THREE.LineBasicMaterial({ color: '#7298b6', transparent: true, opacity: .07 });
  for (const radius of [12, 26]) {
    const points = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2).getPoints(160);
    const path = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), pathMaterial);
    path.rotation.x = -Math.PI / 2; path.position.set(0, -.105, .6); scene.add(path);
  }

  return {
    ready: Promise.resolve(),
    resize(width, height) { sky.material.uniforms.aspect.value = width / height; sky.material.uniforms.offset.value = width >= 900 ? .67 : .5; },
    dispose() { mask.dispose(); },
  };
}
