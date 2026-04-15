import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/* ═══════════════════════════════════════════
   COLOR PALETTE
   ═══════════════════════════════════════════ */

const BODY_COLOR = new THREE.Color('#1a4466');
const BODY_BRIGHT = new THREE.Color('#2a7aaa');
const NERVE_COLOR = '#c4a040';
const NERVE_BRIGHT = '#e8d060';

/* ═══════════════════════════════════════════
   BODY PART DEFINITIONS (8 stages)
   All parts = sphere geometry with non-uniform scale
   ═══════════════════════════════════════════ */

type Part = {
  pos: [number, number, number];
  scale: [number, number, number];
};

const BODY_STAGES: Part[][] = [
  // 0: Feet + Lower legs
  [
    { pos: [-0.12, -1.52, 0], scale: [0.045, 0.25, 0.04] },
    { pos: [0.12, -1.52, 0], scale: [0.045, 0.25, 0.04] },
    { pos: [-0.12, -1.8, 0.02], scale: [0.05, 0.022, 0.065] },
    { pos: [0.12, -1.8, 0.02], scale: [0.05, 0.022, 0.065] },
    { pos: [-0.12, -1.25, 0], scale: [0.038, 0.038, 0.035] },
    { pos: [0.12, -1.25, 0], scale: [0.038, 0.038, 0.035] },
  ],
  // 1: Upper legs
  [
    { pos: [-0.14, -0.82, 0], scale: [0.058, 0.28, 0.052] },
    { pos: [0.14, -0.82, 0], scale: [0.058, 0.28, 0.052] },
    { pos: [-0.14, -1.13, 0], scale: [0.042, 0.042, 0.04] },
    { pos: [0.14, -1.13, 0], scale: [0.042, 0.042, 0.04] },
  ],
  // 2: Pelvis
  [
    { pos: [0, -0.44, 0], scale: [0.2, 0.1, 0.12] },
    { pos: [-0.1, -0.5, 0], scale: [0.06, 0.06, 0.055] },
    { pos: [0.1, -0.5, 0], scale: [0.06, 0.06, 0.055] },
  ],
  // 3: Torso
  [
    { pos: [0, 0.0, 0], scale: [0.16, 0.2, 0.09] },
    { pos: [0, 0.3, 0], scale: [0.18, 0.18, 0.1] },
    { pos: [0, 0.52, 0], scale: [0.17, 0.12, 0.1] },
  ],
  // 4: Arms
  [
    { pos: [-0.27, 0.52, 0], scale: [0.05, 0.05, 0.048] },
    { pos: [0.27, 0.52, 0], scale: [0.05, 0.05, 0.048] },
    { pos: [-0.3, 0.22, 0], scale: [0.035, 0.17, 0.032] },
    { pos: [0.3, 0.22, 0], scale: [0.035, 0.17, 0.032] },
    { pos: [-0.3, 0.02, 0], scale: [0.032, 0.032, 0.03] },
    { pos: [0.3, 0.02, 0], scale: [0.032, 0.032, 0.03] },
    { pos: [-0.32, -0.15, 0], scale: [0.03, 0.15, 0.028] },
    { pos: [0.32, -0.15, 0], scale: [0.03, 0.15, 0.028] },
    { pos: [-0.33, -0.33, 0], scale: [0.022, 0.02, 0.012] },
    { pos: [0.33, -0.33, 0], scale: [0.022, 0.02, 0.012] },
  ],
  // 5: Neck
  [
    { pos: [0, 0.68, 0], scale: [0.04, 0.06, 0.038] },
  ],
  // 6: Head
  [
    { pos: [0, 0.88, 0], scale: [0.1, 0.12, 0.1] },
    { pos: [0, 0.82, 0.04], scale: [0.04, 0.03, 0.03] },
  ],
  // 7: Nervous system (no body parts - handled by NervousSystem)
  [],
];

/* ═══════════════════════════════════════════
   NERVE PATHS
   ═══════════════════════════════════════════ */

const NERVE_SPINE: [number, number, number][] = [
  [0, -0.45, 0.04],
  [0, -0.2, 0.04],
  [0, 0.05, 0.04],
  [0, 0.3, 0.04],
  [0, 0.55, 0.04],
  [0, 0.7, 0.04],
  [0, 0.88, 0.04],
];

const NERVE_PATHS: [number, number, number][][] = [
  NERVE_SPINE,
  // Left leg
  [[0, -0.45, 0.03], [-0.06, -0.55, 0.02], [-0.12, -0.75, 0.01], [-0.13, -1.0, 0], [-0.12, -1.3, 0], [-0.12, -1.55, 0]],
  // Right leg
  [[0, -0.45, 0.03], [0.06, -0.55, 0.02], [0.12, -0.75, 0.01], [0.13, -1.0, 0], [0.12, -1.3, 0], [0.12, -1.55, 0]],
  // Left arm
  [[0, 0.52, 0.03], [-0.12, 0.53, 0.02], [-0.27, 0.52, 0.01], [-0.3, 0.3, 0], [-0.31, 0.05, 0], [-0.33, -0.2, 0]],
  // Right arm
  [[0, 0.52, 0.03], [0.12, 0.53, 0.02], [0.27, 0.52, 0.01], [0.3, 0.3, 0], [0.31, 0.05, 0], [0.33, -0.2, 0]],
  // Head branches
  [[0, 0.85, 0.04], [-0.05, 0.92, 0.03], [-0.07, 0.95, 0.01]],
  [[0, 0.85, 0.04], [0.05, 0.92, 0.03], [0.07, 0.95, 0.01]],
  // Torso lateral nerves
  [[0, 0.1, 0.04], [-0.1, 0.08, 0.02], [-0.15, 0.05, 0.01]],
  [[0, 0.1, 0.04], [0.1, 0.08, 0.02], [0.15, 0.05, 0.01]],
  [[0, 0.35, 0.04], [-0.12, 0.33, 0.02], [-0.16, 0.3, 0.01]],
  [[0, 0.35, 0.04], [0.12, 0.33, 0.02], [0.16, 0.3, 0.01]],
];

/* ═══════════════════════════════════════════
   BODY PART MESH
   ═══════════════════════════════════════════ */

function BodyPartMesh({
  part,
  revealProgress,
}: {
  part: Part;
  revealProgress: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, revealProgress * 0.35, 0.08);
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity,
      revealProgress > 0.5 && revealProgress < 0.95 ? 0.8 : 0.15,
      0.05
    );
    if (wireRef.current) {
      const wMat = wireRef.current.material as THREE.MeshBasicMaterial;
      wMat.opacity = THREE.MathUtils.lerp(wMat.opacity, revealProgress * 0.12, 0.08);
    }
  });

  return (
    <group position={part.pos} scale={part.scale}>
      {/* Solid translucent body */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial
          color={BODY_COLOR}
          emissive={BODY_BRIGHT}
          emissiveIntensity={0}
          transparent
          opacity={0}
          roughness={0.3}
          metalness={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Wireframe overlay */}
      <mesh ref={wireRef}>
        <sphereGeometry args={[1.02, 12, 8]} />
        <meshBasicMaterial
          color="#4a9acc"
          wireframe
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════
   BODY STAGE GROUP
   ═══════════════════════════════════════════ */

function BodyStage({
  parts,
  buildStage,
  stageIndex,
}: {
  parts: Part[];
  buildStage: number;
  stageIndex: number;
}) {
  const [revealT, setRevealT] = useState(0);

  useFrame((_, delta) => {
    const target = buildStage >= stageIndex ? 1 : 0;
    setRevealT(prev => THREE.MathUtils.lerp(prev, target, delta * 3));
  });

  if (revealT < 0.01) return null;

  return (
    <group>
      {parts.map((p, i) => (
        <BodyPartMesh
          key={i}
          part={p}
          revealProgress={Math.max(0, Math.min(1, revealT - i * 0.05))}
        />
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════
   SIGNAL PULSE
   ═══════════════════════════════════════════ */

function SignalPulse({
  path,
  speed,
  offset,
  active,
}: {
  path: [number, number, number][];
  speed: number;
  offset: number;
  active: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const vecA = useMemo(() => new THREE.Vector3(), []);
  const vecB = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    if (!ref.current || !active) {
      if (ref.current) ref.current.visible = false;
      return;
    }
    ref.current.visible = true;
    const t = ((clock.elapsedTime * speed + offset) % 1);
    const totalSegments = path.length - 1;
    const rawIdx = t * totalSegments;
    const idx = Math.floor(rawIdx);
    const frac = rawIdx - idx;
    const a = path[Math.min(idx, path.length - 1)];
    const b = path[Math.min(idx + 1, path.length - 1)];
    vecA.set(a[0], a[1], a[2]);
    vecB.set(b[0], b[1], b[2]);
    ref.current.position.lerpVectors(vecA, vecB, frac);
    // Fade near edges
    const edgeFade = Math.sin(t * Math.PI);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = edgeFade * 0.9;
  });

  return (
    <mesh ref={ref} visible={false}>
      <sphereGeometry args={[0.012, 6, 6]} />
      <meshBasicMaterial
        color={NERVE_BRIGHT}
        transparent
        opacity={0}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════
   NERVOUS SYSTEM
   ═══════════════════════════════════════════ */

function NervousSystem({ buildStage }: { buildStage: number }) {
  const linesRef = useRef<(THREE.Line | null)[]>([]);
  const nervesActive = buildStage >= 7;
  // Partial nerve visibility: spine visible after stage 3, limbs after their stage
  const partialNerves = buildStage >= 3;

  const lineGeometries = useMemo(() => {
    return NERVE_PATHS.map(path => {
      const points = path.map(p => new THREE.Vector3(p[0], p[1], p[2]));
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      return geo;
    });
  }, []);

  useFrame(() => {
    linesRef.current.forEach((line, i) => {
      if (!line) return;
      const mat = line.material as THREE.LineBasicMaterial;
      let targetOpacity = 0;
      if (nervesActive) {
        targetOpacity = 0.5;
      } else if (partialNerves && i === 0) {
        // Spine only
        targetOpacity = 0.15;
      }
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.06);
    });
  });

  return (
    <group>
      {lineGeometries.map((geo, i) => (
        <line_
          key={i}
          ref={(el: THREE.Line | null) => { linesRef.current[i] = el; }}
          geometry={geo}
        >
          <lineBasicMaterial
            color={NERVE_COLOR}
            transparent
            opacity={0}
            depthWrite={false}
            linewidth={1}
          />
        </line_>
      ))}

      {/* Signal pulses */}
      {NERVE_PATHS.map((path, i) => (
        <SignalPulse
          key={`sig-${i}`}
          path={path}
          speed={0.3 + i * 0.05}
          offset={i * 0.15}
          active={nervesActive || (partialNerves && i === 0)}
        />
      ))}
      {/* Extra pulses on main spine */}
      {nervesActive && (
        <>
          <SignalPulse path={NERVE_SPINE} speed={0.5} offset={0.5} active />
          <SignalPulse path={NERVE_PATHS[1]} speed={0.4} offset={0.3} active />
          <SignalPulse path={NERVE_PATHS[2]} speed={0.4} offset={0.7} active />
        </>
      )}
    </group>
  );
}

/* ═══════════════════════════════════════════
   ACTIVATION FLASH
   Brief glow when a new stage reveals
   ═══════════════════════════════════════════ */

function ActivationFlash({ buildStage }: { buildStage: number }) {
  const ref = useRef<THREE.PointLight>(null);
  const prevStage = useRef(buildStage);
  const flash = useRef(0);

  useFrame((_, delta) => {
    if (buildStage !== prevStage.current) {
      prevStage.current = buildStage;
      flash.current = 1.5;
    }
    flash.current = Math.max(0, flash.current - delta * 3);
    if (ref.current) {
      ref.current.intensity = flash.current * 2;
      // Position flash near the latest body stage center
      const stage = BODY_STAGES[Math.min(buildStage, 6)];
      if (stage && stage.length > 0) {
        const center = stage[0].pos;
        ref.current.position.set(center[0], center[1], center[2] + 0.3);
      }
    }
  });

  return (
    <pointLight
      ref={ref}
      color={NERVE_BRIGHT}
      intensity={0}
      distance={2}
      decay={2}
    />
  );
}

/* ═══════════════════════════════════════════
   GROUND GRID
   ═══════════════════════════════════════════ */

function GroundGrid() {
  const ref = useRef<THREE.GridHelper>(null);
  return (
    <gridHelper
      ref={ref}
      args={[3, 20, '#1a2a3a', '#0a1520']}
      position={[0, -1.9, 0]}
    />
  );
}

/* ═══════════════════════════════════════════
   MAIN SCENE
   ═══════════════════════════════════════════ */

function AvatarScene({ buildStage }: { buildStage: number }) {
  const controlsRef = useRef<any>(null);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} color="#4488aa" />
      <directionalLight position={[2, 3, 4]} intensity={0.4} color="#88bbdd" />
      <directionalLight position={[-1, 2, -3]} intensity={0.15} color="#4466aa" />

      {/* Fog for depth */}
      <fog attach="fog" args={['#000000', 3, 8]} />

      {/* Ground reference */}
      <GroundGrid />

      {/* Body stages */}
      {BODY_STAGES.map((parts, i) =>
        parts.length > 0 ? (
          <BodyStage
            key={i}
            parts={parts}
            buildStage={buildStage}
            stageIndex={i}
          />
        ) : null
      )}

      {/* Nervous system */}
      <NervousSystem buildStage={buildStage} />

      {/* Flash on reveal */}
      <ActivationFlash buildStage={buildStage} />

      {/* Orbit controls */}
      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.7}
        minAzimuthAngle={-Math.PI * 0.3}
        maxAzimuthAngle={Math.PI * 0.3}
        enableDamping
        dampingFactor={0.08}
        autoRotate
        autoRotateSpeed={0.3}
        makeDefault
      />
    </>
  );
}

/* ═══════════════════════════════════════════
   EXPORTED COMPONENT
   ═══════════════════════════════════════════ */

interface CalibrationAvatarProps {
  buildStage: number; // -1=nothing, 0-7=body stages
}

export const CalibrationAvatar = ({ buildStage }: CalibrationAvatarProps) => {
  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{
          position: [0, -0.2, 3.2],
          fov: 35,
          near: 0.1,
          far: 20,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <AvatarScene buildStage={buildStage} />
      </Canvas>
    </div>
  );
};
