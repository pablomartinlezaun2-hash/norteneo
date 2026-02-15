import { useEffect, useRef, useState } from 'react';
import { getAnimationForExercise, ExerciseAnimationType } from './animationMappings';
import { Play, Pause } from 'lucide-react';

interface ExerciseSVGAnimationProps {
  exerciseName: string;
  className?: string;
  compact?: boolean;
}

// Stick figure dimensions
const HEAD_R = 6;
const BODY_TOP = 18;
const BODY_BOTTOM = 38;
const SHOULDER_W = 10;
const HIP_W = 7;

interface Pose {
  // Head offset
  headX?: number;
  headY?: number;
  // Arm angles (degrees from shoulder)
  leftArmUpper: number;
  leftArmLower: number;
  rightArmUpper: number;
  rightArmLower: number;
  // Leg angles (degrees from hip)
  leftLegUpper: number;
  leftLegLower: number;
  rightLegUpper: number;
  rightLegLower: number;
  // Body tilt
  bodyTilt?: number;
  // Crouch (lower body Y offset)
  crouch?: number;
  // Equipment
  hasBarbell?: boolean;
  hasDumbbell?: boolean;
}

const exercisePoses: Record<ExerciseAnimationType, Pose[]> = {
  'bench-press': [
    { leftArmUpper: -90, leftArmLower: -90, rightArmUpper: -90, rightArmLower: -90, leftLegUpper: 45, leftLegLower: -90, rightLegUpper: 45, rightLegLower: -90, bodyTilt: -90, hasBarbell: true },
    { leftArmUpper: -90, leftArmLower: 0, rightArmUpper: -90, rightArmLower: 0, leftLegUpper: 45, leftLegLower: -90, rightLegUpper: 45, rightLegLower: -90, bodyTilt: -90, hasBarbell: true },
  ],
  'overhead-press': [
    { leftArmUpper: -160, leftArmLower: -30, rightArmUpper: -160, rightArmLower: -30, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0, hasBarbell: true },
    { leftArmUpper: -180, leftArmLower: 0, rightArmUpper: -180, rightArmLower: 0, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0, hasBarbell: true },
  ],
  'squat': [
    { leftArmUpper: -80, leftArmLower: -20, rightArmUpper: -80, rightArmLower: -20, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0, hasBarbell: true },
    { leftArmUpper: -80, leftArmLower: -20, rightArmUpper: -80, rightArmLower: -20, leftLegUpper: 70, leftLegLower: -120, rightLegUpper: 70, rightLegLower: -120, crouch: 18, hasBarbell: true },
  ],
  'deadlift': [
    { leftArmUpper: 0, leftArmLower: 0, rightArmUpper: 0, rightArmLower: 0, leftLegUpper: 50, leftLegLower: -60, rightLegUpper: 50, rightLegLower: -60, bodyTilt: 45, crouch: 12, hasBarbell: true },
    { leftArmUpper: 0, leftArmLower: 0, rightArmUpper: 0, rightArmLower: 0, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0, hasBarbell: true },
  ],
  'bicep-curl': [
    { leftArmUpper: 0, leftArmLower: 0, rightArmUpper: 0, rightArmLower: 0, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0, hasDumbbell: true },
    { leftArmUpper: 0, leftArmLower: -140, rightArmUpper: 0, rightArmLower: -140, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0, hasDumbbell: true },
  ],
  'tricep-extension': [
    { leftArmUpper: -180, leftArmLower: -40, rightArmUpper: -180, rightArmLower: -40, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0, hasDumbbell: true },
    { leftArmUpper: -180, leftArmLower: 0, rightArmUpper: -180, rightArmLower: 0, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0, hasDumbbell: true },
  ],
  'lateral-raise': [
    { leftArmUpper: 10, leftArmLower: 10, rightArmUpper: 10, rightArmLower: 10, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0, hasDumbbell: true },
    { leftArmUpper: -80, leftArmLower: 10, rightArmUpper: -80, rightArmLower: 10, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0, hasDumbbell: true },
  ],
  'row': [
    { leftArmUpper: 20, leftArmLower: 0, rightArmUpper: 20, rightArmLower: 0, leftLegUpper: 15, leftLegLower: -10, rightLegUpper: 15, rightLegLower: -10, bodyTilt: 40, hasBarbell: true },
    { leftArmUpper: 20, leftArmLower: -120, rightArmUpper: 20, rightArmLower: -120, leftLegUpper: 15, leftLegLower: -10, rightLegUpper: 15, rightLegLower: -10, bodyTilt: 40, hasBarbell: true },
  ],
  'pulldown': [
    { leftArmUpper: -170, leftArmLower: 0, rightArmUpper: -170, rightArmLower: 0, leftLegUpper: 80, leftLegLower: -80, rightLegUpper: 80, rightLegLower: -80, hasBarbell: true },
    { leftArmUpper: -100, leftArmLower: -60, rightArmUpper: -100, rightArmLower: -60, leftLegUpper: 80, leftLegLower: -80, rightLegUpper: 80, rightLegLower: -80, hasBarbell: true },
  ],
  'pullup': [
    { leftArmUpper: -170, leftArmLower: 0, rightArmUpper: -170, rightArmLower: 0, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0 },
    { leftArmUpper: -140, leftArmLower: -50, rightArmUpper: -140, rightArmLower: -50, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0, headY: -12 },
  ],
  'lunge': [
    { leftArmUpper: 0, leftArmLower: 0, rightArmUpper: 0, rightArmLower: 0, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0, hasBarbell: true },
    { leftArmUpper: 0, leftArmLower: 0, rightArmUpper: 0, rightArmLower: 0, leftLegUpper: 60, leftLegLower: -90, rightLegUpper: -30, rightLegLower: -80, crouch: 14, hasBarbell: true },
  ],
  'leg-press': [
    { leftArmUpper: 10, leftArmLower: 0, rightArmUpper: 10, rightArmLower: 0, leftLegUpper: 90, leftLegLower: -90, rightLegUpper: 90, rightLegLower: -90, bodyTilt: -60 },
    { leftArmUpper: 10, leftArmLower: 0, rightArmUpper: 10, rightArmLower: 0, leftLegUpper: 40, leftLegLower: -10, rightLegUpper: 40, rightLegLower: -10, bodyTilt: -60 },
  ],
  'leg-extension': [
    { leftArmUpper: 10, leftArmLower: 0, rightArmUpper: 10, rightArmLower: 0, leftLegUpper: 80, leftLegLower: -90, rightLegUpper: 80, rightLegLower: -90 },
    { leftArmUpper: 10, leftArmLower: 0, rightArmUpper: 10, rightArmLower: 0, leftLegUpper: 80, leftLegLower: -10, rightLegUpper: 80, rightLegLower: -10 },
  ],
  'leg-curl': [
    { leftArmUpper: 10, leftArmLower: 0, rightArmUpper: 10, rightArmLower: 0, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0, bodyTilt: -90 },
    { leftArmUpper: 10, leftArmLower: 0, rightArmUpper: 10, rightArmLower: 0, leftLegUpper: 0, leftLegLower: -120, rightLegUpper: 0, rightLegLower: -120, bodyTilt: -90 },
  ],
  'calf-raise': [
    { leftArmUpper: 0, leftArmLower: 0, rightArmUpper: 0, rightArmLower: 0, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0 },
    { leftArmUpper: 0, leftArmLower: 0, rightArmUpper: 0, rightArmLower: 0, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0, headY: -6 },
  ],
  'chest-fly': [
    { leftArmUpper: -90, leftArmLower: -10, rightArmUpper: -90, rightArmLower: -10, leftLegUpper: 45, leftLegLower: -90, rightLegUpper: 45, rightLegLower: -90, bodyTilt: -90, hasDumbbell: true },
    { leftArmUpper: -170, leftArmLower: -10, rightArmUpper: -170, rightArmLower: -10, leftLegUpper: 45, leftLegLower: -90, rightLegUpper: 45, rightLegLower: -90, bodyTilt: -90, hasDumbbell: true },
  ],
  'crunch': [
    { leftArmUpper: -60, leftArmLower: -60, rightArmUpper: -60, rightArmLower: -60, leftLegUpper: 60, leftLegLower: -80, rightLegUpper: 60, rightLegLower: -80, bodyTilt: -90 },
    { leftArmUpper: -60, leftArmLower: -60, rightArmUpper: -60, rightArmLower: -60, leftLegUpper: 60, leftLegLower: -80, rightLegUpper: 60, rightLegLower: -80, bodyTilt: -50 },
  ],
  'plank': [
    { leftArmUpper: -90, leftArmLower: -90, rightArmUpper: -90, rightArmLower: -90, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0, bodyTilt: -80 },
    { leftArmUpper: -90, leftArmLower: -90, rightArmUpper: -90, rightArmLower: -90, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0, bodyTilt: -80 },
  ],
  'dip': [
    { leftArmUpper: -10, leftArmLower: 0, rightArmUpper: -10, rightArmLower: 0, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0 },
    { leftArmUpper: -40, leftArmLower: -90, rightArmUpper: -40, rightArmLower: -90, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0, crouch: 10 },
  ],
  'hip-thrust': [
    { leftArmUpper: 30, leftArmLower: 0, rightArmUpper: 30, rightArmLower: 0, leftLegUpper: 60, leftLegLower: -90, rightLegUpper: 60, rightLegLower: -90, bodyTilt: -70, hasBarbell: true },
    { leftArmUpper: 30, leftArmLower: 0, rightArmUpper: 30, rightArmLower: 0, leftLegUpper: 60, leftLegLower: -90, rightLegUpper: 60, rightLegLower: -90, bodyTilt: -20, hasBarbell: true },
  ],
  'shrug': [
    { leftArmUpper: 0, leftArmLower: 0, rightArmUpper: 0, rightArmLower: 0, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0, hasBarbell: true },
    { leftArmUpper: 0, leftArmLower: 0, rightArmUpper: 0, rightArmLower: 0, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0, headY: -4, hasBarbell: true },
  ],
  'generic': [
    { leftArmUpper: 0, leftArmLower: 0, rightArmUpper: 0, rightArmLower: 0, leftLegUpper: 0, leftLegLower: 0, rightLegUpper: 0, rightLegLower: 0 },
    { leftArmUpper: -60, leftArmLower: -30, rightArmUpper: -60, rightArmLower: -30, leftLegUpper: 20, leftLegLower: -10, rightLegUpper: 20, rightLegLower: -10 },
  ],
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function interpolatePose(p1: Pose, p2: Pose, t: number): Pose {
  return {
    headX: lerp(p1.headX || 0, p2.headX || 0, t),
    headY: lerp(p1.headY || 0, p2.headY || 0, t),
    leftArmUpper: lerp(p1.leftArmUpper, p2.leftArmUpper, t),
    leftArmLower: lerp(p1.leftArmLower, p2.leftArmLower, t),
    rightArmUpper: lerp(p1.rightArmUpper, p2.rightArmUpper, t),
    rightArmLower: lerp(p1.rightArmLower, p2.rightArmLower, t),
    leftLegUpper: lerp(p1.leftLegUpper, p2.leftLegUpper, t),
    leftLegLower: lerp(p1.leftLegLower, p2.leftLegLower, t),
    rightLegUpper: lerp(p1.rightLegUpper, p2.rightLegUpper, t),
    rightLegLower: lerp(p1.rightLegLower, p2.rightLegLower, t),
    bodyTilt: lerp(p1.bodyTilt || 0, p2.bodyTilt || 0, t),
    crouch: lerp(p1.crouch || 0, p2.crouch || 0, t),
    hasBarbell: p1.hasBarbell,
    hasDumbbell: p1.hasDumbbell,
  };
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function deg2rad(d: number) { return (d * Math.PI) / 180; }

const LIMB_LEN = 12;

function getEndpoint(startX: number, startY: number, angleDeg: number, length: number) {
  const rad = deg2rad(angleDeg);
  return { x: startX + Math.sin(rad) * length, y: startY + Math.cos(rad) * length };
}

const StickFigure = ({ pose, primaryColor, secondaryColor }: { pose: Pose; primaryColor: string; secondaryColor: string }) => {
  const cx = 50;
  const bodyTiltRad = deg2rad(pose.bodyTilt || 0);
  const crouchY = pose.crouch || 0;

  // Body endpoints with tilt
  const neckX = cx + Math.sin(bodyTiltRad) * 0;
  const neckY = BODY_TOP;
  const hipX = cx + Math.sin(bodyTiltRad) * (BODY_BOTTOM - BODY_TOP);
  const hipY = BODY_TOP + Math.cos(bodyTiltRad) * (BODY_BOTTOM - BODY_TOP) + crouchY;

  // Head
  const headX = neckX + (pose.headX || 0);
  const headY = neckY - HEAD_R - 2 + (pose.headY || 0);

  // Shoulders
  const lShoulderX = neckX - SHOULDER_W;
  const rShoulderX = neckX + SHOULDER_W;

  // Arms
  const lElbow = getEndpoint(lShoulderX, neckY, pose.leftArmUpper, LIMB_LEN);
  const lHand = getEndpoint(lElbow.x, lElbow.y, pose.leftArmUpper + pose.leftArmLower, LIMB_LEN);
  const rElbow = getEndpoint(rShoulderX, neckY, pose.rightArmUpper, LIMB_LEN);
  const rHand = getEndpoint(rElbow.x, rElbow.y, pose.rightArmUpper + pose.rightArmLower, LIMB_LEN);

  // Hips
  const lHipX = hipX - HIP_W;
  const rHipX = hipX + HIP_W;

  // Legs
  const lKnee = getEndpoint(lHipX, hipY, pose.leftLegUpper, LIMB_LEN);
  const lFoot = getEndpoint(lKnee.x, lKnee.y, pose.leftLegUpper + pose.leftLegLower, LIMB_LEN);
  const rKnee = getEndpoint(rHipX, hipY, pose.rightLegUpper, LIMB_LEN);
  const rFoot = getEndpoint(rKnee.x, rKnee.y, pose.rightLegUpper + pose.rightLegLower, LIMB_LEN);

  const strokeWidth = 2.5;

  return (
    <g>
      {/* Body */}
      <line x1={neckX} y1={neckY} x2={hipX} y2={hipY} stroke={primaryColor} strokeWidth={strokeWidth} strokeLinecap="round" />

      {/* Head */}
      <circle cx={headX} cy={headY} r={HEAD_R} fill={secondaryColor} stroke={primaryColor} strokeWidth={1.5} />

      {/* Left Arm */}
      <line x1={lShoulderX} y1={neckY} x2={lElbow.x} y2={lElbow.y} stroke={primaryColor} strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1={lElbow.x} y1={lElbow.y} x2={lHand.x} y2={lHand.y} stroke={primaryColor} strokeWidth={strokeWidth} strokeLinecap="round" />

      {/* Right Arm */}
      <line x1={rShoulderX} y1={neckY} x2={rElbow.x} y2={rElbow.y} stroke={primaryColor} strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1={rElbow.x} y1={rElbow.y} x2={rHand.x} y2={rHand.y} stroke={primaryColor} strokeWidth={strokeWidth} strokeLinecap="round" />

      {/* Left Leg */}
      <line x1={lHipX} y1={hipY} x2={lKnee.x} y2={lKnee.y} stroke={primaryColor} strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1={lKnee.x} y1={lKnee.y} x2={lFoot.x} y2={lFoot.y} stroke={primaryColor} strokeWidth={strokeWidth} strokeLinecap="round" />

      {/* Right Leg */}
      <line x1={rHipX} y1={hipY} x2={rKnee.x} y2={rKnee.y} stroke={primaryColor} strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1={rKnee.x} y1={rKnee.y} x2={rFoot.x} y2={rFoot.y} stroke={primaryColor} strokeWidth={strokeWidth} strokeLinecap="round" />

      {/* Equipment */}
      {pose.hasBarbell && (
        <line x1={lHand.x - 6} y1={lHand.y} x2={rHand.x + 6} y2={rHand.y} stroke={secondaryColor} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
      )}
      {pose.hasDumbbell && (
        <>
          <rect x={lHand.x - 3} y={lHand.y - 2} width={6} height={4} rx={1} fill={secondaryColor} opacity={0.8} />
          <rect x={rHand.x - 3} y={rHand.y - 2} width={6} height={4} rx={1} fill={secondaryColor} opacity={0.8} />
        </>
      )}

      {/* Joints */}
      <circle cx={lElbow.x} cy={lElbow.y} r={1.5} fill={secondaryColor} />
      <circle cx={rElbow.x} cy={rElbow.y} r={1.5} fill={secondaryColor} />
      <circle cx={lKnee.x} cy={lKnee.y} r={1.5} fill={secondaryColor} />
      <circle cx={rKnee.x} cy={rKnee.y} r={1.5} fill={secondaryColor} />
    </g>
  );
};

export const ExerciseSVGAnimation = ({ exerciseName, className = '', compact = false }: ExerciseSVGAnimationProps) => {
  const animationType = getAnimationForExercise(exerciseName);
  const poses = exercisePoses[animationType] || exercisePoses['generic'];
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const frameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (paused) return;

    const duration = 1500; // ms per cycle
    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const elapsed = time - lastTimeRef.current;
      const cycle = (elapsed % (duration * 2)) / duration;
      // Ping-pong: 0→1→0
      const t = cycle <= 1 ? cycle : 2 - cycle;
      setProgress(easeInOut(t));
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [paused]);

  const currentPose = interpolatePose(poses[0], poses[1] || poses[0], progress);

  const primaryColor = 'hsl(var(--primary))';
  const secondaryColor = 'hsl(var(--primary) / 0.5)';

  return (
    <div className={`relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 ${compact ? 'w-16 h-16' : 'aspect-video'} ${className}`}>
      <svg
        viewBox="0 0 100 75"
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
      >
        <StickFigure pose={currentPose} primaryColor={primaryColor} secondaryColor={secondaryColor} />
      </svg>
      {!compact && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPaused(!paused);
          }}
          className="absolute bottom-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
        >
          {paused ? <Play className="w-3 h-3 fill-white" /> : <Pause className="w-3 h-3" />}
        </button>
      )}
    </div>
  );
};
