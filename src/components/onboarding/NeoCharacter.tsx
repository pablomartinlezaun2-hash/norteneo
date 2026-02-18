import { motion } from 'framer-motion';

type Pose = 'wave' | 'flex' | 'point' | 'think' | 'celebrate' | 'run' | 'eat';

interface NeoCharacterProps {
  pose?: Pose;
  size?: number;
  className?: string;
}

export const NeoCharacter = ({ pose = 'wave', size = 120, className = '' }: NeoCharacterProps) => {
  const cx = 60;

  // Arm angles per pose
  const poses = {
    wave:      { lArmRot: -10, rArmRot: -60, lForeRot: 0, rForeRot: -50, bounce: true },
    flex:      { lArmRot: -70, rArmRot: -70, lForeRot: 60, rForeRot: 60, bounce: false },
    point:     { lArmRot: -5,  rArmRot: -80, lForeRot: 0, rForeRot: -90, bounce: false },
    think:     { lArmRot: -5,  rArmRot: -50, lForeRot: 0, rForeRot: 40,  bounce: false },
    celebrate: { lArmRot: -80, rArmRot: -80, lForeRot: -30, rForeRot: 30, bounce: true },
    run:       { lArmRot: -30, rArmRot: 20,  lForeRot: 40, rForeRot: -20, bounce: true },
    eat:       { lArmRot: -5,  rArmRot: -40, lForeRot: 0, rForeRot: 70,  bounce: false },
  };

  const p = poses[pose];
  const skin = 'hsl(30, 60%, 72%)';
  const skinShadow = 'hsl(25, 65%, 58%)';
  const shorts = 'hsl(220, 40%, 38%)';
  const shortsShadow = 'hsl(220, 40%, 30%)';
  const muscle = 'hsl(20, 65%, 58%)';

  const headY = 22;
  const headR = 13;
  const neckTop = headY + headR;
  const torsoTop = neckTop + 6;
  const torsoBot = torsoTop + 34;
  const legTop = torsoBot + 12;
  const chestW = 40;
  const waistW = 32;
  const armW = 9;
  const forearmW = 7;

  const bounceAnim = p.bounce
    ? { y: [0, -4, 0], transition: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' as const } }
    : { y: [0, -1.5, 0], transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const } };

  const waveAnim = pose === 'wave'
    ? { rotate: [0, 20, -10, 20, 0], transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' as const } }
    : {};

  const celebrateAnim = pose === 'celebrate'
    ? { rotate: [-10, 10, -10], transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' as const } }
    : {};

  return (
    <motion.div className={className} animate={bounceAnim}>
      <svg viewBox="0 0 120 200" width={size} height={size * (200 / 120)}>
        <defs>
          <radialGradient id={`neoSkin-${pose}`} cx="50%" cy="35%">
            <stop offset="0%" stopColor="hsl(30, 55%, 80%)" />
            <stop offset="70%" stopColor={skin} />
            <stop offset="100%" stopColor={skinShadow} />
          </radialGradient>
          <linearGradient id={`neoShorts-${pose}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={shorts} />
            <stop offset="100%" stopColor={shortsShadow} />
          </linearGradient>
        </defs>

        {/* Legs */}
        <rect x={cx - 16} y={legTop} width={12} height={30} rx={5} fill={`url(#neoSkin-${pose})`} stroke={skinShadow} strokeWidth="0.4" />
        <rect x={cx + 4}  y={legTop} width={12} height={30} rx={5} fill={`url(#neoSkin-${pose})`} stroke={skinShadow} strokeWidth="0.4" />
        {/* Calves */}
        <rect x={cx - 15} y={legTop + 28} width={10} height={18} rx={4} fill={`url(#neoSkin-${pose})`} stroke={skinShadow} strokeWidth="0.3" />
        <rect x={cx + 5}  y={legTop + 28} width={10} height={18} rx={4} fill={`url(#neoSkin-${pose})`} stroke={skinShadow} strokeWidth="0.3" />
        {/* Feet */}
        <ellipse cx={cx - 10} cy={legTop + 47} rx={7} ry={3} fill="#2c3e50" />
        <ellipse cx={cx + 10} cy={legTop + 47} rx={7} ry={3} fill="#2c3e50" />

        {/* Shorts */}
        <path
          d={`M ${cx - waistW / 2} ${torsoBot - 2}
              Q ${cx - waistW / 2 - 1} ${torsoBot + 6} ${cx - 14} ${torsoBot + 14}
              L ${cx - 1} ${torsoBot + 12}
              L ${cx + 1} ${torsoBot + 12}
              L ${cx + 14} ${torsoBot + 14}
              Q ${cx + waistW / 2 + 1} ${torsoBot + 6} ${cx + waistW / 2} ${torsoBot - 2} Z`}
          fill={`url(#neoShorts-${pose})`}
        />

        {/* Torso */}
        <path
          d={`M ${cx - chestW / 2} ${torsoTop + 4}
              L ${cx - waistW / 2} ${torsoBot}
              Q ${cx} ${torsoBot + 2} ${cx + waistW / 2} ${torsoBot}
              L ${cx + chestW / 2} ${torsoTop + 4}
              Q ${cx} ${torsoTop - 2} ${cx - chestW / 2} ${torsoTop + 4} Z`}
          fill={`url(#neoSkin-${pose})`}
          stroke={skinShadow}
          strokeWidth="0.4"
        />
        {/* Pecs */}
        <ellipse cx={cx - 9} cy={torsoTop + 9} rx={7} ry={5} fill={muscle} opacity={0.35} />
        <ellipse cx={cx + 9} cy={torsoTop + 9} rx={7} ry={5} fill={muscle} opacity={0.35} />
        {/* Abs */}
        {[0, 1, 2].map(i => (
          <g key={i}>
            <rect x={cx - 7} y={torsoTop + 17 + i * 6} width={5} height={4} rx={1.5} fill={skinShadow} opacity={0.3} />
            <rect x={cx + 2} y={torsoTop + 17 + i * 6} width={5} height={4} rx={1.5} fill={skinShadow} opacity={0.3} />
          </g>
        ))}

        {/* Left arm */}
        <motion.g
          style={{ transformOrigin: `${cx - chestW / 2}px ${torsoTop + 4}px` }}
          animate={celebrateAnim}
          initial={{ rotate: p.lArmRot }}
        >
          <rect
            x={cx - chestW / 2 - armW / 2}
            y={torsoTop}
            width={armW}
            height={22}
            rx={armW / 2}
            fill={`url(#neoSkin-${pose})`}
            stroke={skinShadow}
            strokeWidth="0.3"
            style={{ transformBox: 'fill-box', transformOrigin: 'top center', rotate: `${p.lArmRot}deg` }}
          />
          <rect
            x={cx - chestW / 2 - forearmW / 2}
            y={torsoTop + 20}
            width={forearmW}
            height={16}
            rx={forearmW / 2}
            fill={`url(#neoSkin-${pose})`}
            stroke={skinShadow}
            strokeWidth="0.25"
            style={{ transformBox: 'fill-box', transformOrigin: 'top center', rotate: `${p.lForeRot + p.lArmRot}deg` }}
          />
        </motion.g>

        {/* Right arm */}
        <motion.g animate={waveAnim}>
          <rect
            x={cx + chestW / 2 - armW / 2}
            y={torsoTop}
            width={armW}
            height={22}
            rx={armW / 2}
            fill={`url(#neoSkin-${pose})`}
            stroke={skinShadow}
            strokeWidth="0.3"
            style={{ transformBox: 'fill-box', transformOrigin: 'top center', rotate: `${p.rArmRot}deg` }}
          />
          <rect
            x={cx + chestW / 2 - forearmW / 2}
            y={torsoTop + 20}
            width={forearmW}
            height={16}
            rx={forearmW / 2}
            fill={`url(#neoSkin-${pose})`}
            stroke={skinShadow}
            strokeWidth="0.25"
            style={{ transformBox: 'fill-box', transformOrigin: 'top center', rotate: `${p.rForeRot + p.rArmRot}deg` }}
          />
        </motion.g>

        {/* Neck */}
        <rect x={cx - 5} y={neckTop} width={10} height={7} rx={3} fill={`url(#neoSkin-${pose})`} />

        {/* Head */}
        <circle cx={cx} cy={headY} r={headR} fill={`url(#neoSkin-${pose})`} stroke={skinShadow} strokeWidth="0.5" />
        {/* Eyes */}
        <ellipse cx={cx - 4.5} cy={headY - 1} rx={2.2} ry={2.5} fill="#1a1a2e" />
        <ellipse cx={cx + 4.5} cy={headY - 1} rx={2.2} ry={2.5} fill="#1a1a2e" />
        <circle cx={cx - 3.8} cy={headY - 1.8} r={0.7} fill="white" opacity={0.8} />
        <circle cx={cx + 5.2} cy={headY - 1.8} r={0.7} fill="white" opacity={0.8} />

        {/* Eyebrows */}
        <path d={`M ${cx - 6.5} ${headY - 4.5} Q ${cx - 4.5} ${headY - 5.5} ${cx - 2.5} ${headY - 4.5}`}
          stroke="#4a3728" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d={`M ${cx + 2.5} ${headY - 4.5} Q ${cx + 4.5} ${headY - 5.5} ${cx + 6.5} ${headY - 4.5}`}
          stroke="#4a3728" strokeWidth="1" fill="none" strokeLinecap="round" />

        {/* Smile */}
        <path d={`M ${cx - 4} ${headY + 4} Q ${cx} ${headY + 7.5} ${cx + 4} ${headY + 4}`}
          stroke="#4a3728" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        {/* Hair */}
        <path d={`M ${cx - 12} ${headY - 4} Q ${cx - 10} ${headY - 16} ${cx} ${headY - 14} Q ${cx + 10} ${headY - 16} ${cx + 12} ${headY - 4}`}
          fill="#1a1a2e" />

        {/* NEO tag */}
        <rect x={cx - 11} y={headY - 14} width={22} height={10} rx={3} fill="#1a1a2e" />
        <text x={cx} y={headY - 7} textAnchor="middle" fill="white" fontSize="5.5" fontWeight="bold" letterSpacing="0.5">NEO</text>
      </svg>
    </motion.div>
  );
};
