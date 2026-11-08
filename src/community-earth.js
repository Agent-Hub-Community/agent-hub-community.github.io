import * as THREE from 'three';

const vertexShader = `
  varying vec2 earthUv;
  varying vec3 earthNormal;
  varying vec3 earthPosition;
  void main() {
    earthUv = uv;
    earthNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    earthPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

// NASA Blue Marble and Night Lights composites. This is an illustrative view,
// with an authored sun direction, rather than a simulation of the present Earth.
export function createEarth(scene) {
  const textures = new Set();
  let disposed = false;
  function placeholder(colour) {
    const texture = new THREE.DataTexture(new Uint8Array(colour), 1, 1);
    texture.needsUpdate = true; textures.add(texture); return texture;
  }
  const sunDirection = new THREE.Vector3(-.66, .54, -.34).normalize();
  const material = new THREE.ShaderMaterial({
    uniforms: {
      dayMap: { value: placeholder([6, 13, 22, 255]) },
      nightMap: { value: placeholder([0, 0, 0, 255]) },
      sunDirection: { value: sunDirection },
    },
    vertexShader,
    fragmentShader: `
      uniform sampler2D dayMap;
      uniform sampler2D nightMap;
      uniform vec3 sunDirection;
      varying vec2 earthUv;
      varying vec3 earthNormal;
      varying vec3 earthPosition;
      void main() {
        vec3 normal = normalize(earthNormal);
        vec3 view = normalize(cameraPosition - earthPosition);
        float sun = dot(normal, sunDirection);
        float daylight = smoothstep(-.16, .24, sun);
        vec3 day = texture2D(dayMap, earthUv).rgb;
        vec3 night = texture2D(nightMap, earthUv).rgb;
        vec3 surface = day * vec3(.67, .76, .88) * (.012 + max(sun, 0.0) * .68) * daylight;
        surface += night * vec3(1.10, 1.0, .88) * (1.0 - daylight) * .65;
        float limb = pow(1.0 - max(dot(normal, view), 0.0), 5.0);
        vec3 air = vec3(.025, .095, .23) * limb * (.24 + daylight * .76);
        gl_FragColor = vec4(surface + air, 1.0);
      }
    `,
  });
  const geometry = new THREE.SphereGeometry(55, 128, 80);
  const earth = new THREE.Group(); earth.name = 'earth-backdrop';
  earth.position.set(1, -39, -65); earth.rotation.set(0, 3.0, .08);
  const surface = new THREE.Mesh(geometry, material);
  surface.name = 'earth-surface'; earth.add(surface);
  const atmosphere = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
    uniforms: { sunDirection: { value: sunDirection } },
    vertexShader,
    fragmentShader: `
      uniform vec3 sunDirection;
      varying vec3 earthNormal;
      varying vec3 earthPosition;
      void main() {
        vec3 normal = normalize(earthNormal);
        vec3 view = normalize(cameraPosition - earthPosition);
        float edge = pow(1.0 - abs(dot(normal, view)), 4.0);
        float light = smoothstep(-.25, .4, dot(normal, sunDirection));
        gl_FragColor = vec4(vec3(.065, .22, .48), edge * (.15 + light * .4));
      }
    `,
    transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
  }));
  atmosphere.scale.setScalar(1.008); earth.add(atmosphere); scene.add(earth);

  const loader = new THREE.TextureLoader();
  const ready = Promise.allSettled([
    ['dayMap', 'assets/environment/earth-day.webp'],
    ['nightMap', 'assets/environment/earth-night.webp'],
  ].map(async ([key, url]) => {
    const texture = await loader.loadAsync(url);
    if (disposed) { texture.dispose(); return; }
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    textures.add(texture);
    const previous = material.uniforms[key].value;
    material.uniforms[key].value = texture;
    previous.dispose(); textures.delete(previous);
  }));

  return {
    ready,
    dispose() { disposed = true; textures.forEach(texture => texture.dispose()); textures.clear(); },
  };
}
