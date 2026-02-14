import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Eye, Info, BarChart3, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, ComposedChart
} from 'recharts';
import { CardioSessionLog, CardioInterval } from '@/hooks/useCardioLogs';
import { PaceUnitSelector } from './PaceUnitSelector';
import {
  calculatePace, convertPace, formatPace, formatPaceDetailed,
  formatDuration, formatUnitLabel, generateCSV, downloadFile, DEFAULT_PACE_UNIT
} from './paceUtils';

interface SessionDetailViewProps {
  session: CardioSessionLog;
  activityType: 'running' | 'swimming';
  onClose: () => void;
}

export const SessionDetailView = ({ session, activityType, onClose }: SessionDetailViewProps) => {
  const isRunning = activityType === 'running';
  const accentColor = isRunning ? 'hsl(142, 71%, 45%)' : 'hsl(199, 89%, 48%)';
  const [paceUnit, setPaceUnit] = useState(DEFAULT_PACE_UNIT[activityType]);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [showFormula, setShowFormula] = useState<number | null>(null);

  const intervals = session.intervals || [];
  const hasIntervals = intervals.length > 0;

  // Session-level pace (auto-calculated or manual)
  const sessionPace = useMemo(() => {
    if (session.avg_pace_seconds_per_unit && Number(session.avg_pace_seconds_per_unit) > 0) {
      // Stored pace is per default unit (km for running, 100m for swimming)
      const storedUnit = DEFAULT_PACE_UNIT[activityType];
      return convertPace(Number(session.avg_pace_seconds_per_unit), storedUnit, paceUnit);
    }
    if (session.total_duration_seconds && Number(session.total_distance_m) > 0) {
      return calculatePace(
        Number(session.total_duration_seconds),
        Number(session.total_distance_m),
        paceUnit
      );
    }
    return undefined;
  }, [session, paceUnit, activityType]);

  // Per-interval data with pace recalculated for selected unit
  const intervalData = useMemo(() => {
    return intervals.map((iv, idx) => {
      const dist = Number(iv.distance_m);
      const storedPaceUnit = iv.pace_unit_m || DEFAULT_PACE_UNIT[activityType];
      const storedPace = iv.pace_seconds_per_unit ? Number(iv.pace_seconds_per_unit) : undefined;
      const duration = iv.duration_seconds ? Number(iv.duration_seconds) : undefined;

      let displayPace: number | undefined;
      let isManual = false;
      let calcTime: number | undefined;
      let calcDist: number | undefined;

      if (storedPace && storedPace > 0) {
        // Manual pace entered → convert to selected unit
        displayPace = convertPace(storedPace, storedPaceUnit, paceUnit);
        isManual = true;
      } else if (duration && dist > 0) {
        // Auto-calculate
        displayPace = calculatePace(duration, dist, paceUnit);
        calcTime = duration;
        calcDist = dist;
      }

      return {
        index: idx,
        name: `Serie ${idx + 1}`,
        distance_m: dist,
        duration_s: duration,
        pace: displayPace,
        isManual,
        calcTime,
        calcDist,
        rest: iv.rest_seconds,
      };
    });
  }, [intervals, paceUnit, activityType]);

  // Average pace reference line
  const avgPace = useMemo(() => {
    if (sessionPace) return sessionPace;
    const valid = intervalData.filter(d => d.pace !== undefined);
    if (valid.length === 0) return undefined;
    return valid.reduce((s, d) => s + (d.pace || 0), 0) / valid.length;
  }, [intervalData, sessionPace]);

  // Filtered chart data (exclude missing distance/time)
  const chartData = intervalData.filter(d => d.pace !== undefined);
  const missingData = intervalData.filter(d => d.pace === undefined);

  const handleExportCSV = () => {
    const rows = intervalData.map((d, i) => ({
      id: `${session.id}-${i}`,
      name: d.name,
      sport: activityType,
      distance_m: d.distance_m,
      time_s: d.duration_s || 0,
      pace_calculated_s: d.pace,
      unit_selected: paceUnit,
    }));
    const csv = generateCSV(rows);
    downloadFile(csv, `sesion-${session.id.slice(0, 8)}.csv`, 'text/csv');
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-foreground/95 backdrop-blur-md rounded-xl p-3 shadow-2xl border border-white/10 space-y-1 z-50">
          <p className="text-primary-foreground font-bold text-xs">{d.name}</p>
          <p className="text-primary-foreground/80 text-[10px]">
            Distancia: {d.distance_m} m
          </p>
          {d.duration_s && (
            <p className="text-primary-foreground/80 text-[10px]">
              Tiempo: {formatDuration(d.duration_s)}
            </p>
          )}
          {d.pace !== undefined && (
            <p className="text-primary-foreground text-xs font-semibold">
              Ritmo: {formatPaceDetailed(d.pace)}/{formatUnitLabel(paceUnit)}
            </p>
          )}
          {d.isManual && (
            <p className="text-yellow-300 text-[9px]">Ritmo manual</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="rounded-2xl border border-border bg-card p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">
          {session.session_name || 'Detalle de sesión'}
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Pace unit selector */}
      <PaceUnitSelector activityType={activityType} value={paceUnit} onChange={setPaceUnit} />

      {/* Session summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-muted/50 p-2">
          <p className="text-xs text-muted-foreground">Distancia</p>
          <p className="text-sm font-bold text-foreground">
            {isRunning
              ? `${(Number(session.total_distance_m) / 1000).toFixed(2)} km`
              : `${Number(session.total_distance_m).toFixed(0)} m`}
          </p>
        </div>
        <div className="rounded-xl bg-muted/50 p-2">
          <p className="text-xs text-muted-foreground">Tiempo</p>
          <p className="text-sm font-bold text-foreground">
            {session.total_duration_seconds
              ? formatDuration(Number(session.total_duration_seconds))
              : '--'}
          </p>
        </div>
        <div className="rounded-xl bg-muted/50 p-2">
          <p className="text-xs text-muted-foreground">Ritmo</p>
          <p className="text-sm font-bold text-foreground">
            {sessionPace ? `${formatPace(sessionPace)}` : '--'}
          </p>
          <p className="text-[9px] text-muted-foreground">/{formatUnitLabel(paceUnit)}</p>
        </div>
      </div>

      {/* Intervals list */}
      {hasIntervals && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground">Series / Intervalos</h4>
          {intervalData.map((iv, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-background/50 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-foreground">{iv.name}</span>
                <div className="flex items-center gap-1">
                  {iv.isManual && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600">
                      Manual
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setShowFormula(showFormula === idx ? null : idx)}
                  >
                    <Eye className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                <div>
                  <span className="block">Distancia</span>
                  <span className="text-xs font-medium text-foreground">{iv.distance_m} m</span>
                </div>
                <div>
                  <span className="block">Tiempo</span>
                  <span className="text-xs font-medium text-foreground">
                    {iv.duration_s ? formatDuration(iv.duration_s) : '--'}
                  </span>
                </div>
                <div>
                  <span className="block">Ritmo</span>
                  <span className="text-xs font-medium text-foreground">
                    {iv.pace !== undefined ? `${formatPace(iv.pace)}/${formatUnitLabel(paceUnit)}` : '--'}
                  </span>
                </div>
              </div>
              {iv.rest !== undefined && iv.rest > 0 && (
                <p className="text-[9px] text-muted-foreground mt-1">Descanso: {iv.rest}s</p>
              )}

              {/* Formula popup */}
              <AnimatePresence>
                {showFormula === idx && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 p-2 rounded-lg bg-muted/60 border border-border"
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Info className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] font-semibold text-foreground">Cálculo del ritmo</span>
                    </div>
                    {iv.isManual ? (
                      <p className="text-[10px] text-muted-foreground">
                        Ritmo introducido manualmente por el usuario.
                        {iv.pace !== undefined && (
                          <> Convertido a unidad seleccionada ({formatUnitLabel(paceUnit)}).</>
                        )}
                      </p>
                    ) : iv.calcTime && iv.calcDist ? (
                      <div className="text-[10px] text-muted-foreground space-y-0.5">
                        <p>Fórmula: (tiempo / distancia) × unidad</p>
                        <p>= ({iv.calcTime}s / {iv.calcDist}m) × {paceUnit}m</p>
                        <p>= {iv.pace !== undefined ? formatPaceDetailed(iv.pace) : '--'} por {formatUnitLabel(paceUnit)}</p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">
                        No hay suficientes datos (distancia y/o tiempo) para calcular el ritmo.
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {missingData.length > 0 && (
            <p className="text-[10px] text-yellow-600 flex items-center gap-1">
              <Info className="w-3 h-3" />
              {missingData.length} serie(s) sin datos suficientes para calcular ritmo.
            </p>
          )}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" style={{ color: accentColor }} />
              Ritmo por serie ({formatUnitLabel(paceUnit)})
            </h4>
            <div className="flex gap-1">
              <Button
                variant={chartType === 'bar' ? 'default' : 'outline'}
                size="icon"
                className="h-6 w-6"
                onClick={() => setChartType('bar')}
              >
                <BarChart3 className="w-3 h-3" />
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="icon"
                className="h-6 w-6"
                onClick={() => setChartType('line')}
              >
                <TrendingUp className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="h-44 rounded-xl border border-border bg-background/50 p-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <YAxis
                    reversed
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatPace(v)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {avgPace && (
                    <ReferenceLine
                      y={avgPace}
                      stroke="hsl(var(--destructive))"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{ value: `Avg ${formatPace(avgPace)}`, fontSize: 9, fill: 'hsl(var(--destructive))' }}
                    />
                  )}
                  <Bar dataKey="pace" fill={accentColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <YAxis
                    reversed
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatPace(v)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {avgPace && (
                    <ReferenceLine
                      y={avgPace}
                      stroke="hsl(var(--destructive))"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{ value: `Avg ${formatPace(avgPace)}`, fontSize: 9, fill: 'hsl(var(--destructive))' }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="pace"
                    stroke={accentColor}
                    strokeWidth={2}
                    dot={{ fill: accentColor, r: 4 }}
                    connectNulls
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Export */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs">
          <Download className="w-3 h-3 mr-1" />
          Exportar CSV
        </Button>
      </div>
    </motion.div>
  );
};
