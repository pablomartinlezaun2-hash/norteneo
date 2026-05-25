import { useEffect, useRef, useState } from 'react';

/**
 * MediaPipe Pose -> normalized targets for robot bones.
 * Returns rotation targets in radians per bone (Euler-ish, applied with smoothing in the renderer).
 *
 * Mapping is mirrored: user's right hand -> robot's right side (no flip), because the
 * MediaPipe landmark "right" corresponds to the user's right which, in a mirrored selfie view,
 * appears on the LEFT of the screen. We map it to the robot's right bone to keep visual coherence.
 */

export type PoseStatus = 'off' | 'loading' | 'no-pose' | 'tracking' | 'error';

export type PoseTargets = {
  head: { pitch: number; yaw: number };
  leftArm: { x: number; z: number };       // shoulder rotation
  leftForeArm: { x: number };              // elbow flex
  rightArm: { x: number; z: number };
  rightForeArm: { x: number };
  hasPose: boolean;
};

const NEUTRAL: PoseTargets = {
  head: { pitch: 0, yaw: 0 },
  leftArm: { x: 0, z: 0 },
  leftForeArm: { x: 0 },
  rightArm: { x: 0, z: 0 },
  rightForeArm: { x: 0 },
  hasPose: false,
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const deg = (d: number) => (d * Math.PI) / 180;

// Angle of vector (dx, dy) from "down" axis (0 = arm hanging straight down, +PI/2 = arm horizontal outward)
function angleFromDown(dx: number, dy: number) {
  // dy positive = downward in image space. atan2(dx, dy) gives angle from down axis.
  return Math.atan2(dx, dy);
}

function angleBetween(ax: number, ay: number, bx: number, by: number) {
  const dot = ax * bx + ay * by;
  const la = Math.hypot(ax, ay);
  const lb = Math.hypot(bx, by);
  if (la === 0 || lb === 0) return 0;
  return Math.acos(clamp(dot / (la * lb), -1, 1));
}

export function usePoseBodyControl(enabled: boolean) {
  const [status, setStatus] = useState<PoseStatus>('off');
  const targetsRef = useRef<PoseTargets>({ ...NEUTRAL });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const landmarkerRef = useRef<any>(null);
  const lastSeenRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      setStatus('off');
      targetsRef.current = { ...NEUTRAL };
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      landmarkerRef.current?.close?.();
      landmarkerRef.current = null;
      return;
    }

    let cancelled = false;
    setStatus('loading');

    (async () => {
      try {
        const vision = await import('@mediapipe/tasks-vision');
        const { FilesetResolver, PoseLandmarker } = vision;
        const fileset = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
        );
        if (cancelled) return;
        const landmarker = await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });
        if (cancelled) return;
        landmarkerRef.current = landmarker;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        await video.play();
        videoRef.current = video;

        setStatus('no-pose');

        const tick = () => {
          if (cancelled) return;
          const v = videoRef.current;
          const lm = landmarkerRef.current;
          if (v && lm && v.readyState >= 2) {
            const ts = performance.now();
            const res = lm.detectForVideo(v, ts);
            const lms = res?.landmarks?.[0];
            if (lms && lms.length >= 17) {
              lastSeenRef.current = ts;

              // MediaPipe Pose indices
              const nose = lms[0];
              const lShoulder = lms[11]; // user's left
              const rShoulder = lms[12]; // user's right
              const lElbow = lms[13];
              const rElbow = lms[14];
              const lWrist = lms[15];
              const rWrist = lms[16];

              // Head yaw/pitch from nose offset relative to shoulder midpoint
              const midSx = (lShoulder.x + rShoulder.x) / 2;
              const midSy = (lShoulder.y + rShoulder.y) / 2;
              const shoulderW = Math.max(0.05, Math.abs(lShoulder.x - rShoulder.x));
              const headYaw = clamp((nose.x - midSx) / shoulderW, -1, 1) * deg(30);
              const headPitch = clamp((nose.y - midSy + 0.25) / 0.3, -1, 1) * deg(20);

              // USER's LEFT arm (lms 11/13/15) -> ROBOT's RIGHT side (mirror)
              // Vector shoulder->elbow in image space (y down)
              const uLdx = lElbow.x - lShoulder.x;
              const uLdy = lElbow.y - lShoulder.y;
              const uLangle = angleFromDown(uLdx, uLdy); // 0 = down, +pi/2 = outward to image-right
              // Elbow flex: angle between upperArm vector and foreArm vector
              const uLfx = lWrist.x - lElbow.x;
              const uLfy = lWrist.y - lElbow.y;
              const uLflex = angleBetween(uLdx, uLdy, uLfx, uLfy);

              // USER's RIGHT arm -> ROBOT's LEFT
              const uRdx = rElbow.x - rShoulder.x;
              const uRdy = rElbow.y - rShoulder.y;
              const uRangle = angleFromDown(uRdx, uRdy);
              const uRfx = rWrist.x - rElbow.x;
              const uRfy = rWrist.y - rElbow.y;
              const uRflex = angleBetween(uRdx, uRdy, uRfx, uRfy);

              // Map to robot bones.
              // Shoulder rotation Z: outward abduction. Positive Z on robot's LEFT arm raises it outward
              // (negative for right arm because mirrored).
              // Shoulder rotation X: arm coming forward (toward camera). We approximate with vertical lift only.
              //
              // For shoulder Z we use the angle from "down" — positive when arm is raised outward.
              // For shoulder X we use -outward-lift to mimic raise toward camera if arm is high.
              const userLeftLift = clamp(uLangle, -deg(20), deg(170)); // arm raise toward image-right
              const userRightLift = clamp(-uRangle, -deg(20), deg(170)); // mirrored

              // Robot's RIGHT bone gets user's LEFT
              const robotRightArmZ = -clamp(userLeftLift, 0, deg(150)); // negative Z raises right arm outward
              const robotRightArmX = -clamp(userLeftLift * 0.25, 0, deg(45));
              const robotRightForeX = -clamp(Math.PI - uLflex, 0, deg(130));

              // Robot's LEFT bone gets user's RIGHT
              const robotLeftArmZ = clamp(userRightLift, 0, deg(150));
              const robotLeftArmX = -clamp(userRightLift * 0.25, 0, deg(45));
              const robotLeftForeX = -clamp(Math.PI - uRflex, 0, deg(130));

              targetsRef.current = {
                head: { pitch: headPitch, yaw: headYaw },
                leftArm: { x: robotLeftArmX, z: robotLeftArmZ },
                leftForeArm: { x: robotLeftForeX },
                rightArm: { x: robotRightArmX, z: robotRightArmZ },
                rightForeArm: { x: robotRightForeX },
                hasPose: true,
              };
              setStatus((s) => (s === 'tracking' ? s : 'tracking'));
            } else if (ts - lastSeenRef.current > 600) {
              targetsRef.current = { ...NEUTRAL };
              setStatus((s) => (s === 'no-pose' ? s : 'no-pose'));
            }
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (err) {
        console.error('[NeoGLB] Pose init error', err);
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      landmarkerRef.current?.close?.();
      landmarkerRef.current = null;
      videoRef.current = null;
    };
  }, [enabled]);

  return { status, targetsRef };
}
