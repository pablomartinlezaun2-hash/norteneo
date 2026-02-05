import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { MUSCLE_GROUPS, MuscleGroup } from '@/data/muscleData';

interface NeoModel3DProps {
  selectedMuscle: string | null;
  onMuscleSelect: (muscleId: string) => void;
  muscleSeriesData: Record<string, number>;
}

// Individual muscle mesh component
const MuscleMesh = ({ 
  muscle, 
  isSelected, 
  onClick,
  seriesCount 
}: { 
  muscle: MuscleGroup; 
  isSelected: boolean; 
  onClick: () => void;
  seriesCount: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Calculate intensity based on series count (0-25 series = 0-1 intensity)
  const intensity = Math.min(seriesCount / 25, 1);
  
  // Animate on hover and selection
  useFrame((state) => {
    if (meshRef.current) {
      const scale = isSelected ? 1.15 : hovered ? 1.08 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
      
      // Pulse animation for selected muscle
      if (isSelected) {
        const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.02;
        meshRef.current.scale.x += pulse;
        meshRef.current.scale.y += pulse;
        meshRef.current.scale.z += pulse;
      }
    }
  });

  // Calculate color based on intensity
  const baseColor = new THREE.Color(muscle.color);
  const emissiveIntensity = isSelected ? 0.5 : hovered ? 0.3 : intensity * 0.2;
  
  return (
    <mesh
      ref={meshRef}
      position={muscle.position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <boxGeometry args={muscle.size} />
      <meshStandardMaterial
        color={baseColor}
        emissive={baseColor}
        emissiveIntensity={emissiveIntensity}
        roughness={0.4}
        metalness={0.1}
        transparent
        opacity={isSelected ? 1 : 0.85 + intensity * 0.15}
      />
    </mesh>
  );
};

// Human body base mesh
const BodyBase = () => {
  return (
    <group>
      {/* Head */}
      <mesh position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial color="#d4a574" roughness={0.5} />
      </mesh>
      
      {/* Neck */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.1, 16]} />
        <meshStandardMaterial color="#d4a574" roughness={0.5} />
      </mesh>
      
      {/* Torso base */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[0.35, 0.5, 0.18]} />
        <meshStandardMaterial color="#c4946a" roughness={0.6} opacity={0.3} transparent />
      </mesh>
      
      {/* Pelvis */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[0.32, 0.15, 0.15]} />
        <meshStandardMaterial color="#c4946a" roughness={0.6} opacity={0.3} transparent />
      </mesh>
      
      {/* Left arm base */}
      <mesh position={[-0.28, 1.1, 0]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.04, 0.05, 0.35, 16]} />
        <meshStandardMaterial color="#c4946a" roughness={0.6} opacity={0.3} transparent />
      </mesh>
      
      {/* Right arm base */}
      <mesh position={[0.28, 1.1, 0]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.04, 0.05, 0.35, 16]} />
        <meshStandardMaterial color="#c4946a" roughness={0.6} opacity={0.3} transparent />
      </mesh>
      
      {/* Left leg base */}
      <mesh position={[-0.1, 0.4, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.5, 16]} />
        <meshStandardMaterial color="#c4946a" roughness={0.6} opacity={0.3} transparent />
      </mesh>
      
      {/* Right leg base */}
      <mesh position={[0.1, 0.4, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.5, 16]} />
        <meshStandardMaterial color="#c4946a" roughness={0.6} opacity={0.3} transparent />
      </mesh>
      
      {/* Left lower leg */}
      <mesh position={[-0.1, 0.05, 0.02]}>
        <cylinderGeometry args={[0.04, 0.06, 0.35, 16]} />
        <meshStandardMaterial color="#c4946a" roughness={0.6} opacity={0.3} transparent />
      </mesh>
      
      {/* Right lower leg */}
      <mesh position={[0.1, 0.05, 0.02]}>
        <cylinderGeometry args={[0.04, 0.06, 0.35, 16]} />
        <meshStandardMaterial color="#c4946a" roughness={0.6} opacity={0.3} transparent />
      </mesh>
    </group>
  );
};

// Main scene component
const Scene = ({ selectedMuscle, onMuscleSelect, muscleSeriesData }: NeoModel3DProps) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} />
      <pointLight position={[0, 2, 2]} intensity={0.3} color="#ffffff" />
      
      <group position={[0, -0.8, 0]}>
        <BodyBase />
        
        {MUSCLE_GROUPS.map((muscle) => (
          <MuscleMesh
            key={muscle.id}
            muscle={muscle}
            isSelected={selectedMuscle === muscle.id}
            onClick={() => onMuscleSelect(muscle.id)}
            seriesCount={muscleSeriesData[muscle.id] || 0}
          />
        ))}
        
        {/* Mirror muscles for left side */}
        {MUSCLE_GROUPS.filter(m => m.id === 'arms' || m.id === 'legs').map((muscle) => (
          <MuscleMesh
            key={`${muscle.id}-left`}
            muscle={{
              ...muscle,
              position: [-muscle.position[0], muscle.position[1], muscle.position[2]] as [number, number, number],
            }}
            isSelected={selectedMuscle === muscle.id}
            onClick={() => onMuscleSelect(muscle.id)}
            seriesCount={muscleSeriesData[muscle.id] || 0}
          />
        ))}
      </group>
      
      <OrbitControls
        enablePan={false}
        minDistance={1.5}
        maxDistance={4}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
        autoRotate
        autoRotateSpeed={0.5}
      />
      
      <Environment preset="studio" />
    </>
  );
};

export const NeoModel3D = ({ selectedMuscle, onMuscleSelect, muscleSeriesData }: NeoModel3DProps) => {
  return (
    <div className="w-full h-[400px] rounded-2xl overflow-hidden bg-gradient-to-b from-muted/30 to-muted/50">
      <Canvas
        camera={{ position: [0, 0.5, 2.5], fov: 45 }}
        shadows
        dpr={[1, 2]}
      >
        <Scene
          selectedMuscle={selectedMuscle}
          onMuscleSelect={onMuscleSelect}
          muscleSeriesData={muscleSeriesData}
        />
      </Canvas>
    </div>
  );
};
