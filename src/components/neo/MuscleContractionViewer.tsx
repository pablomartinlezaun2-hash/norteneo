import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Text } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Play, Pause, RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ANATOMICAL_MUSCLES, AnatomicalMuscle } from '@/data/anatomyData';

interface MuscleContractionViewerProps {
  muscleId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Animated muscle with realistic contraction
const AnimatedMuscleModel = ({ 
  muscle, 
  isContracting,
  contractionPhase 
}: { 
  muscle: AnatomicalMuscle;
  isContracting: boolean;
  contractionPhase: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const fiberRefs = useRef<THREE.Mesh[]>([]);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      
      if (isContracting) {
        // Realistic contraction: muscle shortens and bulges
        const contractAmount = Math.sin(contractionPhase * Math.PI) * 0.3;
        
        // Shorten along length axis
        meshRef.current.scale.y = 1 - contractAmount * 0.25;
        // Bulge perpendicular to contraction
        meshRef.current.scale.x = 1 + contractAmount * 0.35;
        meshRef.current.scale.z = 1 + contractAmount * 0.35;
        
        // Slight vibration during peak contraction
        if (contractionPhase > 0.3 && contractionPhase < 0.7) {
          meshRef.current.position.x += Math.sin(time * 50) * 0.002;
        }
      } else {
        // Smooth return to rest
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.05);
        meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, 0, 0.05);
      }
      
      // Subtle idle animation
      meshRef.current.rotation.y = Math.sin(time * 0.5) * 0.05;
    }
  });

  const muscleColor = new THREE.Color(muscle.color);
  const tendonColor = new THREE.Color('#e8dcc8');
  
  return (
    <group>
      {/* Main muscle belly */}
      <mesh ref={meshRef}>
        <capsuleGeometry args={[0.35, 0.9, 16, 32]} />
        <meshStandardMaterial
          color={muscleColor}
          roughness={0.4}
          metalness={0.05}
          emissive={muscleColor}
          emissiveIntensity={isContracting ? 0.3 : 0.1}
        />
      </mesh>
      
      {/* Muscle fibers visualization */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 0.28;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius,
              0,
              Math.sin(angle) * radius,
            ]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.015, 0.015, 1.1, 8]} />
            <meshStandardMaterial
              color={muscleColor}
              roughness={0.5}
              transparent
              opacity={0.4}
            />
          </mesh>
        );
      })}
      
      {/* Superior tendon (origin) */}
      <group position={[0, 0.6, 0]}>
        <mesh>
          <coneGeometry args={[0.25, 0.25, 16]} />
          <meshStandardMaterial color={tendonColor} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.2, 12]} />
          <meshStandardMaterial color={tendonColor} roughness={0.3} />
        </mesh>
      </group>
      
      {/* Inferior tendon (insertion) */}
      <group position={[0, -0.6, 0]} rotation={[Math.PI, 0, 0]}>
        <mesh>
          <coneGeometry args={[0.25, 0.25, 16]} />
          <meshStandardMaterial color={tendonColor} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.2, 12]} />
          <meshStandardMaterial color={tendonColor} roughness={0.3} />
        </mesh>
      </group>
      
      {/* Fascia layer */}
      <mesh>
        <capsuleGeometry args={[0.38, 0.85, 8, 16]} />
        <meshStandardMaterial
          color="#ffcccc"
          roughness={0.6}
          transparent
          opacity={0.15}
        />
      </mesh>
    </group>
  );
};

// Labels for anatomy
const AnatomyLabels = ({ muscle }: { muscle: AnatomicalMuscle }) => {
  return (
    <group>
      <Text
        position={[0.8, 0.5, 0]}
        fontSize={0.08}
        color="#666666"
        anchorX="left"
      >
        Origen
      </Text>
      <Text
        position={[0.8, -0.5, 0]}
        fontSize={0.08}
        color="#666666"
        anchorX="left"
      >
        Inserción
      </Text>
    </group>
  );
};

const ContractionScene = ({ 
  muscle, 
  isContracting,
  contractionPhase 
}: { 
  muscle: AnatomicalMuscle;
  isContracting: boolean;
  contractionPhase: number;
}) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <directionalLight position={[-3, 3, -3]} intensity={0.4} />
      <pointLight position={[0, 2, 2]} intensity={0.3} color={muscle.color} />
      <spotLight
        position={[0, 3, 0]}
        angle={0.5}
        penumbra={0.5}
        intensity={0.5}
        castShadow
      />
      
      <AnimatedMuscleModel 
        muscle={muscle} 
        isContracting={isContracting}
        contractionPhase={contractionPhase}
      />
      
      <AnatomyLabels muscle={muscle} />
      
      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={5}
        autoRotate={!isContracting}
        autoRotateSpeed={0.5}
      />
      
      <Environment preset="studio" />
    </>
  );
};

export const MuscleContractionViewer = ({ 
  muscleId, 
  isOpen, 
  onClose 
}: MuscleContractionViewerProps) => {
  const { t } = useTranslation();
  const [isContracting, setIsContracting] = useState(false);
  const [contractionPhase, setContractionPhase] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef<number>();
  
  // Find muscle (handle both with and without -left suffix)
  const muscle = ANATOMICAL_MUSCLES.find(m => 
    m.id === muscleId || m.id === `${muscleId}-left` || m.id.replace(/-left$/, '') === muscleId
  );
  
  useEffect(() => {
    if (!isOpen) {
      setIsContracting(false);
      setIsPlaying(false);
      setContractionPhase(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isPlaying) {
      let startTime = performance.now();
      const duration = 2000; // 2 second contraction cycle
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const phase = (elapsed % duration) / duration;
        
        setContractionPhase(phase);
        setIsContracting(phase < 0.5);
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isPlaying]);

  const handleSingleContraction = () => {
    setIsPlaying(false);
    setIsContracting(true);
    setContractionPhase(0);
    
    let startTime = performance.now();
    const duration = 1500;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const phase = Math.min(elapsed / duration, 1);
      
      setContractionPhase(phase);
      setIsContracting(phase < 0.7);
      
      if (phase < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };
  
  if (!muscle) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex flex-col bg-background"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {muscle.name}
              </h2>
              <p className="text-xs text-muted-foreground italic">
                {muscle.latinName}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* 3D Canvas */}
          <div className="flex-1 relative bg-gradient-to-b from-muted/20 to-muted/40">
            <Canvas
              camera={{ position: [0, 0, 3], fov: 45 }}
              shadows
              dpr={[1, 2]}
            >
              <ContractionScene 
                muscle={muscle} 
                isContracting={isContracting}
                contractionPhase={contractionPhase}
              />
            </Canvas>
            
            {/* Contraction indicator */}
            <AnimatePresence>
              {isContracting && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-primary/90 text-primary-foreground text-sm font-medium flex items-center gap-2"
                >
                  <Zap className="w-4 h-4 animate-pulse" />
                  Contrayendo...
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="p-4 border-t border-border bg-card space-y-4">
            {/* Playback controls */}
            <div className="flex gap-2">
              <Button
                onClick={handleSingleContraction}
                disabled={isPlaying}
                variant="outline"
                className="flex-1 h-11"
              >
                <Zap className="w-4 h-4 mr-2" />
                Contracción única
              </Button>
              <Button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex-1 h-11 gradient-primary text-primary-foreground"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Ciclo continuo
                  </>
                )}
              </Button>
            </div>
            
            {/* Anatomical info */}
            <div className="gradient-card rounded-xl p-4 border border-border space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Función Principal
                </h4>
                <p className="text-sm text-foreground">{muscle.primaryFunction}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-semibold text-muted-foreground">Inervación:</span>
                  <p className="text-foreground">{muscle.innervation}</p>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Irrigación:</span>
                  <p className="text-foreground">{muscle.bloodSupply}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
