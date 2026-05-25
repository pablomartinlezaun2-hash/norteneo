import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { NeoRobotRigged, RobotBones } from './NeoRobotRigged';
import { usePoseBodyControl, PoseTargets, PoseStatus } from './usePoseBodyControl';

const LERP = 0.18;

const IDLE: PoseTargets = {
  head: { pitch: 0, yaw: 0 },
  leftArm: { x: 0, z: 0 },
  leftForeArm: { x: 0 },
  rightArm: { x: 0, z: 0 },
  rightForeArm: { x: 0 },
  hasPose: false,
};

function RiggedScene({
  targetsRef,
  enabled,
}: {
  targetsRef: React.MutableRefObject<PoseTargets>;
  enabled: boolean;
}) {
  const bonesRef = useRef<RobotBones>(null!);

  useFrame((state) => {
    const b = bonesRef.current;
    if (!b) return;
    const t = enabled ? targetsRef.current : IDLE;

    // Idle breathing when no pose
    const breath = Math.sin(state.clock.elapsedTime * 1.4) * 0.02;

    // Head
    b.head.rotation.x = THREE.MathUtils.lerp(b.head.rotation.x, t.head.pitch + breath * 0.3, LERP);
    b.head.rotation.y = THREE.MathUtils.lerp(b.head.rotation.y, t.head.yaw, LERP);

    // Left arm (robot)
    b.leftArm.rotation.x = THREE.MathUtils.lerp(b.leftArm.rotation.x, t.leftArm.x, LERP);
    b.leftArm.rotation.z = THREE.MathUtils.lerp(b.leftArm.rotation.z, t.leftArm.z, LERP);
    b.leftForeArm.rotation.x = THREE.MathUtils.lerp(b.leftForeArm.rotation.x, t.leftForeArm.x, LERP);

    // Right arm (robot)
    b.rightArm.rotation.x = THREE.MathUtils.lerp(b.rightArm.rotation.x, t.rightArm.x, LERP);
    b.rightArm.rotation.z = THREE.MathUtils.lerp(b.rightArm.rotation.z, t.rightArm.z, LERP);
    b.rightForeArm.rotation.x = THREE.MathUtils.lerp(b.rightForeArm.rotation.x, t.rightForeArm.x, LERP);
  });

  return (
    <group scale={1.9} position={[0, -0.3, 0]}>
      <NeoRobotRigged ref={bonesRef} />
    </group>
  );
}

const StatusBadge = ({ status }: { status: PoseStatus }) => {
  const map: Record<PoseStatus, { label: string; color: string }> = {
    off: { label: 'Cámara apagada', color: 'bg-white/10 text-white/60' },
    loading: { label: 'Iniciando cámara…', color: 'bg-blue-500/20 text-blue-300' },
    'no-pose': { label: 'Buscando cuerpo…', color: 'bg-amber-500/20 text-amber-300' },
    tracking: { label: 'Control activo', color: 'bg-emerald-500/20 text-emerald-300' },
    error: { label: 'Error de cámara', color: 'bg-red-500/20 text-red-300' },
  };
  const { label, color } = map[status];
  return (
    <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${color} backdrop-blur-xl`}>
      {label}
    </div>
  );
};

export const NeoInteractiveCoreGLB = () => {
  const [cameraOn, setCameraOn] = useState(false);
  const { status, targetsRef } = usePoseBodyControl(cameraOn);

  return (
    <div className="relative w-full h-full min-h-[600px] bg-black">
      <Canvas
        shadows
        camera={{ position: [0, 0.4, 3.4], fov: 35 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 5, 12]} />

        <ambientLight intensity={0.55} />
        <directionalLight
          position={[3, 5, 4]}
          intensity={2.0}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-4, 2, -2]} intensity={0.8} color="#3b82f6" />
        <pointLight position={[0, 1, 3]} intensity={1.2} color="#ffffff" />
        <spotLight position={[0, 4, 0]} angle={0.5} penumbra={0.5} intensity={1.5} color="#e0e7ff" />

        <Suspense fallback={null}>
          <RiggedScene targetsRef={targetsRef} enabled={cameraOn} />
          <Environment preset="city" />
        </Suspense>

        <ContactShadows
          position={[0, -1.55, 0]}
          opacity={0.6}
          scale={6}
          blur={2.5}
          far={2}
        />

        <OrbitControls
          enablePan={false}
          minDistance={2.8}
          maxDistance={6}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.9}
          target={[0, 0.2, 0]}
        />
      </Canvas>

      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="text-white/90 text-sm font-semibold tracking-wide">NEO · GLB Lab</div>
          <div className="text-white/40 text-xs mt-0.5">Procedural rig · MediaPipe Pose</div>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <StatusBadge status={status} />
          <button
            onClick={() => setCameraOn((v) => !v)}
            className={`px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-xl transition-all ${
              cameraOn
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-white/10 text-white border border-white/15 hover:bg-white/15'
            }`}
          >
            {cameraOn ? 'Detener cámara' : 'Camera Control'}
          </button>
        </div>
      </div>

      {/* Footer hint */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center pointer-events-none">
        <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-white/60 text-xs">
          Mueve tus brazos · La cabeza sigue tu cara · Arrastra para orbitar
        </div>
      </div>
    </div>
  );
};

export default NeoInteractiveCoreGLB;
