import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

// Muscle positions for the mini 3D model
const musclePositions: Record<string, { position: [number, number, number]; scale: [number, number, number]; color: string }> = {
  'Pecho': { position: [0, 1.2, 0.3], scale: [0.5, 0.3, 0.2], color: '#ef4444' },
  'Espalda': { position: [0, 1.2, -0.3], scale: [0.5, 0.4, 0.2], color: '#3b82f6' },
  'Hombros': { position: [0, 1.5, 0], scale: [0.7, 0.15, 0.2], color: '#f97316' },
  'Bíceps': { position: [0.5, 0.9, 0], scale: [0.12, 0.25, 0.12], color: '#22c55e' },
  'Tríceps': { position: [-0.5, 0.9, 0], scale: [0.12, 0.25, 0.12], color: '#8b5cf6' },
  'Cuádriceps': { position: [0.15, 0, 0.1], scale: [0.18, 0.4, 0.15], color: '#ec4899' },
  'Isquiotibiales': { position: [0.15, 0, -0.1], scale: [0.18, 0.4, 0.12], color: '#14b8a6' },
  'Glúteos': { position: [0, 0.4, -0.15], scale: [0.35, 0.2, 0.15], color: '#f59e0b' },
  'Core': { position: [0, 0.7, 0.2], scale: [0.3, 0.35, 0.15], color: '#06b6d4' },
  'Gemelos': { position: [0.15, -0.5, -0.05], scale: [0.1, 0.2, 0.1], color: '#a855f7' },
};

interface MuscleProps {
  name: string;
  isHighlighted: boolean;
}

const Muscle = ({ name, isHighlighted }: MuscleProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const config = musclePositions[name];
  
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: config?.color || '#666666',
      transparent: true,
      opacity: isHighlighted ? 0.9 : 0.3,
      emissive: isHighlighted ? config?.color || '#666666' : '#000000',
      emissiveIntensity: isHighlighted ? 0.3 : 0,
    });
  }, [config?.color, isHighlighted]);

  useFrame((state) => {
    if (meshRef.current && isHighlighted) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.05);
    }
  });

  if (!config) return null;

  return (
    <mesh 
      ref={meshRef}
      position={config.position} 
      material={material}
    >
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial {...material} />
    </mesh>
  );
};

const HumanFigure = ({ highlightedMuscles }: { highlightedMuscles: string[] }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body base - torso */}
      <mesh position={[0, 1, 0]}>
        <capsuleGeometry args={[0.25, 0.8, 8, 16]} />
        <meshStandardMaterial color="#e5e5e5" transparent opacity={0.5} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#e5e5e5" transparent opacity={0.5} />
      </mesh>
      
      {/* Legs */}
      <mesh position={[0.15, 0, 0]}>
        <capsuleGeometry args={[0.1, 0.7, 8, 16]} />
        <meshStandardMaterial color="#e5e5e5" transparent opacity={0.5} />
      </mesh>
      <mesh position={[-0.15, 0, 0]}>
        <capsuleGeometry args={[0.1, 0.7, 8, 16]} />
        <meshStandardMaterial color="#e5e5e5" transparent opacity={0.5} />
      </mesh>
      
      {/* Arms */}
      <mesh position={[0.45, 1.1, 0]} rotation={[0, 0, -0.3]}>
        <capsuleGeometry args={[0.06, 0.5, 8, 16]} />
        <meshStandardMaterial color="#e5e5e5" transparent opacity={0.5} />
      </mesh>
      <mesh position={[-0.45, 1.1, 0]} rotation={[0, 0, 0.3]}>
        <capsuleGeometry args={[0.06, 0.5, 8, 16]} />
        <meshStandardMaterial color="#e5e5e5" transparent opacity={0.5} />
      </mesh>

      {/* Highlighted muscles */}
      {Object.keys(musclePositions).map(muscle => (
        <Muscle 
          key={muscle}
          name={muscle}
          isHighlighted={highlightedMuscles.includes(muscle)}
        />
      ))}
    </group>
  );
};

interface MuscleHighlight3DProps {
  muscles: string[];
  className?: string;
}

export const MuscleHighlight3D = ({ muscles, className = '' }: MuscleHighlight3DProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 ${className}`}
    >
      <div className="h-48 w-full">
        <Canvas camera={{ position: [0, 1, 3], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <pointLight position={[5, 5, 5]} intensity={0.8} />
          <pointLight position={[-5, 5, -5]} intensity={0.4} />
          <Suspense fallback={null}>
            <HumanFigure highlightedMuscles={muscles} />
          </Suspense>
          <OrbitControls 
            enableZoom={true}
            enablePan={false}
            minDistance={2}
            maxDistance={5}
            autoRotate={false}
          />
        </Canvas>
      </div>
      
      {/* Muscle legend */}
      <div className="px-3 py-2 border-t border-border bg-card/50">
        <div className="flex flex-wrap gap-1.5">
          {muscles.map(muscle => (
            <span 
              key={muscle}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{ 
                backgroundColor: `${musclePositions[muscle]?.color}20`,
                color: musclePositions[muscle]?.color 
              }}
            >
              {muscle}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
