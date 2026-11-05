import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react';
import './camera.css';

// Relaying scroll onto the JS clock keeps multi-stop camera tracks in sync.
export function useSceneProgress(target, offset = ['start end', 'end start']) {
  const { scrollYProgress } = useScroll({ target, offset });
  const progress = useMotionValue(0);
  useMotionValueEvent(scrollYProgress, 'change', value => progress.set(value));
  useEffect(() => { progress.set(scrollYProgress.get()); }, [progress, scrollYProgress]);
  return progress;
}

export default function CameraScene({ children, className = '', strength = 1, orbit = false }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const progress = useSceneProgress(ref);
  const y = useTransform(progress, [0, .35, .75, 1], [54 * strength, 0, 0, -28 * strength]);
  const scale = useTransform(progress, [0, .38, .8, 1], [1 - .06 * strength, 1, 1, 1 - .015 * strength]);
  const rotateX = useTransform(progress, [0, .38, .8, 1], [5 * strength, 0, 0, -2 * strength]);
  const orbitRotate = useTransform(progress, [0, 1], [-18, 28]);
  const orbitY = useTransform(progress, [0, 1], [50, -50]);
  return <div className={'camera-scene ' + className} ref={ref}>
    {orbit && <motion.div className="scene-orbits" aria-hidden="true" style={reduce ? {} : { rotate: orbitRotate, y: orbitY }}><i/><i/><i/><span/></motion.div>}
    <motion.div className="camera-content" style={reduce ? {} : { y, scale, rotateX }}>{children}</motion.div>
  </div>;
}
