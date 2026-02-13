import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

interface MascotBodyProps {
  progress: number; // 0-100
}

const MascotBody = ({ progress }: MascotBodyProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const p = Math.max(0, Math.min(progress, 100)) / 100;

  // Muscle scale grows from skinny (0.6) to buff (1.4)
  const muscleScale = 0.6 + p * 0.8;
  // Arm thickness
  const armThick = 0.05 + p * 0.06;
  // Leg thickness
  const legThick = 0.08 + p * 0.06;
  // Chest width
  const chestWidth = 0.2 + p * 0.15;
  // Shoulder width offset
  const shoulderOff = 0.3 + p * 0.15;

  const skinColor = useMemo(() => {
    // Goes from pale to healthy tan as progress increases
    const r = 0.85 + p * 0.1;
    const g = 0.7 + p * 0.05;
    const b = 0.6 - p * 0.05;
    return new THREE.Color(r, g, b);
  }, [p]);

  const muscleColor = useMemo(() => {
    // Subtle muscle definition color
    const hue = 0.0; // reddish
    const sat = 0.15 + p * 0.35;
    const light = 0.65 + p * 0.1;
    return new THREE.Color().setHSL(hue, sat, light);
  }, [p]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      // Subtle breathing
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.01;
      groupRef.current.scale.set(breathe, breathe, breathe);
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {/* Head */}
      <mesh position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.04, 1.68, 0.12]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.04, 1.68, 0.12]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Smile - wider when more progress */}
      <mesh position={[0, 1.62, 0.12]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.03 + p * 0.02, 0.008, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#c0392b" />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.48, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.1, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>

      {/* Torso - gets wider/thicker with progress */}
      <mesh position={[0, 1.15, 0]}>
        <capsuleGeometry args={[chestWidth, 0.4 + p * 0.1, 8, 16]} />
        <meshStandardMaterial color={muscleColor} roughness={0.5} />
      </mesh>

      {/* Pecs - visible bumps when progress > 40% */}
      {p > 0.4 && (
        <>
          <mesh position={[-0.08, 1.28, chestWidth * 0.7]}>
            <sphereGeometry args={[0.06 * p, 12, 12]} />
            <meshStandardMaterial color={muscleColor} roughness={0.5} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0.08, 1.28, chestWidth * 0.7]}>
            <sphereGeometry args={[0.06 * p, 12, 12]} />
            <meshStandardMaterial color={muscleColor} roughness={0.5} transparent opacity={0.9} />
          </mesh>
        </>
      )}

      {/* Abs - visible when progress > 60% */}
      {p > 0.6 && Array.from({ length: 3 }).map((_, i) => (
        <group key={`abs-${i}`}>
          <mesh position={[-0.04, 1.08 - i * 0.07, chestWidth * 0.65]}>
            <sphereGeometry args={[0.025 * p, 8, 8]} />
            <meshStandardMaterial color={muscleColor} roughness={0.4} transparent opacity={0.7} />
          </mesh>
          <mesh position={[0.04, 1.08 - i * 0.07, chestWidth * 0.65]}>
            <sphereGeometry args={[0.025 * p, 8, 8]} />
            <meshStandardMaterial color={muscleColor} roughness={0.4} transparent opacity={0.7} />
          </mesh>
        </group>
      ))}

      {/* Shoulders - deltoids grow */}
      <mesh position={[-shoulderOff, 1.38, 0]}>
        <sphereGeometry args={[0.06 + p * 0.04, 12, 12]} />
        <meshStandardMaterial color={muscleColor} roughness={0.5} />
      </mesh>
      <mesh position={[shoulderOff, 1.38, 0]}>
        <sphereGeometry args={[0.06 + p * 0.04, 12, 12]} />
        <meshStandardMaterial color={muscleColor} roughness={0.5} />
      </mesh>

      {/* Arms */}
      {/* Left arm */}
      <mesh position={[-shoulderOff, 1.15, 0]} rotation={[0, 0, 0.15 + p * 0.1]}>
        <capsuleGeometry args={[armThick, 0.3, 8, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>
      {/* Left bicep bump */}
      {p > 0.3 && (
        <mesh position={[-shoulderOff - 0.02, 1.18, 0.02]}>
          <sphereGeometry args={[armThick * 0.8 * p, 10, 10]} />
          <meshStandardMaterial color={muscleColor} roughness={0.5} transparent opacity={0.8} />
        </mesh>
      )}
      {/* Right arm */}
      <mesh position={[shoulderOff, 1.15, 0]} rotation={[0, 0, -0.15 - p * 0.1]}>
        <capsuleGeometry args={[armThick, 0.3, 8, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>
      {/* Right bicep bump */}
      {p > 0.3 && (
        <mesh position={[shoulderOff + 0.02, 1.18, 0.02]}>
          <sphereGeometry args={[armThick * 0.8 * p, 10, 10]} />
          <meshStandardMaterial color={muscleColor} roughness={0.5} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Hips / waist */}
      <mesh position={[0, 0.75, 0]}>
        <capsuleGeometry args={[0.15 + p * 0.05, 0.15, 8, 16]} />
        <meshStandardMaterial color="#3b5998" roughness={0.8} /> {/* shorts */}
      </mesh>

      {/* Legs */}
      <mesh position={[-0.1, 0.35, 0]}>
        <capsuleGeometry args={[legThick, 0.35, 8, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>
      {/* Left quad bump */}
      {p > 0.5 && (
        <mesh position={[-0.1, 0.4, legThick * 0.6]}>
          <sphereGeometry args={[legThick * 0.5 * p, 10, 10]} />
          <meshStandardMaterial color={muscleColor} roughness={0.5} transparent opacity={0.7} />
        </mesh>
      )}
      <mesh position={[0.1, 0.35, 0]}>
        <capsuleGeometry args={[legThick, 0.35, 8, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>
      {/* Right quad bump */}
      {p > 0.5 && (
        <mesh position={[0.1, 0.4, legThick * 0.6]}>
          <sphereGeometry args={[legThick * 0.5 * p, 10, 10]} />
          <meshStandardMaterial color={muscleColor} roughness={0.5} transparent opacity={0.7} />
        </mesh>
      )}

      {/* Calves */}
      <mesh position={[-0.1, -0.05, -0.02]}>
        <capsuleGeometry args={[0.05 + p * 0.02, 0.2, 8, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>
      <mesh position={[0.1, -0.05, -0.02]}>
        <capsuleGeometry args={[0.05 + p * 0.02, 0.2, 8, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>

      {/* Feet */}
      <mesh position={[-0.1, -0.22, 0.04]}>
        <boxGeometry args={[0.08, 0.04, 0.12]} />
        <meshStandardMaterial color="#2c3e50" roughness={0.9} />
      </mesh>
      <mesh position={[0.1, -0.22, 0.04]}>
        <boxGeometry args={[0.08, 0.04, 0.12]} />
        <meshStandardMaterial color="#2c3e50" roughness={0.9} />
      </mesh>
    </group>
  );
};

interface NutritionMascot3DProps {
  progress: number;
  className?: string;
}

export const NutritionMascot3D = ({ progress, className = '' }: NutritionMascot3DProps) => {
  const p = Math.max(0, Math.min(progress, 100));
  
  const label = p >= 95 ? '¡Máquina!' : p >= 80 ? '¡Vas fuerte!' : p >= 60 ? 'Creciendo...' : p >= 30 ? 'Empezando' : 'Aliméntame';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl overflow-hidden bg-gradient-to-br from-muted/80 to-muted/30 border border-border/50 ${className}`}
    >
      <div className="h-40 w-full">
        <Canvas camera={{ position: [0, 0.8, 2.2], fov: 40 }}>
          <ambientLight intensity={0.7} />
          <pointLight position={[3, 4, 3]} intensity={0.9} />
          <pointLight position={[-2, 3, -2]} intensity={0.3} />
          <directionalLight position={[0, 5, 5]} intensity={0.4} />
          <Suspense fallback={null}>
            <MascotBody progress={p} />
          </Suspense>
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 2.2}
            autoRotate={false}
          />
        </Canvas>
      </div>
      <div className="px-3 py-2 border-t border-border/50 flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className="text-[11px] font-bold tabular-nums text-foreground">{p.toFixed(0)}%</span>
      </div>
    </motion.div>
  );
};
