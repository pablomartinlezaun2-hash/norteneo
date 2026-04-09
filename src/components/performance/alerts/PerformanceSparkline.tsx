import { useMemo } from 'react';

interface PerformanceSparklineProps {
  values: number[];
  width?: number;
  height?: number;
  positive?: boolean;
}

export const PerformanceSparkline = ({
  values,
  width = 44,
  height = 16,
  positive,
}: PerformanceSparklineProps) => {
  const path = useMemo(() => {
    if (values.length < 2) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const pad = 1.5;
    const w = width - pad * 2;
    const h = height - pad * 2;
    const step = w / (values.length - 1);

    return values
      .map((v, i) => {
        const x = pad + i * step;
        const y = pad + h - ((v - min) / range) * h;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [values, width, height]);

  if (values.length < 2) return null;

  const color = positive === true
    ? 'hsl(152 60% 42%)'
    : positive === false
    ? 'hsl(0 55% 55%)'
    : 'hsl(var(--muted-foreground))';

  return (
    <svg width={width} height={height} className="shrink-0 opacity-60" style={{ overflow: 'visible' }}>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={width - 1.5}
        cy={parseFloat(path.split(',').pop() || '0')}
        r={1.5}
        fill={color}
      />
    </svg>
  );
};
