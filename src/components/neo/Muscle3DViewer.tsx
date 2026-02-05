import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MUSCLE_GROUPS } from '@/data/muscleData';

interface Muscle3DViewerProps {
  muscleId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Animated muscle component with contraction animation
const AnimatedMuscle = ({ color, isContracting }: { color: string; isContracting: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [contractPhase, setContractPhase] = useState(0);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Contraction animation
      const time = state.clock.elapsedTime;
      const contractAmount = isContracting ? Math.sin(time * 2) * 0.1 : 0;
      
      // Scale animation to simulate contraction
      meshRef.current.scale.x = 1 + contractAmount * 0.3;
      meshRef.current.scale.y = 1 - contractAmount * 0.2;
      meshRef.current.scale.z = 1 + contractAmount * 0.3;
      
      // Slight rotation for visual interest
      meshRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
    }
  });

  return (
    <group>
      {/* Main muscle body */}
      <mesh ref={meshRef}>
        <capsuleGeometry args={[0.4, 1, 16, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.1}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Muscle fibers (visual detail) */}
      {[...Array(8)].map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 8) * Math.PI * 2) * 0.35,
            0,
            Math.sin((i / 8) * Math.PI * 2) * 0.35,
          ]}
        >
          <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
          <meshStandardMaterial
            color={color}
            roughness={0.5}
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}
      
      {/* Tendon ends */}
      <mesh position={[0, 0.7, 0]}>
        <coneGeometry args={[0.3, 0.3, 16]} />
        <meshStandardMaterial color="#e0d5c7" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.7, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.3, 0.3, 16]} />
        <meshStandardMaterial color="#e0d5c7" roughness={0.4} />
      </mesh>
    </group>
  );
};

const Scene = ({ muscleColor, isContracting }: { muscleColor: string; isContracting: boolean }) => {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-5, 3, -5]} intensity={0.5} />
      <pointLight position={[0, 2, 2]} intensity={0.3} color={muscleColor} />
      
      <AnimatedMuscle color={muscleColor} isContracting={isContracting} />
      
      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={5}
        autoRotate={!isContracting}
        autoRotateSpeed={1}
      />
      
      <Environment preset="studio" />
    </>
  );
};

export const Muscle3DViewer = ({ muscleId, isOpen, onClose }: Muscle3DViewerProps) => {
  const { t } = useTranslation();
  const [isContracting, setIsContracting] = useState(false);
  
  const muscle = MUSCLE_GROUPS.find(m => m.id === muscleId);
  
  if (!muscle) return null;

  const handleContraction = () => {
    setIsContracting(true);
    setTimeout(() => setIsContracting(false), 3000);
  };

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
          <div className="flex items-center justify-between px-4 py-4 border-b border-border">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {t(muscle.nameKey)} - 3D
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('neo.contraction')}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* 3D Canvas */}
          <div className="flex-1 relative">
            <Canvas
              camera={{ position: [0, 0, 3], fov: 45 }}
              shadows
              dpr={[1, 2]}
            >
              <Scene muscleColor={muscle.color} isContracting={isContracting} />
            </Canvas>
            
            {/* Contraction indicator */}
            {isContracting && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-primary/90 text-primary-foreground text-sm font-medium"
              >
                Contrayendo...
              </motion.div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 border-t border-border space-y-4">
            <Button
              onClick={handleContraction}
              disabled={isContracting}
              className="w-full h-12 gradient-primary text-primary-foreground glow-primary"
            >
              <RotateCcw className={`w-5 h-5 mr-2 ${isContracting ? 'animate-spin' : ''}`} />
              {isContracting ? 'Contrayendo...' : 'Ver contracción'}
            </Button>
            
            {/* Explanation */}
            <div className="gradient-card rounded-xl p-4 border border-border">
              <h4 className="font-semibold text-foreground mb-2">
                {t('neo.howItWorks')}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(muscle.descKey)}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
