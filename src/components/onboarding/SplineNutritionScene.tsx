/**
 * SplineNutritionScene
 * ─────────────────────────────────────────────────────────────
 * Premium hero visual for the "Nutrición sincronizada" slide.
 *
 * Design rules:
 *  - Lazy-loaded (`React.lazy`) so the Spline runtime never ships
 *    in the critical-path bundle.
 *  - Client-only by construction (Vite is CSR — no SSR concerns),
 *    but we still gate render on `mounted` to avoid any hydration
 *    flicker if the component is ever moved to a SSR context.
 *  - Respects `prefers-reduced-motion`: skips Spline entirely and
 *    falls back to the static premium visual.
 *  - Mobile-first degradation: very small viewports (<360px) or
 *    devices reporting `saveData` / low memory fall back to the
 *    canvas hero to keep the onboarding buttery-smooth.
 *  - Always renders an elegant fallback (`fallback` prop) while
 *    Spline initialises, on error, or when no `scene.splinecode`
 *    URL has been provided yet.
 *  - Dark-premium overlays (radial vignette + bottom gradient)
 *    guarantee text legibility on top of the 3D scene.
 */

import { Suspense, lazy, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

type SplineNutritionSceneProps = {
  /**
   * Exported Spline scene URL (e.g. `https://prod.spline.design/.../scene.splinecode`).
   * If omitted the component renders the premium fallback only — useful while the
   * scene is still being exported from Spline.
   */
  scene?: string;
  /** Premium fallback visual (rendered while loading, on error, or when no scene). */
  fallback: ReactNode;
  /** Hex accent color for overlay tints (defaults to the nutrition accent). */
  accentColor?: string;
  /** Square render size in CSS pixels. */
  size?: number;
  className?: string;
};

const isLowPowerDevice = () => {
  if (typeof navigator === 'undefined') return false;
  // Network saver
  const conn = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  }).connection;
  if (conn?.saveData) return true;
  if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return true;
  // Memory hint
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof mem === 'number' && mem > 0 && mem < 2) return true;
  // Tiny viewport — onboarding looks great with the fallback alone
  if (typeof window !== 'undefined' && window.innerWidth < 360) return true;
  return false;
};

const prefersReducedMotion = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const SplineNutritionScene = ({
  scene,
  fallback,
  accentColor = '#34D399',
  size = 320,
  className = '',
}: SplineNutritionSceneProps) => {
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Decide once whether we should attempt to load Spline at all.
  const shouldLoadSpline = useMemo(() => {
    if (!scene) return false;
    if (prefersReducedMotion()) return false;
    if (isLowPowerDevice()) return false;
    return true;
  }, [scene]);

  useEffect(() => {
    // Defer Spline mount one frame so the slide reveal animation lands first.
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const showSpline = shouldLoadSpline && mounted && !errored;

  return (
    <div
      ref={containerRef}
      className={`relative isolate overflow-hidden rounded-[28px] ${className}`}
      style={{
        width: size,
        height: size,
        // Subtle inner border + premium dark surface to anchor the scene
        background:
          'radial-gradient(120% 120% at 50% 0%, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0) 60%), #07090A',
        boxShadow:
          'inset 0 0 0 1px rgba(255,255,255,0.06), 0 30px 80px -40px rgba(0,0,0,0.8)',
      }}
      aria-hidden="true"
    >
      {/* ── Fallback layer (always rendered, fades out when Spline is ready) ── */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-out"
        style={{ opacity: showSpline && loaded ? 0 : 1 }}
      >
        {fallback}
      </div>

      {/* ── Spline layer ── */}
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

      {/* ── Premium overlays (legibility + brand tint) ── */}
      {/* Accent radial tint */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(60% 50% at 50% 45%, ${hexToRgba(accentColor, 0.18)} 0%, transparent 70%)`,
          mixBlendMode: 'screen',
        }}
      />
      {/* Bottom legibility gradient — protects the title underneath the scene */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%]"
        style={{
          background:
            'linear-gradient(to top, rgba(7,9,10,0.92) 0%, rgba(7,9,10,0.55) 45%, transparent 100%)',
        }}
      />
      {/* Top vignette */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[28%]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(7,9,10,0.55) 0%, transparent 100%)',
        }}
      />
      {/* Hairline border */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[28px]"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)' }}
      />
      {/* Hide Spline watermark gracefully */}
      <div
        className="pointer-events-none absolute bottom-2 right-2 h-7 w-28 rounded-md"
        style={{ background: '#07090A' }}
      />
    </div>
  );
};

/* ── helpers ───────────────────────────────────────────────── */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return `rgba(52,211,153,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default SplineNutritionScene;
