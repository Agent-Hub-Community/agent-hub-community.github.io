import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

// Aim a two-bone arm without changing bone lengths. The pole keeps the elbow
// outside the torso; targets are authored in the normalized character space.
function armPose(model, group, side, targetPoint, polePoint) {
  const upper = model.getObjectByName('UpperArm' + side);
  const lower = model.getObjectByName('LowerArm' + side);
  const hand = model.getObjectByName('Palm' + side) || model.getObjectByName('Wrist' + side);
  if (!upper || !lower || !hand) return () => {};
  const shoulder = new THREE.Vector3(), elbow = new THREE.Vector3(), wrist = new THREE.Vector3();
  const target = new THREE.Vector3(), pole = new THREE.Vector3(), direction = new THREE.Vector3(), normal = new THREE.Vector3();
  const from = new THREE.Vector3(), to = new THREE.Vector3(), desiredElbow = new THREE.Vector3();
  const rotation = new THREE.Quaternion(), parent = new THREE.Quaternion(), change = new THREE.Quaternion();
  function aim(bone, child, point) {
    bone.getWorldPosition(from); child.getWorldPosition(to); to.sub(from).normalize();
    from.copy(point).sub(bone.getWorldPosition(direction)).normalize();
    change.setFromUnitVectors(to, from);
    bone.getWorldQuaternion(rotation); bone.parent.getWorldQuaternion(parent).invert();
    bone.quaternion.copy(parent.multiply(change).multiply(rotation));
    bone.updateMatrixWorld(true);
  }
  return () => {
    group.updateWorldMatrix(true, true);
    upper.getWorldPosition(shoulder); lower.getWorldPosition(elbow); hand.getWorldPosition(wrist);
    target.set(...targetPoint).applyMatrix4(group.matrixWorld);
    pole.set(...polePoint).applyMatrix4(group.matrixWorld).sub(shoulder);
    const upperLength = shoulder.distanceTo(elbow), lowerLength = elbow.distanceTo(wrist);
    const distance = THREE.MathUtils.clamp(target.distanceTo(shoulder), Math.abs(upperLength - lowerLength) + .001, upperLength + lowerLength - .001);
    direction.copy(target).sub(shoulder).normalize();
    normal.copy(pole).addScaledVector(direction, -pole.dot(direction)).normalize();
    const along = (upperLength ** 2 + distance ** 2 - lowerLength ** 2) / (2 * distance);
    const outward = Math.sqrt(Math.max(0, upperLength ** 2 - along ** 2));
    desiredElbow.copy(shoulder).addScaledVector(direction, along).addScaledVector(normal, outward);
    aim(upper, lower, desiredElbow); aim(lower, hand, target);
  };
}

// These particular archived Quaternius characters are CC0. Sources and both
// source/derived hashes are recorded in assets/characters/sources.json.
export async function loadCommunityActors(baseUrl = 'assets/characters/') {
  const loader = new GLTFLoader();
  const results = await Promise.allSettled([
    loader.loadAsync(baseUrl + 'casual-character.glb'),
    loader.loadAsync(baseUrl + 'community-character.glb'),
  ]);
  return results.map(result => result.status === 'fulfilled' ? result.value : null);
}

export function createCommunityActor(template, position, coat, options, scene, animations) {
  const model = clone(template.scene), group = new THREE.Group();
  group.position.set(...position); group.scale.setScalar(options.scale || 1); group.userData.dynamic = true;
  // Cloned bones need their world matrices before measuring skinned bounds.
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  model.scale.setScalar(1.82 / size.y);
  model.position.set(-center.x * model.scale.x, -bounds.min.y * model.scale.y, -center.z * model.scale.z);
  const skeletons = [];
  const materials = new Map();
  model.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = object.receiveShadow = true;
    // The clips move limbs a little beyond their initial bounds.
    object.frustumCulled = false;
    if (object.isSkinnedMesh) {
      const candidate = object.skeleton;
      const shared = skeletons.find(skeleton => skeleton.bones.length === candidate.bones.length &&
        skeleton.bones.every((bone, i) => bone === candidate.bones[i] && skeleton.boneInverses[i].equals(candidate.boneInverses[i])));
      if (shared) object.skeleton = shared;
      else skeletons.push(candidate);
    }
    const appearance = source => {
      if (materials.has(source.uuid)) return materials.get(source.uuid);
      const material = source.clone(); material.roughness = .83; material.metalness = .025;
      if (material.name === 'Shirt' || material.name === 'LightBrown') material.color.set(coat);
      if (material.name === 'Skin') material.color.set(options.skin || '#bd9479');
      if (material.name === 'Skin_Darker') material.color.set(options.skin || '#bd9479').multiplyScalar(.82);
      if (material.name.includes('Hair') && options.hair) material.color.set(options.hair);
      if (material.name === 'Pants' || material.name === 'LightBlue') material.color.set('#35455d');
      if (material.name === 'Red_Dark') material.color.set('#324254');
      materials.set(source.uuid, material);
      return material;
    };
    object.material = Array.isArray(object.material) ? object.material.map(appearance) : appearance(object.material);
  });
  group.add(model); scene.add(group);
  const mixer = new THREE.AnimationMixer(model);
  const neutral = template.animations.find(clip => clip.name.endsWith('|Idle_Neutral')) ||
    template.animations.find(clip => clip.name.endsWith('|Female_Idle'));
  const interaction = options.pose === 'talk' && template.animations.find(clip => clip.name.endsWith('|Interact'));
  const clip = interaction || neutral;
  if (clip) mixer.clipAction(clip).play();
  const phase = Math.abs(position[0]) * 1.1;
  const head = model.getObjectByName('Head');
  const samplePose = time => mixer.setTime(interaction ? .5 + Math.sin(time * .65 + phase) * .105 : time + .6 + phase);
  samplePose(0);
  if (head) {
    head.rotation.y += options.lookYaw || 0;
    head.rotation.x += options.pose === 'read' ? .10 : .015;
  }
  group.updateWorldMatrix(true, true);
  // Keep the authored gaze fixed relative to the person. Merely removing the
  // added sine motion leaves head and torso rotation from the imported clips.
  const groupRotation = group.getWorldQuaternion(new THREE.Quaternion());
  const fixedGaze = head ? head.getWorldQuaternion(new THREE.Quaternion()).premultiply(groupRotation.clone().invert()).normalize() : null;
  const parentRotation = new THREE.Quaternion();
  const poses = options.pose === 'read' ? [
    armPose(model, group, 'R', [-.14, 1.08, .34], [-.48, 1.10, .08]),
    armPose(model, group, 'L', [.14, 1.08, .34], [.48, 1.10, .08]),
  ] : options.pose === 'coffee' ? [armPose(model, group, 'R', [-.18, 1.16, .31], [-.5, 1.02, .08])] : [];
  const animate = time => {
    samplePose(time);
    if (head) {
      group.updateWorldMatrix(true, true);
      group.getWorldQuaternion(groupRotation).multiply(fixedGaze);
      head.parent.getWorldQuaternion(parentRotation).invert();
      head.quaternion.copy(parentRotation.multiply(groupRotation)).normalize();
      head.updateWorldMatrix(false, true);
    }
    poses.forEach(pose => pose());
  };
  animate(0); animations.push(animate);
  group.userData.disposeActor = () => { mixer.stopAllAction(); mixer.uncacheRoot(model); };
  return group;
}
