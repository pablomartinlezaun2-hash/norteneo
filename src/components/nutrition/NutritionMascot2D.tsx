import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface NutritionMascot2DProps {
  progress: number;
  className?: string;
}

export const NutritionMascot2D = ({ progress, className = '' }: NutritionMascot2DProps) => {
  const p = Math.max(0, Math.min(progress, 100)) / 100;

  // 6 key states: 0, 0.2, 0.4, 0.6, 0.8, 1.0
  const stage = p < 0.2 ? 0 : p < 0.4 ? 1 : p < 0.6 ? 2 : p < 0.8 ? 3 : p < 1 ? 4 : 5;

  const label = stage === 5 ? '¡Máquina!' : stage === 4 ? '¡Vas fuerte!' : stage === 3 ? 'Definiendo' : stage === 2 ? 'Creciendo' : stage === 1 ? 'Empezando' : 'Aliméntame';

  // Energy palette: cool/muted → warm/vibrant
  const palette = useMemo(() => {
    const saturation = 15 + p * 35;
    const lightness = 72 - p * 8;
    const skinH = 25 + p * 8;
    const muscleH = 15 + p * 10;
    return {
      skin: `hsl(${skinH}, ${saturation + 10}%, ${lightness}%)`,
      skinShadow: `hsl(${skinH - 5}, ${saturation + 15}%, ${lightness - 12}%)`,
      skinHighlight: `hsl(${skinH + 5}, ${saturation + 5}%, ${lightness + 8}%)`,
      muscle: `hsl(${muscleH}, ${saturation + 20}%, ${lightness - 8}%)`,
      muscleShadow: `hsl(${muscleH - 5}, ${saturation + 25}%, ${lightness - 20}%)`,
      muscleHighlight: `hsl(${muscleH + 8}, ${saturation + 10}%, ${lightness + 2}%)`,
      vein: `hsla(${muscleH - 10}, ${saturation + 30}%, ${lightness - 25}%, ${p > 0.8 ? 0.3 : 0})`,
      shorts: `hsl(220, ${30 + p * 15}%, ${35 + p * 8}%)`,
      shortsShadow: `hsl(220, ${30 + p * 15}%, ${28 + p * 5}%)`,
    };
  }, [p]);

  // Progressive scaling — up to +20% at 100%
  const scale = 1 + p * 0.20;

  // Body dimensions with progressive growth
  const body = useMemo(() => {
    const chestW = 30 + p * 16;
    const chestH = 36 + p * 6;
    const shoulderW = chestW / 2 + 4 + p * 10;
    const neckW = 7 + p * 3;
    const neckH = 7 - p * 1;
    const armW = 8 + p * 7;
    const armH = 28 + p * 5;
    const forearmW = 6 + p * 4;
    const legW = 11 + p * 6;
    const legH = 32 + p * 4;
    const calfW = 8 + p * 4;
    const calfH = 18 + p * 2;
    const gluteW = 6 + p * 5;
    const headR = 13.5;
    const waistW = chestW - 4 - p * 2;
    return { chestW, chestH, shoulderW, neckW, neckH, armW, armH, forearmW, legW, legH, calfW, calfH, gluteW, headR, waistW };
  }, [p]);

  const cx = 70; // center x
  const headY = 26;
  const neckTop = headY + body.headR - 1;
  const torsoTop = neckTop + body.neckH;
  const torsoBot = torsoTop + body.chestH;
  const shortsH = 14 + p * 2;
  const legTop = torsoBot + shortsH - 4;

  const smileR = 3 + p * 2;

  // Muscle opacity ramps
  const deltoidOp = p > 0.2 ? Math.min(1, (p - 0.2) / 0.3) * 0.7 : 0;
  const pecOp = p > 0.4 ? Math.min(1, (p - 0.4) / 0.25) * 0.6 : 0;
  const bicepOp = p > 0.3 ? Math.min(1, (p - 0.3) / 0.3) * 0.65 : 0;
  const tricepOp = p > 0.35 ? Math.min(1, (p - 0.35) / 0.3) * 0.5 : 0;
  const absOp = p > 0.5 ? Math.min(1, (p - 0.5) / 0.3) * 0.55 : 0;
  const obliqueOp = p > 0.55 ? Math.min(1, (p - 0.55) / 0.3) * 0.45 : 0;
  const quadOp = p > 0.4 ? Math.min(1, (p - 0.4) / 0.3) * 0.5 : 0;
  const hamOp = p > 0.45 ? Math.min(1, (p - 0.45) / 0.3) * 0.4 : 0;
  const calfOp = p > 0.5 ? Math.min(1, (p - 0.5) / 0.3) * 0.5 : 0;
  const gluteOp = p > 0.4 ? Math.min(1, (p - 0.4) / 0.3) * 0.45 : 0;

  const flexAnim = stage === 5 ? { scale: [1, 1.03, 1], transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' as const } } : {};

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl overflow-hidden bg-gradient-to-br from-muted/80 to-muted/30 border border-border/50 ${className}`}
    >
      <div className="flex items-center justify-center h-44 w-full">
        <motion.svg
          viewBox="0 0 140 170"
          className="h-full w-auto"
          animate={{ y: [0, -1.5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <defs>
            {/* Skin gradient */}
            <radialGradient id="skinGrad" cx="50%" cy="40%">
              <stop offset="0%" stopColor={palette.skinHighlight} />
              <stop offset="70%" stopColor={palette.skin} />
              <stop offset="100%" stopColor={palette.skinShadow} />
            </radialGradient>
            {/* Muscle gradient */}
            <radialGradient id="muscleGrad" cx="50%" cy="40%">
              <stop offset="0%" stopColor={palette.muscleHighlight} />
              <stop offset="60%" stopColor={palette.muscle} />
              <stop offset="100%" stopColor={palette.muscleShadow} />
            </radialGradient>
            <linearGradient id="shortsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.shorts} />
              <stop offset="100%" stopColor={palette.shortsShadow} />
            </linearGradient>
          </defs>

          <g transform={`translate(${cx - cx * scale}, ${170 - 170 * scale}) scale(${scale})`}>
            {/* === LEGS (behind torso) === */}
            {/* Left thigh */}
            <motion.rect
              x={cx - body.legW - 3}
              y={legTop}
              width={body.legW}
              height={body.legH}
              rx={body.legW / 2.5}
              fill="url(#skinGrad)"
              stroke={palette.skinShadow}
              strokeWidth="0.4"
              animate={flexAnim}
            />
            {/* Left quad definition */}
            {quadOp > 0 && (
              <ellipse
                cx={cx - body.legW / 2 - 3}
                cy={legTop + body.legH * 0.35}
                rx={body.legW / 2.8}
                ry={3 + p * 5}
                fill={palette.muscleShadow}
                opacity={quadOp}
              />
            )}
            {/* Left hamstring (inner shadow) */}
            {hamOp > 0 && (
              <ellipse
                cx={cx - body.legW / 2 - 1}
                cy={legTop + body.legH * 0.5}
                rx={body.legW / 4}
                ry={2 + p * 3}
                fill={palette.muscleShadow}
                opacity={hamOp * 0.5}
              />
            )}

            {/* Right thigh */}
            <motion.rect
              x={cx + 3}
              y={legTop}
              width={body.legW}
              height={body.legH}
              rx={body.legW / 2.5}
              fill="url(#skinGrad)"
              stroke={palette.skinShadow}
              strokeWidth="0.4"
              animate={flexAnim}
            />
            {quadOp > 0 && (
              <ellipse
                cx={cx + body.legW / 2 + 3}
                cy={legTop + body.legH * 0.35}
                rx={body.legW / 2.8}
                ry={3 + p * 5}
                fill={palette.muscleShadow}
                opacity={quadOp}
              />
            )}
            {hamOp > 0 && (
              <ellipse
                cx={cx + body.legW / 2 + 1}
                cy={legTop + body.legH * 0.5}
                rx={body.legW / 4}
                ry={2 + p * 3}
                fill={palette.muscleShadow}
                opacity={hamOp * 0.5}
              />
            )}

            {/* Left calf */}
            <rect
              x={cx - body.calfW / 2 - body.legW / 2 - 3 + (body.legW - body.calfW) / 2}
              y={legTop + body.legH - 2}
              width={body.calfW}
              height={body.calfH}
              rx={body.calfW / 2.5}
              fill="url(#skinGrad)"
              stroke={palette.skinShadow}
              strokeWidth="0.3"
            />
            {calfOp > 0 && (
              <ellipse
                cx={cx - body.legW / 2 - 3 + (body.legW - body.calfW) / 2 + body.calfW / 2}
                cy={legTop + body.legH + body.calfH * 0.3}
                rx={body.calfW / 3}
                ry={2 + p * 3}
                fill={palette.muscleShadow}
                opacity={calfOp}
              />
            )}

            {/* Right calf */}
            <rect
              x={cx + 3 + (body.legW - body.calfW) / 2}
              y={legTop + body.legH - 2}
              width={body.calfW}
              height={body.calfH}
              rx={body.calfW / 2.5}
              fill="url(#skinGrad)"
              stroke={palette.skinShadow}
              strokeWidth="0.3"
            />
            {calfOp > 0 && (
              <ellipse
                cx={cx + 3 + (body.legW - body.calfW) / 2 + body.calfW / 2}
                cy={legTop + body.legH + body.calfH * 0.3}
                rx={body.calfW / 3}
                ry={2 + p * 3}
                fill={palette.muscleShadow}
                opacity={calfOp}
              />
            )}

            {/* Feet */}
            <ellipse cx={cx - body.legW / 2 - 3} cy={legTop + body.legH + body.calfH - 1} rx={body.calfW / 1.6} ry={3} fill="#2c3e50" />
            <ellipse cx={cx + body.legW / 2 + 3} cy={legTop + body.legH + body.calfH - 1} rx={body.calfW / 1.6} ry={3} fill="#2c3e50" />

            {/* === GLUTES (behind shorts) === */}
            {gluteOp > 0 && (
              <>
                <ellipse cx={cx - body.waistW / 4} cy={torsoBot + 2} rx={body.gluteW / 1.8} ry={body.gluteW / 2.2} fill={palette.muscleShadow} opacity={gluteOp * 0.4} />
                <ellipse cx={cx + body.waistW / 4} cy={torsoBot + 2} rx={body.gluteW / 1.8} ry={body.gluteW / 2.2} fill={palette.muscleShadow} opacity={gluteOp * 0.4} />
              </>
            )}

            {/* === SHORTS === */}
            <path
              d={`M ${cx - body.waistW / 2} ${torsoBot - 3}
                  Q ${cx - body.waistW / 2 - 1} ${torsoBot + shortsH / 2} ${cx - body.legW / 2 - 4} ${torsoBot + shortsH}
                  L ${cx - 1} ${torsoBot + shortsH - 2}
                  L ${cx + 1} ${torsoBot + shortsH - 2}
                  L ${cx + body.legW / 2 + 4} ${torsoBot + shortsH}
                  Q ${cx + body.waistW / 2 + 1} ${torsoBot + shortsH / 2} ${cx + body.waistW / 2} ${torsoBot - 3}
                  Z`}
              fill="url(#shortsGrad)"
              stroke={palette.shortsShadow}
              strokeWidth="0.3"
            />

            {/* === TORSO === */}
            {/* Main torso shape — tapered */}
            <path
              d={`M ${cx - body.shoulderW} ${torsoTop + 2}
                  Q ${cx - body.shoulderW - 1} ${torsoTop} ${cx - body.chestW / 2} ${torsoTop + body.chestH * 0.15}
                  L ${cx - body.waistW / 2} ${torsoBot}
                  Q ${cx} ${torsoBot + 2} ${cx + body.waistW / 2} ${torsoBot}
                  L ${cx + body.chestW / 2} ${torsoTop + body.chestH * 0.15}
                  Q ${cx + body.shoulderW + 1} ${torsoTop} ${cx + body.shoulderW} ${torsoTop + 2}
                  Q ${cx} ${torsoTop - 1} ${cx - body.shoulderW} ${torsoTop + 2}
                  Z`}
              fill="url(#skinGrad)"
              stroke={palette.skinShadow}
              strokeWidth="0.4"
            />

            {/* Center line */}
            <line x1={cx} y1={torsoTop + 4} x2={cx} y2={torsoBot - 4} stroke={palette.skinShadow} strokeWidth="0.4" opacity={0.3 + p * 0.4} />

            {/* Pectorals */}
            {pecOp > 0 && (
              <>
                <ellipse cx={cx - body.chestW / 4.5} cy={torsoTop + body.chestH * 0.25} rx={3 + p * 5} ry={2.5 + p * 3.5} fill={palette.muscleShadow} opacity={pecOp} />
                <ellipse cx={cx + body.chestW / 4.5} cy={torsoTop + body.chestH * 0.25} rx={3 + p * 5} ry={2.5 + p * 3.5} fill={palette.muscleShadow} opacity={pecOp} />
                {/* Pec highlights */}
                <ellipse cx={cx - body.chestW / 5} cy={torsoTop + body.chestH * 0.2} rx={2 + p * 2.5} ry={1.5 + p * 1.5} fill={palette.skinHighlight} opacity={pecOp * 0.4} />
                <ellipse cx={cx + body.chestW / 5} cy={torsoTop + body.chestH * 0.2} rx={2 + p * 2.5} ry={1.5 + p * 1.5} fill={palette.skinHighlight} opacity={pecOp * 0.4} />
              </>
            )}

            {/* Abs — 3 rows of 2 */}
            {absOp > 0 && [0, 1, 2].map(i => (
              <g key={`abs-${i}`}>
                <rect x={cx - 4.5} y={torsoTop + body.chestH * 0.48 + i * (5 + p * 1.5)} width={3.8} height={3.5 + p * 0.8} rx={1.2} fill={palette.muscleShadow} opacity={absOp * (1 - i * 0.1)} />
                <rect x={cx + 0.7} y={torsoTop + body.chestH * 0.48 + i * (5 + p * 1.5)} width={3.8} height={3.5 + p * 0.8} rx={1.2} fill={palette.muscleShadow} opacity={absOp * (1 - i * 0.1)} />
              </g>
            ))}

            {/* Obliques */}
            {obliqueOp > 0 && (
              <>
                <path
                  d={`M ${cx - body.waistW / 2 + 1} ${torsoTop + body.chestH * 0.5} Q ${cx - body.waistW / 2 - 1} ${torsoTop + body.chestH * 0.7} ${cx - body.waistW / 2 + 2} ${torsoBot - 2}`}
                  fill="none" stroke={palette.muscleShadow} strokeWidth={0.8 + p} opacity={obliqueOp} strokeLinecap="round"
                />
                <path
                  d={`M ${cx + body.waistW / 2 - 1} ${torsoTop + body.chestH * 0.5} Q ${cx + body.waistW / 2 + 1} ${torsoTop + body.chestH * 0.7} ${cx + body.waistW / 2 - 2} ${torsoBot - 2}`}
                  fill="none" stroke={palette.muscleShadow} strokeWidth={0.8 + p} opacity={obliqueOp} strokeLinecap="round"
                />
              </>
            )}

            {/* === DELTOIDS (shoulders) === */}
            {deltoidOp > 0 && (
              <>
                {/* Left deltoid — 3 heads */}
                <ellipse cx={cx - body.shoulderW + 1} cy={torsoTop + 3} rx={4 + p * 4} ry={3.5 + p * 3} fill="url(#muscleGrad)" opacity={deltoidOp} />
                {/* Ant/post separation */}
                <path d={`M ${cx - body.shoulderW + 1} ${torsoTop} L ${cx - body.shoulderW + 1} ${torsoTop + 7 + p * 3}`} stroke={palette.muscleShadow} strokeWidth="0.3" opacity={deltoidOp * 0.5} />
                {/* Right deltoid */}
                <ellipse cx={cx + body.shoulderW - 1} cy={torsoTop + 3} rx={4 + p * 4} ry={3.5 + p * 3} fill="url(#muscleGrad)" opacity={deltoidOp} />
                <path d={`M ${cx + body.shoulderW - 1} ${torsoTop} L ${cx + body.shoulderW - 1} ${torsoTop + 7 + p * 3}`} stroke={palette.muscleShadow} strokeWidth="0.3" opacity={deltoidOp * 0.5} />
              </>
            )}

            {/* === ARMS === */}
            {/* Left upper arm */}
            <rect
              x={cx - body.shoulderW - body.armW / 2}
              y={torsoTop + 4}
              width={body.armW}
              height={body.armH}
              rx={body.armW / 2.2}
              fill="url(#skinGrad)"
              stroke={palette.skinShadow}
              strokeWidth="0.3"
            />
            {/* Left bicep */}
            {bicepOp > 0 && (
              <ellipse
                cx={cx - body.shoulderW - body.armW / 2 + body.armW * 0.45}
                cy={torsoTop + 4 + body.armH * 0.35}
                rx={body.armW / 2.5}
                ry={2.5 + p * 4}
                fill="url(#muscleGrad)"
                opacity={bicepOp}
              />
            )}
            {/* Left tricep (back of arm) */}
            {tricepOp > 0 && (
              <ellipse
                cx={cx - body.shoulderW - body.armW / 2 + body.armW * 0.25}
                cy={torsoTop + 4 + body.armH * 0.45}
                rx={body.armW / 3.5}
                ry={2 + p * 3}
                fill={palette.muscleShadow}
                opacity={tricepOp}
              />
            )}
            {/* Left forearm */}
            <rect
              x={cx - body.shoulderW - body.forearmW / 2}
              y={torsoTop + 4 + body.armH - 2}
              width={body.forearmW}
              height={body.armH * 0.7}
              rx={body.forearmW / 2.2}
              fill="url(#skinGrad)"
              stroke={palette.skinShadow}
              strokeWidth="0.25"
            />

            {/* Right upper arm */}
            <rect
              x={cx + body.shoulderW - body.armW / 2}
              y={torsoTop + 4}
              width={body.armW}
              height={body.armH}
              rx={body.armW / 2.2}
              fill="url(#skinGrad)"
              stroke={palette.skinShadow}
              strokeWidth="0.3"
            />
            {bicepOp > 0 && (
              <ellipse
                cx={cx + body.shoulderW - body.armW / 2 + body.armW * 0.55}
                cy={torsoTop + 4 + body.armH * 0.35}
                rx={body.armW / 2.5}
                ry={2.5 + p * 4}
                fill="url(#muscleGrad)"
                opacity={bicepOp}
              />
            )}
            {tricepOp > 0 && (
              <ellipse
                cx={cx + body.shoulderW - body.armW / 2 + body.armW * 0.75}
                cy={torsoTop + 4 + body.armH * 0.45}
                rx={body.armW / 3.5}
                ry={2 + p * 3}
                fill={palette.muscleShadow}
                opacity={tricepOp}
              />
            )}
            <rect
              x={cx + body.shoulderW - body.forearmW / 2}
              y={torsoTop + 4 + body.armH - 2}
              width={body.forearmW}
              height={body.armH * 0.7}
              rx={body.forearmW / 2.2}
              fill="url(#skinGrad)"
              stroke={palette.skinShadow}
              strokeWidth="0.25"
            />

            {/* Vein lines on arms at >80% */}
            {p > 0.8 && (
              <>
                <path d={`M ${cx - body.shoulderW} ${torsoTop + 10} Q ${cx - body.shoulderW - 2} ${torsoTop + 18} ${cx - body.shoulderW + 1} ${torsoTop + 25}`}
                  stroke={palette.vein} strokeWidth="0.5" fill="none" strokeLinecap="round" />
                <path d={`M ${cx + body.shoulderW} ${torsoTop + 10} Q ${cx + body.shoulderW + 2} ${torsoTop + 18} ${cx + body.shoulderW - 1} ${torsoTop + 25}`}
                  stroke={palette.vein} strokeWidth="0.5" fill="none" strokeLinecap="round" />
              </>
            )}

            {/* === NECK === */}
            <rect x={cx - body.neckW / 2} y={neckTop} width={body.neckW} height={body.neckH} rx={body.neckW / 3} fill="url(#skinGrad)" />
            {/* Trapezius hints at high % */}
            {p > 0.6 && (
              <>
                <path d={`M ${cx - body.neckW / 2} ${neckTop + 2} Q ${cx - body.neckW} ${neckTop + body.neckH + 3} ${cx - body.shoulderW + 3} ${torsoTop + 2}`}
                  stroke={palette.muscleShadow} strokeWidth={0.5 + p * 0.5} fill="none" opacity={0.4} />
                <path d={`M ${cx + body.neckW / 2} ${neckTop + 2} Q ${cx + body.neckW} ${neckTop + body.neckH + 3} ${cx + body.shoulderW - 3} ${torsoTop + 2}`}
                  stroke={palette.muscleShadow} strokeWidth={0.5 + p * 0.5} fill="none" opacity={0.4} />
              </>
            )}

            {/* === HEAD === */}
            <circle cx={cx} cy={headY} r={body.headR} fill="url(#skinGrad)" stroke={palette.skinShadow} strokeWidth="0.4" />
            {/* Jaw definition at high % */}
            {p > 0.7 && (
              <path d={`M ${cx - 9} ${headY + 3} Q ${cx} ${headY + body.headR + 2 + p * 1.5} ${cx + 9} ${headY + 3}`}
                fill="none" stroke={palette.skinShadow} strokeWidth="0.5" opacity={0.3} />
            )}
            {/* Eyes */}
            <ellipse cx={cx - 4.5} cy={headY - 1} rx={2} ry={2.2} fill="#1a1a2e" />
            <ellipse cx={cx + 4.5} cy={headY - 1} rx={2} ry={2.2} fill="#1a1a2e" />
            <circle cx={cx - 3.8} cy={headY - 1.8} r={0.7} fill="white" />
            <circle cx={cx + 5.2} cy={headY - 1.8} r={0.7} fill="white" />
            {/* Smile */}
            <path
              d={`M ${cx - smileR} ${headY + 5} Q ${cx} ${headY + 5 + smileR * 1.1} ${cx + smileR} ${headY + 5}`}
              fill="none" stroke="#c0392b" strokeWidth="1.1" strokeLinecap="round"
            />
            {/* Determined eyebrows at higher stages */}
            {stage >= 2 && (
              <>
                <line x1={cx - 7} y1={headY - 5} x2={cx - 2.5} y2={headY - 5.5 - p * 1} stroke="#3d2b1f" strokeWidth={0.9 + p * 0.3} strokeLinecap="round" />
                <line x1={cx + 2.5} y1={headY - 5.5 - p * 1} x2={cx + 7} y2={headY - 5} stroke="#3d2b1f" strokeWidth={0.9 + p * 0.3} strokeLinecap="round" />
              </>
            )}

            {/* === EFFECTS === */}
            {/* Sweat at low progress */}
            {p < 0.25 && (
              <motion.ellipse
                cx={cx + body.headR + 3} cy={headY - 2}
                rx={1.5} ry={2.5} fill="#87ceeb"
                animate={{ y: [0, 8, 0], opacity: [0.8, 0, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}

            {/* Pulse/glow at 100% */}
            {stage === 5 && (
              <>
                <motion.circle
                  cx={cx} cy={torsoTop + body.chestH / 2} r={body.shoulderW + 8}
                  fill="none" stroke={palette.muscleHighlight} strokeWidth="1"
                  animate={{ r: [body.shoulderW + 5, body.shoulderW + 12, body.shoulderW + 5], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.text x={cx - 20} y={headY - 18} fontSize="7" animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }} transition={{ duration: 1.5, repeat: Infinity }}>✨</motion.text>
                <motion.text x={cx + 16} y={torsoTop} fontSize="7" animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}>✨</motion.text>
                <motion.text x={cx - 24} y={torsoTop + 20} fontSize="6" animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}>💪</motion.text>
              </>
            )}

            {/* Sparkles at stage 4 */}
            {stage === 4 && (
              <>
                <motion.text x={cx + 20} y={headY} fontSize="6" animate={{ opacity: [0.2, 0.9, 0.2] }} transition={{ duration: 1.8, repeat: Infinity }}>✨</motion.text>
              </>
            )}
          </g>
        </motion.svg>
      </div>
      <div className="px-3 py-2 border-t border-border/50 flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className="text-[11px] font-bold tabular-nums text-foreground">{(p * 100).toFixed(0)}%</span>
      </div>
    </motion.div>
  );
};
