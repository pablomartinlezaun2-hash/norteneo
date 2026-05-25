import { forwardRef, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';

/**
 * Procedural rigged NEO robot.
 * Bones are real THREE.Group nodes organized hierarchically — equivalent to a GLB armature.
 * Exposed via ref so the pose controller can rotate them every frame.
 */
export type RobotBones = {
  head: THREE.Group;
  neck: THREE.Group;
  leftShoulder: THREE.Group;
  leftArm: THREE.Group;      // upper arm pivot
  leftForeArm: THREE.Group;  // elbow pivot
  leftHand: THREE.Group;
  rightShoulder: THREE.Group;
  rightArm: THREE.Group;
  rightForeArm: THREE.Group;
  rightHand: THREE.Group;
};

const BLACK = '#1a1a2e';
const ACCENT = '#3b82f6';

const bodyMat = (
  <meshStandardMaterial
    color={BLACK}
    metalness={0.85}
    roughness={0.28}
  />
);

const visorMat = (
  <meshStandardMaterial
    color={ACCENT}
    emissive={ACCENT}
    emissiveIntensity={0.9}
    metalness={0.6}
    roughness={0.2}
  />
);

const jointMat = (
  <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.35} />
);

// Upper arm segment built downwards from shoulder pivot (so rotation pivots at shoulder)
const ArmSegment = ({ length, radius }: { length: number; radius: number }) => (
  <group>
    <mesh position={[0, -length / 2, 0]} castShadow>
      <capsuleGeometry args={[radius, length * 0.85, 8, 16]} />
      {bodyMat}
    </mesh>
  </group>
);

export const NeoRobotRigged = forwardRef<RobotBones>((_, ref) => {
  const head = useRef<THREE.Group>(null!);
  const neck = useRef<THREE.Group>(null!);
  const lShoulder = useRef<THREE.Group>(null!);
  const lArm = useRef<THREE.Group>(null!);
  const lForeArm = useRef<THREE.Group>(null!);
  const lHand = useRef<THREE.Group>(null!);
  const rShoulder = useRef<THREE.Group>(null!);
  const rArm = useRef<THREE.Group>(null!);
  const rForeArm = useRef<THREE.Group>(null!);
  const rHand = useRef<THREE.Group>(null!);

  useImperativeHandle(ref, () => ({
    head: head.current,
    neck: neck.current,
    leftShoulder: lShoulder.current,
    leftArm: lArm.current,
    leftForeArm: lForeArm.current,
    leftHand: lHand.current,
    rightShoulder: rShoulder.current,
    rightArm: rArm.current,
    rightForeArm: rForeArm.current,
    rightHand: rHand.current,
  }));

  const upperArmLen = 0.7;
  const foreArmLen = 0.65;

  return (
    <group position={[0, -0.2, 0]}>
      {/* Pelvis / Hips */}
      <mesh position={[0, -0.6, 0]} castShadow>
        <boxGeometry args={[0.55, 0.35, 0.4]} />
        {bodyMat}
      </mesh>

      {/* Torso (Spine) */}
      <group position={[0, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.75, 0.95, 0.45]} />
          {bodyMat}
        </mesh>
        {/* Chest visor */}
        <mesh position={[0, 0.15, 0.23]}>
          <boxGeometry args={[0.35, 0.18, 0.02]} />
          {visorMat}
        </mesh>

        {/* Neck (rotates with head pitch slightly) */}
        <group ref={neck} position={[0, 0.55, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.09, 0.11, 0.18, 16]} />
            {jointMat}
          </mesh>

          {/* Head pivot */}
          <group ref={head} position={[0, 0.25, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              {bodyMat}
            </mesh>
            {/* Visor (eyes) */}
            <mesh position={[0, 0.04, 0.255]}>
              <boxGeometry args={[0.38, 0.12, 0.01]} />
              {visorMat}
            </mesh>
            {/* Antenna */}
            <mesh position={[0, 0.32, 0]} castShadow>
              <cylinderGeometry args={[0.012, 0.012, 0.18, 8]} />
              {jointMat}
            </mesh>
            <mesh position={[0, 0.42, 0]}>
              <sphereGeometry args={[0.025, 12, 12]} />
              {visorMat}
            </mesh>
          </group>
        </group>

        {/* LEFT shoulder (robot's left = screen right when facing camera) */}
        <group ref={lShoulder} position={[0.45, 0.38, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.13, 16, 16]} />
            {jointMat}
          </mesh>
          {/* Upper arm pivot */}
          <group ref={lArm} position={[0, -0.05, 0]}>
            <ArmSegment length={upperArmLen} radius={0.09} />
            {/* Elbow pivot at end of upper arm */}
            <group ref={lForeArm} position={[0, -upperArmLen, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.09, 14, 14]} />
                {jointMat}
              </mesh>
              <ArmSegment length={foreArmLen} radius={0.075} />
              {/* Wrist / Hand pivot */}
              <group ref={lHand} position={[0, -foreArmLen, 0]}>
                <mesh castShadow>
                  <boxGeometry args={[0.16, 0.2, 0.1]} />
                  {bodyMat}
                </mesh>
              </group>
            </group>
          </group>
        </group>

        {/* RIGHT shoulder */}
        <group ref={rShoulder} position={[-0.45, 0.38, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.13, 16, 16]} />
            {jointMat}
          </mesh>
          <group ref={rArm} position={[0, -0.05, 0]}>
            <ArmSegment length={upperArmLen} radius={0.09} />
            <group ref={rForeArm} position={[0, -upperArmLen, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.09, 14, 14]} />
                {jointMat}
              </mesh>
              <ArmSegment length={foreArmLen} radius={0.075} />
              <group ref={rHand} position={[0, -foreArmLen, 0]}>
                <mesh castShadow>
                  <boxGeometry args={[0.16, 0.2, 0.1]} />
                  {bodyMat}
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* Legs (static) */}
      <group position={[0.16, -1.0, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.11, 0.55, 8, 14]} />
          {bodyMat}
        </mesh>
        <mesh position={[0, -0.45, 0]} castShadow>
          <boxGeometry args={[0.2, 0.1, 0.3]} />
          {jointMat}
        </mesh>
      </group>
      <group position={[-0.16, -1.0, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.11, 0.55, 8, 14]} />
          {bodyMat}
        </mesh>
        <mesh position={[0, -0.45, 0]} castShadow>
          <boxGeometry args={[0.2, 0.1, 0.3]} />
          {jointMat}
        </mesh>
      </group>
    </group>
  );
});

NeoRobotRigged.displayName = 'NeoRobotRigged';
