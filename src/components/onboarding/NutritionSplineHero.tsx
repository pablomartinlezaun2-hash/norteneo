/**
 * NutritionSplineHero
 * ─────────────────────────────────────────────────────────────
 * Hero editorial para la slide "Nutrición sincronizada".
 * Versión Vite/React del snippet original de Next.js.
 *
 *  - Spline cargado vía `React.lazy` (no hay SSR en Vite — equivalente a `ssr:false`)
 *  - Fallback premium (escena estática) mientras carga, si falla, o si no hay scene
 *  - Respeta `prefers-reduced-motion` y degrada en dispositivos low-power
 *  - Overlays oscuros + tinte verde/cian para máxima legibilidad
 *  - Mobile-first: la composición se adapta al ancho del contenedor padre
 */

import { Suspense, lazy, useEffect, useMemo, useState } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

type NutritionSplineHeroProps = {
  /** URL exportada de Spline tipo `https://prod.spline.design/.../scene.splinecode`. */
  scene?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  /** Altura mínima del hero. Mobile-first: el contenedor crece con el viewport. */
  minHeight?: number;
};

/* ── Helpers de capacidad del dispositivo ──────────────────── */
const prefersReducedMotion = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const isLowPowerDevice = () => {
  if (typeof navigator === 'undefined') return false;
  const conn = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (conn?.saveData) return true;
  if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return true;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof mem === 'number' && mem > 0 && mem < 2) return true;
  if (typeof window !== 'undefined' && window.innerWidth < 360) return true;
  return false;
};

/* ── Fallback premium estático ─────────────────────────────── */
function StaticFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Halo radial */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 45%, rgba(52,211,153,0.22) 0%, rgba(34,211,238,0.10) 40%, transparent 75%)',
        }}
      />
      {/* Anillos orbitales */}
      <div className="relative h-[260px] w-[260px]">
        {[260, 200, 140, 80].map((s, i) => (
          <div
            key={s}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: s,
              height: s,
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: i === 3 ? '0 0 40px -10px rgba(52,211,153,0.5)' : undefined,
              animation: `nsh-spin ${24 + i * 6}s linear infinite ${i % 2 ? 'reverse' : ''}`,
            }}
          />
        ))}
        {/* Núcleo */}
        <div
          className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 35% 30%, #6EE7B7 0%, #34D399 40%, #047857 100%)',
            boxShadow: '0 0 60px -8px rgba(52,211,153,0.7), inset 0 0 12px rgba(255,255,255,0.25)',
          }}
        />
      </div>
      <style>{`@keyframes nsh-spin { to { transform: translate(-50%, -50%) rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── Componente principal ──────────────────────────────────── */
export default function NutritionSplineHero({
  scene,
  title = 'Nutrición sincronizada',
  subtitle = 'Macros, suplementación y comidas integradas con tu entrenamiento. Todo conectado.',
  className = '',
  minHeight = 760,
}: NutritionSplineHeroProps) {
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const hasScene = useMemo(
    () => Boolean(scene && scene.includes('scene.splinecode')),
    [scene],
  );

  const shouldLoadSpline = useMemo(() => {
    if (!hasScene) return false;
    if (prefersReducedMotion()) return false;
    if (isLowPowerDevice()) return false;
    return true;
  }, [hasScene]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const showSpline = shouldLoadSpline && mounted && !errored;

  return (
    <section
      className={`relative isolate w-full overflow-hidden rounded-[32px] ${className}`}
      style={{
        minHeight,
        background:
          'radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 55%), #07090A',
        boxShadow:
          'inset 0 0 0 1px rgba(255,255,255,0.06), 0 40px 120px -50px rgba(0,0,0,0.85)',
      }}
      aria-label="Nutrición sincronizada"
    >
      {/* ── Capa 3D / fallback ── */}
      <div className="absolute inset-0">
        {/* Fallback (siempre presente, fade-out cuando Spline carga) */}
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{ opacity: showSpline && loaded ? 0 : 1 }}
        >
          <StaticFallback />
        </div>

        {/* Spline */}
        {showSpline && scene && (
          <div
            className="absolute inset-0 transition-opacity duration-700 ease-out"
            style={{ opacity: loaded ? 1 : 0 }}
          >
            <Suspense fallback={null}>
              <Spline
                scene={scene}
                onLoad={() => setLoaded(true)}
                onError={() => setErrored(true)}
                style={{ width: '100%', height: '100%' }}
              />
            </Suspense>
          </div>
        )}
      </div>

      {/* ── Overlays de integración premium ── */}
      {/* Tinte verde/cian */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(70% 50% at 50% 35%, rgba(52,211,153,0.18) 0%, rgba(34,211,238,0.08) 45%, transparent 75%)',
          mixBlendMode: 'screen',
        }}
      />
      {/* Vignette superior */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[35%]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(7,9,10,0.65) 0%, transparent 100%)',
        }}
      />
      {/* Gradiente de legibilidad inferior */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%]"
        style={{
          background:
            'linear-gradient(to top, rgba(7,9,10,0.96) 0%, rgba(7,9,10,0.7) 35%, rgba(7,9,10,0.2) 75%, transparent 100%)',
        }}
      />
      {/* Hairline border interno */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[32px]"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)' }}
      />
      {/* Tapa la marca de agua de Spline */}
      <div
        className="pointer-events-none absolute bottom-3 right-3 h-7 w-28 rounded-md"
        style={{ background: '#07090A' }}
      />

      {/* ── Composición editorial ── */}
      <div className="relative z-10 flex h-full min-h-full flex-col justify-end px-6 pb-10 pt-14 sm:px-10 sm:pb-14">
        <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-4 text-center">
          {/* Eyebrow chip */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em]"
            style={{
              background: 'rgba(52,211,153,0.10)',
              color: '#6EE7B7',
              boxShadow: 'inset 0 0 0 1px rgba(110,231,183,0.25)',
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399]" />
            Nutrición
          </div>

          {/* Título */}
          <h1
            className="text-[32px] font-bold leading-[1.05] tracking-[-0.04em] sm:text-[44px]"
            style={{ color: '#F5F5F7' }}
          >
            {title}
          </h1>

          {/* Subtítulo */}
          <p
            className="max-w-[420px] text-[13px] leading-[1.7] tracking-[0.01em] sm:text-[15px]"
            style={{ color: 'rgba(245,245,247,0.62)' }}
          >
            {subtitle}
          </p>

          {/* Chips inferiores */}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {['MACROS', 'SUPLEMENTOS', 'RECETAS'].map((label) => (
              <span
                key={label}
                className="rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-[0.18em]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(245,245,247,0.78)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
