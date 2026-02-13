import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface NutritionMascot2DProps {
  progress: number;
  className?: string;
}

export const NutritionMascot2D = ({ progress, className = '' }: NutritionMascot2DProps) => {
  const p = Math.max(0, Math.min(progress, 100)) / 100;

  const label = p >= 0.95 ? '¡Máquina!' : p >= 0.80 ? '¡Vas fuerte!' : p >= 0.60 ? 'Creciendo...' : p >= 0.30 ? 'Empezando' : 'Aliméntame';

  const skinColor = useMemo(() => {
    const r = Math.round(215 + p * 25);
    const g = Math.round(180 + p * 12);
    const b = Math.round(155 - p * 15);
    return `rgb(${r},${g},${b})`;
  }, [p]);

  const muscleColor = useMemo(() => {
    const r = Math.round(200 + p * 30);
    const g = Math.round(150 + p * 20);
    const b = Math.round(130 - p * 10);
    return `rgb(${r},${g},${b})`;
  }, [p]);

  // Body dimensions scale with progress
  const chestW = 28 + p * 18;
  const chestH = 34 + p * 8;
  const armW = 8 + p * 8;
  const armH = 30 + p * 6;
  const legW = 10 + p * 6;
  const legH = 34 + p * 4;
  const shoulderW = 6 + p * 8;
  const neckW = 6 + p * 3;

  const smileRadius = 3 + p * 2;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl overflow-hidden bg-gradient-to-br from-muted/80 to-muted/30 border border-border/50 ${className}`}
    >
      <div className="flex items-center justify-center h-40 w-full">
        <motion.svg
          viewBox="0 0 120 160"
          className="h-full w-auto"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Head */}
          <circle cx="60" cy="28" r="14" fill={skinColor} stroke={muscleColor} strokeWidth="0.5" />
          {/* Eyes */}
          <circle cx="55" cy="26" r="1.8" fill="#1a1a2e" />
          <circle cx="65" cy="26" r="1.8" fill="#1a1a2e" />
          {/* Eye shine */}
          <circle cx="55.6" cy="25.4" r="0.6" fill="white" />
          <circle cx="65.6" cy="25.4" r="0.6" fill="white" />
          {/* Smile */}
          <path
            d={`M ${60 - smileRadius} 32 Q 60 ${32 + smileRadius * 1.2} ${60 + smileRadius} 32`}
            fill="none"
            stroke="#c0392b"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Eyebrows - more intense when buff */}
          {p > 0.5 && (
            <>
              <line x1="52" y1="22" x2="58" y2={22 - p * 1.5} stroke="#4a3728" strokeWidth="1" strokeLinecap="round" />
              <line x1="62" y1={22 - p * 1.5} x2="68" y2="22" stroke="#4a3728" strokeWidth="1" strokeLinecap="round" />
            </>
          )}

          {/* Neck */}
          <rect x={60 - neckW / 2} y="40" width={neckW} height="8" rx="2" fill={skinColor} />

          {/* Shoulders (trapezoids) */}
          {p > 0.3 && (
            <>
              <ellipse cx={60 - chestW / 2 - 2} cy="52" rx={shoulderW / 2} ry={shoulderW / 2.5} fill={muscleColor} opacity={0.85} />
              <ellipse cx={60 + chestW / 2 + 2} cy="52" rx={shoulderW / 2} ry={shoulderW / 2.5} fill={muscleColor} opacity={0.85} />
            </>
          )}

          {/* Torso */}
          <rect x={60 - chestW / 2} y="47" width={chestW} height={chestH} rx="6" fill={muscleColor} />

          {/* Pecs */}
          {p > 0.4 && (
            <>
              <ellipse cx={60 - chestW / 5} cy="56" rx={3 + p * 4} ry={2 + p * 3} fill={skinColor} opacity={0.5} />
              <ellipse cx={60 + chestW / 5} cy="56" rx={3 + p * 4} ry={2 + p * 3} fill={skinColor} opacity={0.5} />
            </>
          )}

          {/* Abs */}
          {p > 0.6 && [0, 1, 2].map(i => (
            <g key={`abs-${i}`}>
              <rect x={60 - 5} y={63 + i * 6} width={4} height={4} rx="1" fill={skinColor} opacity={0.4} />
              <rect x={60 + 1} y={63 + i * 6} width={4} height={4} rx="1" fill={skinColor} opacity={0.4} />
            </g>
          ))}

          {/* Arms */}
          {/* Left */}
          <rect
            x={60 - chestW / 2 - armW}
            y="50"
            width={armW}
            height={armH}
            rx="4"
            fill={skinColor}
            stroke={muscleColor}
            strokeWidth="0.5"
          />
          {/* Left bicep */}
          {p > 0.3 && (
            <ellipse
              cx={60 - chestW / 2 - armW / 2}
              cy={55}
              rx={armW / 2.2}
              ry={2 + p * 4}
              fill={muscleColor}
              opacity={0.6}
            />
          )}
          {/* Right */}
          <rect
            x={60 + chestW / 2}
            y="50"
            width={armW}
            height={armH}
            rx="4"
            fill={skinColor}
            stroke={muscleColor}
            strokeWidth="0.5"
          />
          {/* Right bicep */}
          {p > 0.3 && (
            <ellipse
              cx={60 + chestW / 2 + armW / 2}
              cy={55}
              rx={armW / 2.2}
              ry={2 + p * 4}
              fill={muscleColor}
              opacity={0.6}
            />
          )}

          {/* Shorts */}
          <rect x={60 - chestW / 2 + 2} y={47 + chestH - 2} width={chestW - 4} height="14" rx="3" fill="#3b5998" />

          {/* Legs */}
          <rect x={60 - legW - 2} y={47 + chestH + 10} width={legW} height={legH} rx="4" fill={skinColor} stroke={muscleColor} strokeWidth="0.5" />
          {p > 0.5 && (
            <ellipse cx={60 - legW / 2 - 2} cy={47 + chestH + 18} rx={legW / 2.5} ry={3 + p * 4} fill={muscleColor} opacity={0.4} />
          )}
          <rect x={60 + 2} y={47 + chestH + 10} width={legW} height={legH} rx="4" fill={skinColor} stroke={muscleColor} strokeWidth="0.5" />
          {p > 0.5 && (
            <ellipse cx={60 + legW / 2 + 2} cy={47 + chestH + 18} rx={legW / 2.5} ry={3 + p * 4} fill={muscleColor} opacity={0.4} />
          )}

          {/* Feet */}
          <rect x={60 - legW - 4} y={47 + chestH + 10 + legH - 2} width={legW + 4} height="5" rx="2" fill="#2c3e50" />
          <rect x={60} y={47 + chestH + 10 + legH - 2} width={legW + 4} height="5" rx="2" fill="#2c3e50" />

          {/* Sweat drops when low progress */}
          {p < 0.3 && (
            <motion.ellipse
              cx="73"
              cy="24"
              rx="1.5"
              ry="2.5"
              fill="#87ceeb"
              animate={{ y: [0, 6, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}

          {/* Sparkles when high progress */}
          {p > 0.8 && (
            <>
              <motion.text x="18" y="30" fontSize="8" animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }} transition={{ duration: 1.5, repeat: Infinity }}>✨</motion.text>
              <motion.text x="90" y="50" fontSize="8" animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}>✨</motion.text>
            </>
          )}
        </motion.svg>
      </div>
      <div className="px-3 py-2 border-t border-border/50 flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className="text-[11px] font-bold tabular-nums text-foreground">{(p * 100).toFixed(0)}%</span>
      </div>
    </motion.div>
  );
};
