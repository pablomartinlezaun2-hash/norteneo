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

// Realistic muscle material - simulates muscle tissue
const createMuscleMaterial = (
  color: string,
  isSelected: boolean,
  isHighlighted: boolean,
  hovered: boolean,
  intensity: number
) => {
  const baseColor = new THREE.Color(color);
  let emissiveIntensity = 0.05 + intensity * 0.08;
  let opacity = 0.94;
  let roughness = 0.55;

  if (isSelected) {
    emissiveIntensity = 0.35;
    opacity = 1;
    roughness = 0.4;
  } else if (hovered) {
    emissiveIntensity = 0.2;
    opacity = 0.98;
    roughness = 0.45;
  } else if (isHighlighted) {
    emissiveIntensity = 0.15;
    opacity = 0.96;
  }

  return {
    color: baseColor,
    emissive: baseColor,
    emissiveIntensity,
    roughness,
    metalness: 0.02,
    transparent: true,
    opacity,
  };
};

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
  const intensity = Math.min(seriesCount / 20, 1);

  useFrame((state) => {
    if (meshRef.current && viewMode === 'muscles') {
      const targetScale = isSelected ? 1.06 : hovered ? 1.03 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(
          muscle.scale[0] * targetScale,
          muscle.scale[1] * targetScale,
          muscle.scale[2] * targetScale
        ),
        0.1
      );
      if (isSelected) {
        const breath = Math.sin(state.clock.elapsedTime * 2) * 0.003;
        meshRef.current.scale.x += breath;
        meshRef.current.scale.z += breath;
      }
    }
  });

  const geometry = useMemo(() => {
    switch (muscle.meshType) {
      case 'capsule':
        return new THREE.CapsuleGeometry(muscle.meshParams[0], muscle.meshParams[1], 12, 20);
      case 'ellipsoid': {
        const geo = new THREE.SphereGeometry(1, 20, 16);
        geo.scale(muscle.meshParams[0], muscle.meshParams[1], muscle.meshParams[2]);
        return geo;
      }
      case 'box':
        return new THREE.BoxGeometry(muscle.meshParams[0], muscle.meshParams[1], muscle.meshParams[2], 4, 4, 4);
      default:
        return new THREE.CapsuleGeometry(0.03, 0.1, 12, 20);
    }
  }, [muscle.meshType, muscle.meshParams]);

  const materialProps = useMemo(
    () => createMuscleMaterial(muscle.color, isSelected, isHighlighted, hovered, intensity),
    [muscle.color, isSelected, isHighlighted, hovered, intensity]
  );

  if (viewMode !== 'muscles') return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={muscle.position}
      rotation={muscle.rotation}
      scale={muscle.scale}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
    >
      <meshStandardMaterial {...materialProps} />
    </mesh>
  );
};

// Anatomical body base - translucent silhouette showing underlying structure
const AnatomicalBodyBase = ({ viewMode }: { viewMode: ViewMode }) => {
  // Colors for anatomical appearance
  const skinTone = '#e8beac';
  const fasciaColor = '#d4a094'; // Connective tissue color
  const tendonColor = '#f0e6d8'; // Light tendon color
  
  if (viewMode === 'skin') {
    return (
      <group>
        {/* Head */}
        <mesh position={[0, 1.62, 0]}>
          <sphereGeometry args={[0.11, 32, 24]} />
          <meshStandardMaterial color={skinTone} roughness={0.7} metalness={0} />
        </mesh>
        {/* Neck */}
        <mesh position={[0, 1.48, 0]}>
          <cylinderGeometry args={[0.045, 0.05, 0.08, 16]} />
          <meshStandardMaterial color={skinTone} roughness={0.7} />
        </mesh>
        {/* Torso */}
        <mesh position={[0, 1.15, 0]}>
          <capsuleGeometry args={[0.14, 0.35, 12, 20]} />
          <meshStandardMaterial color={skinTone} roughness={0.7} />
        </mesh>
        {/* Pelvis */}
        <mesh position={[0, 0.78, 0]}>
          <sphereGeometry args={[0.15, 20, 16]} />
          <meshStandardMaterial color={skinTone} roughness={0.7} />
        </mesh>
        {/* Arms */}
        <group position={[0.2, 1.28, 0]} rotation={[0, 0, -0.15]}>
          <mesh position={[0.05, -0.12, 0]}>
            <capsuleGeometry args={[0.035, 0.18, 12, 16]} />
            <meshStandardMaterial color={skinTone} roughness={0.7} />
          </mesh>
          <mesh position={[0.08, -0.35, 0]}>
            <capsuleGeometry args={[0.028, 0.16, 12, 16]} />
            <meshStandardMaterial color={skinTone} roughness={0.7} />
          </mesh>
          {/* Hand */}
          <mesh position={[0.09, -0.5, 0]}>
            <boxGeometry args={[0.03, 0.06, 0.015]} />
            <meshStandardMaterial color={skinTone} roughness={0.7} />
          </mesh>
        </group>
        <group position={[-0.2, 1.28, 0]} rotation={[0, 0, 0.15]}>
          <mesh position={[-0.05, -0.12, 0]}>
            <capsuleGeometry args={[0.035, 0.18, 12, 16]} />
            <meshStandardMaterial color={skinTone} roughness={0.7} />
          </mesh>
          <mesh position={[-0.08, -0.35, 0]}>
            <capsuleGeometry args={[0.028, 0.16, 12, 16]} />
            <meshStandardMaterial color={skinTone} roughness={0.7} />
          </mesh>
          <mesh position={[-0.09, -0.5, 0]}>
            <boxGeometry args={[0.03, 0.06, 0.015]} />
            <meshStandardMaterial color={skinTone} roughness={0.7} />
          </mesh>
        </group>
        {/* Legs */}
        <group position={[0.08, 0.5, 0]}>
          <mesh><capsuleGeometry args={[0.055, 0.28, 12, 16]} /><meshStandardMaterial color={skinTone} roughness={0.7} /></mesh>
          <mesh position={[0, -0.32, 0.01]}><capsuleGeometry args={[0.04, 0.24, 12, 16]} /><meshStandardMaterial color={skinTone} roughness={0.7} /></mesh>
          <mesh position={[0, -0.58, 0.04]}><boxGeometry args={[0.04, 0.02, 0.08]} /><meshStandardMaterial color={skinTone} roughness={0.7} /></mesh>
        </group>
        <group position={[-0.08, 0.5, 0]}>
          <mesh><capsuleGeometry args={[0.055, 0.28, 12, 16]} /><meshStandardMaterial color={skinTone} roughness={0.7} /></mesh>
          <mesh position={[0, -0.32, 0.01]}><capsuleGeometry args={[0.04, 0.24, 12, 16]} /><meshStandardMaterial color={skinTone} roughness={0.7} /></mesh>
          <mesh position={[0, -0.58, 0.04]}><boxGeometry args={[0.04, 0.02, 0.08]} /><meshStandardMaterial color={skinTone} roughness={0.7} /></mesh>
        </group>
      </group>
    );
  }

  if (viewMode === 'skeleton') {
    return <SkeletonLayer />;
  }

  // Muscle view - show translucent fascia/connective tissue body base
  return (
    <group>
      {/* Translucent body outline - fascia layer */}
      {/* Head */}
      <mesh position={[0, 1.62, 0]}>
        <sphereGeometry args={[0.105, 24, 18]} />
        <meshStandardMaterial color="#d4a094" transparent opacity={0.25} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.48, 0]}>
        <cylinderGeometry args={[0.042, 0.048, 0.1, 16]} />
        <meshStandardMaterial color={fasciaColor} transparent opacity={0.2} roughness={0.8} />
      </mesh>
      {/* Torso - translucent to show muscles through */}
      <mesh position={[0, 1.15, 0]}>
        <capsuleGeometry args={[0.135, 0.34, 10, 18]} />
        <meshStandardMaterial color={fasciaColor} transparent opacity={0.12} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Pelvis outline */}
      <mesh position={[0, 0.78, 0]}>
        <sphereGeometry args={[0.145, 16, 12]} />
        <meshStandardMaterial color={fasciaColor} transparent opacity={0.12} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Arms - connective tissue outline */}
      <group position={[0.2, 1.28, 0]} rotation={[0, 0, -0.15]}>
        <mesh position={[0.05, -0.12, 0]}>
          <capsuleGeometry args={[0.033, 0.17, 8, 12]} />
          <meshStandardMaterial color={fasciaColor} transparent opacity={0.15} roughness={0.8} />
        </mesh>
        <mesh position={[0.08, -0.35, 0]}>
          <capsuleGeometry args={[0.026, 0.15, 8, 12]} />
          <meshStandardMaterial color={fasciaColor} transparent opacity={0.15} roughness={0.8} />
        </mesh>
        {/* Hand skeleton outline */}
        <mesh position={[0.09, -0.5, 0]}>
          <boxGeometry args={[0.028, 0.055, 0.012]} />
          <meshStandardMaterial color={tendonColor} transparent opacity={0.3} roughness={0.6} />
        </mesh>
        {/* Fingers */}
        {[0, 1, 2, 3].map(i => (
          <mesh key={`rf-${i}`} position={[0.078 + i * 0.008, -0.545, 0]}>
            <capsuleGeometry args={[0.003, 0.025, 4, 6]} />
            <meshStandardMaterial color={tendonColor} transparent opacity={0.3} roughness={0.6} />
          </mesh>
        ))}
        {/* Thumb */}
        <mesh position={[0.072, -0.51, 0.008]} rotation={[0, 0, 0.4]}>
          <capsuleGeometry args={[0.004, 0.02, 4, 6]} />
          <meshStandardMaterial color={tendonColor} transparent opacity={0.3} roughness={0.6} />
        </mesh>
      </group>
      <group position={[-0.2, 1.28, 0]} rotation={[0, 0, 0.15]}>
        <mesh position={[-0.05, -0.12, 0]}>
          <capsuleGeometry args={[0.033, 0.17, 8, 12]} />
          <meshStandardMaterial color={fasciaColor} transparent opacity={0.15} roughness={0.8} />
        </mesh>
        <mesh position={[-0.08, -0.35, 0]}>
          <capsuleGeometry args={[0.026, 0.15, 8, 12]} />
          <meshStandardMaterial color={fasciaColor} transparent opacity={0.15} roughness={0.8} />
        </mesh>
        <mesh position={[-0.09, -0.5, 0]}>
          <boxGeometry args={[0.028, 0.055, 0.012]} />
          <meshStandardMaterial color={tendonColor} transparent opacity={0.3} roughness={0.6} />
        </mesh>
        {[0, 1, 2, 3].map(i => (
          <mesh key={`lf-${i}`} position={[-0.078 - i * 0.008, -0.545, 0]}>
            <capsuleGeometry args={[0.003, 0.025, 4, 6]} />
            <meshStandardMaterial color={tendonColor} transparent opacity={0.3} roughness={0.6} />
          </mesh>
        ))}
        <mesh position={[-0.072, -0.51, 0.008]} rotation={[0, 0, -0.4]}>
          <capsuleGeometry args={[0.004, 0.02, 4, 6]} />
          <meshStandardMaterial color={tendonColor} transparent opacity={0.3} roughness={0.6} />
        </mesh>
      </group>

      {/* Legs - translucent outline */}
      <group position={[0.08, 0.5, 0]}>
        <mesh>
          <capsuleGeometry args={[0.053, 0.27, 10, 14]} />
          <meshStandardMaterial color={fasciaColor} transparent opacity={0.12} roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.32, 0.01]}>
          <capsuleGeometry args={[0.038, 0.23, 10, 14]} />
          <meshStandardMaterial color={fasciaColor} transparent opacity={0.12} roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        {/* Foot */}
        <mesh position={[0, -0.58, 0.04]}>
          <boxGeometry args={[0.035, 0.015, 0.07]} />
          <meshStandardMaterial color={tendonColor} transparent opacity={0.25} roughness={0.6} />
        </mesh>
        {/* Toes */}
        {[0, 1, 2, 3, 4].map(i => (
          <mesh key={`rt-${i}`} position={[-0.012 + i * 0.007, -0.585, 0.08]}>
            <sphereGeometry args={[0.004, 6, 4]} />
            <meshStandardMaterial color={tendonColor} transparent opacity={0.25} roughness={0.6} />
          </mesh>
        ))}
      </group>
      <group position={[-0.08, 0.5, 0]}>
        <mesh>
          <capsuleGeometry args={[0.053, 0.27, 10, 14]} />
          <meshStandardMaterial color={fasciaColor} transparent opacity={0.12} roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.32, 0.01]}>
          <capsuleGeometry args={[0.038, 0.23, 10, 14]} />
          <meshStandardMaterial color={fasciaColor} transparent opacity={0.12} roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.58, 0.04]}>
          <boxGeometry args={[0.035, 0.015, 0.07]} />
          <meshStandardMaterial color={tendonColor} transparent opacity={0.25} roughness={0.6} />
        </mesh>
        {[0, 1, 2, 3, 4].map(i => (
          <mesh key={`lt-${i}`} position={[0.012 - i * 0.007, -0.585, 0.08]}>
            <sphereGeometry args={[0.004, 6, 4]} />
            <meshStandardMaterial color={tendonColor} transparent opacity={0.25} roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* Tendon/fascia lines - white connective tissue strips */}
      {/* Linea alba (center torso line) */}
      <mesh position={[0, 1.0, 0.13]}>
        <boxGeometry args={[0.006, 0.35, 0.002]} />
        <meshStandardMaterial color={tendonColor} transparent opacity={0.5} roughness={0.4} />
      </mesh>
      {/* Clavicle tendons */}
      <mesh position={[0.1, 1.38, 0.06]} rotation={[0, 0, 0.15]}>
        <capsuleGeometry args={[0.005, 0.1, 4, 6]} />
        <meshStandardMaterial color={tendonColor} transparent opacity={0.35} roughness={0.4} />
      </mesh>
      <mesh position={[-0.1, 1.38, 0.06]} rotation={[0, 0, -0.15]}>
        <capsuleGeometry args={[0.005, 0.1, 4, 6]} />
        <meshStandardMaterial color={tendonColor} transparent opacity={0.35} roughness={0.4} />
      </mesh>
      {/* Knee tendons */}
      <mesh position={[0.08, 0.33, 0.05]}>
        <capsuleGeometry args={[0.008, 0.04, 4, 6]} />
        <meshStandardMaterial color={tendonColor} transparent opacity={0.35} roughness={0.4} />
      </mesh>
      <mesh position={[-0.08, 0.33, 0.05]}>
        <capsuleGeometry args={[0.008, 0.04, 4, 6]} />
        <meshStandardMaterial color={tendonColor} transparent opacity={0.35} roughness={0.4} />
      </mesh>
      {/* Achilles tendons */}
      <mesh position={[0.08, 0.04, -0.04]}>
        <capsuleGeometry args={[0.005, 0.06, 4, 6]} />
        <meshStandardMaterial color={tendonColor} transparent opacity={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[-0.08, 0.04, -0.04]}>
        <capsuleGeometry args={[0.005, 0.06, 4, 6]} />
        <meshStandardMaterial color={tendonColor} transparent opacity={0.4} roughness={0.3} />
      </mesh>
    </group>
  );
};

// Skeleton layer
const SkeletonLayer = () => {
  const boneColor = '#f5f5dc';
  const jointColor = '#e8e4d8';

  return (
    <group>
      {/* Skull */}
      <mesh position={[0, 1.62, 0]}>
        <sphereGeometry args={[0.09, 16, 12]} />
        <meshStandardMaterial color={boneColor} roughness={0.4} />
      </mesh>
      {/* Jaw */}
      <mesh position={[0, 1.56, 0.04]}>
        <boxGeometry args={[0.06, 0.025, 0.04]} />
        <meshStandardMaterial color={boneColor} roughness={0.4} />
      </mesh>
      {/* Cervical spine */}
      {[...Array(7)].map((_, i) => (
        <mesh key={`c-${i}`} position={[0, 1.5 - i * 0.02, -0.01]}>
          <cylinderGeometry args={[0.015, 0.018, 0.015, 8]} />
          <meshStandardMaterial color={boneColor} roughness={0.4} />
        </mesh>
      ))}
      {/* Thoracic spine */}
      {[...Array(12)].map((_, i) => (
        <mesh key={`t-${i}`} position={[0, 1.34 - i * 0.028, -0.02]}>
          <cylinderGeometry args={[0.02, 0.022, 0.02, 8]} />
          <meshStandardMaterial color={boneColor} roughness={0.4} />
        </mesh>
      ))}
      {/* Lumbar spine */}
      {[...Array(5)].map((_, i) => (
        <mesh key={`l-${i}`} position={[0, 0.98 - i * 0.035, -0.02]}>
          <cylinderGeometry args={[0.025, 0.028, 0.025, 8]} />
          <meshStandardMaterial color={boneColor} roughness={0.4} />
        </mesh>
      ))}
      {/* Ribcage */}
      {[...Array(12)].map((_, i) => (
        <group key={`r-${i}`} position={[0, 1.32 - i * 0.028, 0]}>
          <mesh position={[0.06, 0, 0.04]} rotation={[0, 0, -0.3]}>
            <torusGeometry args={[0.08 - i * 0.003, 0.006, 6, 12, Math.PI * 0.6]} />
            <meshStandardMaterial color={boneColor} roughness={0.4} />
          </mesh>
          <mesh position={[-0.06, 0, 0.04]} rotation={[0, Math.PI, -0.3]}>
            <torusGeometry args={[0.08 - i * 0.003, 0.006, 6, 12, Math.PI * 0.6]} />
            <meshStandardMaterial color={boneColor} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* Sternum */}
      <mesh position={[0, 1.18, 0.08]}>
        <boxGeometry args={[0.035, 0.17, 0.012]} />
        <meshStandardMaterial color={boneColor} roughness={0.4} />
      </mesh>
      {/* Clavicles */}
      <mesh position={[0.08, 1.38, 0.05]} rotation={[0, 0, 0.1]}>
        <capsuleGeometry args={[0.007, 0.12, 4, 8]} />
        <meshStandardMaterial color={boneColor} roughness={0.4} />
      </mesh>
      <mesh position={[-0.08, 1.38, 0.05]} rotation={[0, 0, -0.1]}>
        <capsuleGeometry args={[0.007, 0.12, 4, 8]} />
        <meshStandardMaterial color={boneColor} roughness={0.4} />
      </mesh>
      {/* Scapulae */}
      <mesh position={[0.1, 1.28, -0.06]} rotation={[0.2, 0, -0.1]}>
        <boxGeometry args={[0.07, 0.1, 0.008]} />
        <meshStandardMaterial color={boneColor} roughness={0.4} />
      </mesh>
      <mesh position={[-0.1, 1.28, -0.06]} rotation={[0.2, 0, 0.1]}>
        <boxGeometry args={[0.07, 0.1, 0.008]} />
        <meshStandardMaterial color={boneColor} roughness={0.4} />
      </mesh>
      {/* Pelvis */}
      <mesh position={[0, 0.78, 0]}>
        <torusGeometry args={[0.12, 0.025, 8, 16]} />
        <meshStandardMaterial color={boneColor} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.82, -0.02]}>
        <boxGeometry args={[0.07, 0.05, 0.035]} />
        <meshStandardMaterial color={boneColor} roughness={0.4} />
      </mesh>
      {/* Right arm */}
      <group position={[0.18, 1.32, 0]} rotation={[0, 0, -0.15]}>
        <mesh><sphereGeometry args={[0.022, 10, 8]} /><meshStandardMaterial color={jointColor} roughness={0.3} /></mesh>
        <mesh position={[0.06, -0.12, 0]} rotation={[0, 0, -0.1]}>
          <capsuleGeometry args={[0.013, 0.19, 4, 8]} /><meshStandardMaterial color={boneColor} roughness={0.4} />
        </mesh>
        <mesh position={[0.1, -0.24, 0]}><sphereGeometry args={[0.018, 10, 8]} /><meshStandardMaterial color={jointColor} roughness={0.3} /></mesh>
        <mesh position={[0.12, -0.38, 0]}><capsuleGeometry args={[0.01, 0.17, 4, 8]} /><meshStandardMaterial color={boneColor} roughness={0.4} /></mesh>
      </group>
      {/* Left arm */}
      <group position={[-0.18, 1.32, 0]} rotation={[0, 0, 0.15]}>
        <mesh><sphereGeometry args={[0.022, 10, 8]} /><meshStandardMaterial color={jointColor} roughness={0.3} /></mesh>
        <mesh position={[-0.06, -0.12, 0]} rotation={[0, 0, 0.1]}>
          <capsuleGeometry args={[0.013, 0.19, 4, 8]} /><meshStandardMaterial color={boneColor} roughness={0.4} />
        </mesh>
        <mesh position={[-0.1, -0.24, 0]}><sphereGeometry args={[0.018, 10, 8]} /><meshStandardMaterial color={jointColor} roughness={0.3} /></mesh>
        <mesh position={[-0.12, -0.38, 0]}><capsuleGeometry args={[0.01, 0.17, 4, 8]} /><meshStandardMaterial color={boneColor} roughness={0.4} /></mesh>
      </group>
      {/* Right leg */}
      <group position={[0.08, 0.68, 0]}>
        <mesh><sphereGeometry args={[0.026, 10, 8]} /><meshStandardMaterial color={jointColor} roughness={0.3} /></mesh>
        <mesh position={[0.02, -0.18, 0]}><capsuleGeometry args={[0.02, 0.27, 4, 8]} /><meshStandardMaterial color={boneColor} roughness={0.4} /></mesh>
        <mesh position={[0.02, -0.34, 0.01]}><sphereGeometry args={[0.024, 10, 8]} /><meshStandardMaterial color={jointColor} roughness={0.3} /></mesh>
        <mesh position={[0.02, -0.52, 0.02]}><capsuleGeometry args={[0.016, 0.23, 4, 8]} /><meshStandardMaterial color={boneColor} roughness={0.4} /></mesh>
        <mesh position={[0.02, -0.66, 0.03]}><sphereGeometry args={[0.018, 10, 8]} /><meshStandardMaterial color={jointColor} roughness={0.3} /></mesh>
      </group>
      {/* Left leg */}
      <group position={[-0.08, 0.68, 0]}>
        <mesh><sphereGeometry args={[0.026, 10, 8]} /><meshStandardMaterial color={jointColor} roughness={0.3} /></mesh>
        <mesh position={[-0.02, -0.18, 0]}><capsuleGeometry args={[0.02, 0.27, 4, 8]} /><meshStandardMaterial color={boneColor} roughness={0.4} /></mesh>
        <mesh position={[-0.02, -0.34, 0.01]}><sphereGeometry args={[0.024, 10, 8]} /><meshStandardMaterial color={jointColor} roughness={0.3} /></mesh>
        <mesh position={[-0.02, -0.52, 0.02]}><capsuleGeometry args={[0.016, 0.23, 4, 8]} /><meshStandardMaterial color={boneColor} roughness={0.4} /></mesh>
        <mesh position={[-0.02, -0.66, 0.03]}><sphereGeometry args={[0.018, 10, 8]} /><meshStandardMaterial color={jointColor} roughness={0.3} /></mesh>
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
  const getBaseMuscleId = (id: string) => id.replace(/-left$/, '');
  const selectedBaseId = selectedMuscle ? getBaseMuscleId(selectedMuscle) : null;

  return (
    <group ref={groupRef} position={[0, -0.7, 0]}>
      <AnatomicalBodyBase viewMode={viewMode} />
      
      {ANATOMICAL_MUSCLES.map((muscle) => {
        const baseId = getBaseMuscleId(muscle.id);
        const isSelected = selectedBaseId === baseId;
        const isHighlighted = selectedMuscle
          ? muscle.synergists.some(s => s.toLowerCase().includes(selectedMuscle.toLowerCase()))
          : false;

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
