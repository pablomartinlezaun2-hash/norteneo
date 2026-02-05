import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ANATOMICAL_MUSCLES, AnatomicalMuscle, ViewMode } from '@/data/anatomyData';

interface RealisticHumanModelProps {
  selectedMuscle: string | null;
  onMuscleSelect: (muscleId: string) => void;
  muscleSeriesData: Record<string, number>;
  viewMode: ViewMode;
  isRotating: boolean;
}

// Individual anatomical muscle mesh
const AnatomicalMuscleMesh = ({
  muscle,
  isSelected,
  isHighlighted,
  onClick,
  seriesCount,
  viewMode,
}: {
  muscle: AnatomicalMuscle;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  seriesCount: number;
  viewMode: ViewMode;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Calculate intensity based on series
  const intensity = Math.min(seriesCount / 20, 1);
  
  useFrame((state) => {
    if (meshRef.current && viewMode === 'muscles') {
      const targetScale = isSelected ? 1.08 : hovered ? 1.04 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(
          muscle.scale[0] * targetScale,
          muscle.scale[1] * targetScale,
          muscle.scale[2] * targetScale
        ),
        0.1
      );
      
      // Subtle breathing animation for selected muscle
      if (isSelected) {
        const breath = Math.sin(state.clock.elapsedTime * 2) * 0.005;
        meshRef.current.scale.x += breath;
        meshRef.current.scale.z += breath;
      }
    }
  });

  // Generate geometry based on mesh type
  const geometry = useMemo(() => {
    switch (muscle.meshType) {
      case 'capsule':
        return new THREE.CapsuleGeometry(muscle.meshParams[0], muscle.meshParams[1], 8, 16);
      case 'ellipsoid':
        return new THREE.SphereGeometry(1, 16, 12).scale(
          muscle.meshParams[0],
          muscle.meshParams[1],
          muscle.meshParams[2]
        );
      case 'box':
        return new THREE.BoxGeometry(muscle.meshParams[0], muscle.meshParams[1], muscle.meshParams[2]);
      default:
        return new THREE.CapsuleGeometry(0.03, 0.1, 8, 16);
    }
  }, [muscle.meshType, muscle.meshParams]);

  // Material properties based on state
  const materialProps = useMemo(() => {
    const baseColor = new THREE.Color(muscle.color);
    let emissiveIntensity = intensity * 0.15;
    let opacity = 0.92;
    
    if (isSelected) {
      emissiveIntensity = 0.4;
      opacity = 1;
    } else if (hovered || isHighlighted) {
      emissiveIntensity = 0.25;
      opacity = 0.95;
    }

    return {
      color: baseColor,
      emissive: baseColor,
      emissiveIntensity,
      roughness: 0.6,
      metalness: 0.05,
      transparent: true,
      opacity,
    };
  }, [muscle.color, isSelected, hovered, isHighlighted, intensity]);

  if (viewMode !== 'muscles') return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={muscle.position}
      rotation={muscle.rotation}
      scale={muscle.scale}
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
      <meshStandardMaterial {...materialProps} />
    </mesh>
  );
};

// Realistic skin layer
const SkinLayer = ({ viewMode }: { viewMode: ViewMode }) => {
  if (viewMode !== 'skin') return null;
  
  return (
    <group>
      {/* Head */}
      <mesh position={[0, 1.62, 0]}>
        <sphereGeometry args={[0.11, 32, 24]} />
        <meshStandardMaterial 
          color="#e8beac" 
          roughness={0.7} 
          metalness={0}
        />
      </mesh>
      
      {/* Neck */}
      <mesh position={[0, 1.48, 0]}>
        <cylinderGeometry args={[0.045, 0.05, 0.08, 16]} />
        <meshStandardMaterial color="#e8beac" roughness={0.7} />
      </mesh>
      
      {/* Torso */}
      <mesh position={[0, 1.15, 0]}>
        <capsuleGeometry args={[0.14, 0.35, 8, 16]} />
        <meshStandardMaterial color="#e8beac" roughness={0.7} />
      </mesh>
      
      {/* Pelvis */}
      <mesh position={[0, 0.78, 0]}>
        <sphereGeometry args={[0.15, 16, 12]} />
        <meshStandardMaterial color="#e8beac" roughness={0.7} />
      </mesh>
      
      {/* Right Arm */}
      <group position={[0.2, 1.28, 0]} rotation={[0, 0, -0.15]}>
        <mesh position={[0.05, -0.12, 0]}>
          <capsuleGeometry args={[0.035, 0.18, 8, 16]} />
          <meshStandardMaterial color="#e8beac" roughness={0.7} />
        </mesh>
        <mesh position={[0.08, -0.35, 0]}>
          <capsuleGeometry args={[0.028, 0.16, 8, 16]} />
          <meshStandardMaterial color="#e8beac" roughness={0.7} />
        </mesh>
      </group>
      
      {/* Left Arm */}
      <group position={[-0.2, 1.28, 0]} rotation={[0, 0, 0.15]}>
        <mesh position={[-0.05, -0.12, 0]}>
          <capsuleGeometry args={[0.035, 0.18, 8, 16]} />
          <meshStandardMaterial color="#e8beac" roughness={0.7} />
        </mesh>
        <mesh position={[-0.08, -0.35, 0]}>
          <capsuleGeometry args={[0.028, 0.16, 8, 16]} />
          <meshStandardMaterial color="#e8beac" roughness={0.7} />
        </mesh>
      </group>
      
      {/* Right Leg */}
      <group position={[0.08, 0.5, 0]}>
        <mesh position={[0, 0, 0]}>
          <capsuleGeometry args={[0.055, 0.28, 8, 16]} />
          <meshStandardMaterial color="#e8beac" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.32, 0.01]}>
          <capsuleGeometry args={[0.04, 0.24, 8, 16]} />
          <meshStandardMaterial color="#e8beac" roughness={0.7} />
        </mesh>
      </group>
      
      {/* Left Leg */}
      <group position={[-0.08, 0.5, 0]}>
        <mesh position={[0, 0, 0]}>
          <capsuleGeometry args={[0.055, 0.28, 8, 16]} />
          <meshStandardMaterial color="#e8beac" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.32, 0.01]}>
          <capsuleGeometry args={[0.04, 0.24, 8, 16]} />
          <meshStandardMaterial color="#e8beac" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
};

// Skeleton layer
const SkeletonLayer = ({ viewMode }: { viewMode: ViewMode }) => {
  if (viewMode !== 'skeleton') return null;
  
  const boneColor = '#f5f5dc';
  const jointColor = '#e8e4d8';
  
  return (
    <group>
      {/* Skull */}
      <mesh position={[0, 1.62, 0]}>
        <sphereGeometry args={[0.09, 16, 12]} />
        <meshStandardMaterial color={boneColor} roughness={0.4} />
      </mesh>
      
      {/* Cervical spine */}
      {[...Array(7)].map((_, i) => (
        <mesh key={`cervical-${i}`} position={[0, 1.5 - i * 0.02, -0.01]}>
          <cylinderGeometry args={[0.015, 0.018, 0.015, 8]} />
          <meshStandardMaterial color={boneColor} roughness={0.4} />
        </mesh>
      ))}
      
      {/* Thoracic spine */}
      {[...Array(12)].map((_, i) => (
        <mesh key={`thoracic-${i}`} position={[0, 1.34 - i * 0.028, -0.02]}>
          <cylinderGeometry args={[0.02, 0.022, 0.02, 8]} />
          <meshStandardMaterial color={boneColor} roughness={0.4} />
        </mesh>
      ))}
      
      {/* Lumbar spine */}
      {[...Array(5)].map((_, i) => (
        <mesh key={`lumbar-${i}`} position={[0, 0.98 - i * 0.035, -0.02]}>
          <cylinderGeometry args={[0.025, 0.028, 0.025, 8]} />
          <meshStandardMaterial color={boneColor} roughness={0.4} />
        </mesh>
      ))}
      
      {/* Ribcage */}
      {[...Array(12)].map((_, i) => (
        <group key={`rib-${i}`} position={[0, 1.32 - i * 0.028, 0]}>
          <mesh position={[0.06, 0, 0.04]} rotation={[0, 0, -0.3]}>
            <torusGeometry args={[0.08 - i * 0.003, 0.008, 8, 16, Math.PI * 0.6]} />
            <meshStandardMaterial color={boneColor} roughness={0.4} />
          </mesh>
          <mesh position={[-0.06, 0, 0.04]} rotation={[0, Math.PI, -0.3]}>
            <torusGeometry args={[0.08 - i * 0.003, 0.008, 8, 16, Math.PI * 0.6]} />
            <meshStandardMaterial color={boneColor} roughness={0.4} />
          </mesh>
        </group>
      ))}
      
      {/* Sternum */}
      <mesh position={[0, 1.18, 0.08]}>
        <boxGeometry args={[0.04, 0.18, 0.015]} />
        <meshStandardMaterial color={boneColor} roughness={0.4} />
      </mesh>
      
      {/* Clavicles */}
      <mesh position={[0.08, 1.38, 0.05]} rotation={[0, 0, 0.1]}>
        <capsuleGeometry args={[0.008, 0.12, 4, 8]} />
        <meshStandardMaterial color={boneColor} roughness={0.4} />
      </mesh>
      <mesh position={[-0.08, 1.38, 0.05]} rotation={[0, 0, -0.1]}>
        <capsuleGeometry args={[0.008, 0.12, 4, 8]} />
        <meshStandardMaterial color={boneColor} roughness={0.4} />
      </mesh>
      
      {/* Scapulae */}
      <mesh position={[0.1, 1.28, -0.06]} rotation={[0.2, 0, -0.1]}>
        <boxGeometry args={[0.08, 0.12, 0.01]} />
        <meshStandardMaterial color={boneColor} roughness={0.4} />
      </mesh>
      <mesh position={[-0.1, 1.28, -0.06]} rotation={[0.2, 0, 0.1]}>
        <boxGeometry args={[0.08, 0.12, 0.01]} />
        <meshStandardMaterial color={boneColor} roughness={0.4} />
      </mesh>
      
      {/* Pelvis */}
      <mesh position={[0, 0.78, 0]}>
        <torusGeometry args={[0.12, 0.03, 8, 16]} />
        <meshStandardMaterial color={boneColor} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.82, -0.02]}>
        <boxGeometry args={[0.08, 0.06, 0.04]} />
        <meshStandardMaterial color={boneColor} roughness={0.4} />
      </mesh>
      
      {/* Right Arm bones */}
      <group position={[0.18, 1.32, 0]} rotation={[0, 0, -0.15]}>
        {/* Shoulder joint */}
        <mesh>
          <sphereGeometry args={[0.025, 12, 8]} />
          <meshStandardMaterial color={jointColor} roughness={0.3} />
        </mesh>
        {/* Humerus */}
        <mesh position={[0.06, -0.12, 0]} rotation={[0, 0, -0.1]}>
          <capsuleGeometry args={[0.015, 0.2, 4, 8]} />
          <meshStandardMaterial color={boneColor} roughness={0.4} />
        </mesh>
        {/* Elbow joint */}
        <mesh position={[0.1, -0.24, 0]}>
          <sphereGeometry args={[0.02, 12, 8]} />
          <meshStandardMaterial color={jointColor} roughness={0.3} />
        </mesh>
        {/* Radius/Ulna */}
        <mesh position={[0.12, -0.38, 0]}>
          <capsuleGeometry args={[0.012, 0.18, 4, 8]} />
          <meshStandardMaterial color={boneColor} roughness={0.4} />
        </mesh>
      </group>
      
      {/* Left Arm bones */}
      <group position={[-0.18, 1.32, 0]} rotation={[0, 0, 0.15]}>
        <mesh>
          <sphereGeometry args={[0.025, 12, 8]} />
          <meshStandardMaterial color={jointColor} roughness={0.3} />
        </mesh>
        <mesh position={[-0.06, -0.12, 0]} rotation={[0, 0, 0.1]}>
          <capsuleGeometry args={[0.015, 0.2, 4, 8]} />
          <meshStandardMaterial color={boneColor} roughness={0.4} />
        </mesh>
        <mesh position={[-0.1, -0.24, 0]}>
          <sphereGeometry args={[0.02, 12, 8]} />
          <meshStandardMaterial color={jointColor} roughness={0.3} />
        </mesh>
        <mesh position={[-0.12, -0.38, 0]}>
          <capsuleGeometry args={[0.012, 0.18, 4, 8]} />
          <meshStandardMaterial color={boneColor} roughness={0.4} />
        </mesh>
      </group>
      
      {/* Right Leg bones */}
      <group position={[0.08, 0.68, 0]}>
        {/* Hip joint */}
        <mesh>
          <sphereGeometry args={[0.03, 12, 8]} />
          <meshStandardMaterial color={jointColor} roughness={0.3} />
        </mesh>
        {/* Femur */}
        <mesh position={[0.02, -0.18, 0]}>
          <capsuleGeometry args={[0.022, 0.28, 4, 8]} />
          <meshStandardMaterial color={boneColor} roughness={0.4} />
        </mesh>
        {/* Knee joint */}
        <mesh position={[0.02, -0.34, 0.01]}>
          <sphereGeometry args={[0.028, 12, 8]} />
          <meshStandardMaterial color={jointColor} roughness={0.3} />
        </mesh>
        {/* Tibia/Fibula */}
        <mesh position={[0.02, -0.52, 0.02]}>
          <capsuleGeometry args={[0.018, 0.24, 4, 8]} />
          <meshStandardMaterial color={boneColor} roughness={0.4} />
        </mesh>
        {/* Ankle */}
        <mesh position={[0.02, -0.66, 0.03]}>
          <sphereGeometry args={[0.02, 12, 8]} />
          <meshStandardMaterial color={jointColor} roughness={0.3} />
        </mesh>
      </group>
      
      {/* Left Leg bones */}
      <group position={[-0.08, 0.68, 0]}>
        <mesh>
          <sphereGeometry args={[0.03, 12, 8]} />
          <meshStandardMaterial color={jointColor} roughness={0.3} />
        </mesh>
        <mesh position={[-0.02, -0.18, 0]}>
          <capsuleGeometry args={[0.022, 0.28, 4, 8]} />
          <meshStandardMaterial color={boneColor} roughness={0.4} />
        </mesh>
        <mesh position={[-0.02, -0.34, 0.01]}>
          <sphereGeometry args={[0.028, 12, 8]} />
          <meshStandardMaterial color={jointColor} roughness={0.3} />
        </mesh>
        <mesh position={[-0.02, -0.52, 0.02]}>
          <capsuleGeometry args={[0.018, 0.24, 4, 8]} />
          <meshStandardMaterial color={boneColor} roughness={0.4} />
        </mesh>
        <mesh position={[-0.02, -0.66, 0.03]}>
          <sphereGeometry args={[0.02, 12, 8]} />
          <meshStandardMaterial color={jointColor} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};

export const RealisticHumanModel = ({
  selectedMuscle,
  onMuscleSelect,
  muscleSeriesData,
  viewMode,
}: RealisticHumanModelProps) => {
  const groupRef = useRef<THREE.Group>(null);

  // Get base muscle ID for matching (removing -left suffix)
  const getBaseMuscleId = (id: string) => id.replace(/-left$/, '');
  const selectedBaseId = selectedMuscle ? getBaseMuscleId(selectedMuscle) : null;

  return (
    <group ref={groupRef} position={[0, -0.7, 0]}>
      {/* Skin layer */}
      <SkinLayer viewMode={viewMode} />
      
      {/* Skeleton layer */}
      <SkeletonLayer viewMode={viewMode} />
      
      {/* Muscle meshes */}
      {ANATOMICAL_MUSCLES.map((muscle) => {
        const baseId = getBaseMuscleId(muscle.id);
        const isSelected = selectedBaseId === baseId;
        const isHighlighted = selectedMuscle ? 
          muscle.synergists.some(s => s.toLowerCase().includes(selectedMuscle.toLowerCase())) : 
          false;
        
        return (
          <AnatomicalMuscleMesh
            key={muscle.id}
            muscle={muscle}
            isSelected={isSelected}
            isHighlighted={isHighlighted}
            onClick={() => onMuscleSelect(baseId)}
            seriesCount={muscleSeriesData[baseId] || 0}
            viewMode={viewMode}
          />
        );
      })}
    </group>
  );
};
