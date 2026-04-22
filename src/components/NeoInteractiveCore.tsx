/**
 * NEO · InteractiveCore
 * ──────────────────────────────────────────────────────────────
 * Componente hero para Lovable.
 *
 *   · Robot 3D Spline centrado (sigue al cursor/dedo)
 *   · Logo "NEO" sutil sobre el pecho del robot
 *   · 4 botones orbitales con efecto láser
 *     (Progreso · Entrenamientos · Nutrición · Red Neuronal)
 *   · Preview animado específico al acercarse a cada botón
 *   · CTA funcional "Acceder a NEO" abajo
 *   · Totalmente optimizado para móvil
 *
 * INSTALACIÓN (Lovable)
 *   npm i @splinetool/react-spline @splinetool/runtime
 *
 * FUENTE RECOMENDADA (añadir en index.html)
 *   <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
 *
 * USO
 *   <NeoInteractiveCore onAccess={() => navigate("/app")} />
 * ────────────────────────────────────────────────────────────── */

import { Suspense, lazy, useEffect, useRef, useState } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

type NeoProps = {
  sceneUrl?: string;
  onAccess?: () => void;
};

type OrbitKey = "progreso" | "entrenamientos" | "nutricion" | "red-neuronal";

export default function NeoInteractiveCore({
  sceneUrl = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode",
  onAccess,
}: NeoProps) {
  const [activeKey, setActiveKey] = useState<OrbitKey | null>(null);
  const [isSplineLoaded, setIsSplineLoaded] = useState(false);
  const [showSplineFallback, setShowSplineFallback] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // Cierra cualquier preview al clicar fuera
  useEffect(() => {
    const close = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-orbit]")) setActiveKey(null);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    if (isSplineLoaded) {
      setShowSplineFallback(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSplineFallback(true);
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [isSplineLoaded]);

  const toggle = (key: OrbitKey) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveKey((prev) => (prev === key ? null : key));
  };

  return (
    <div ref={stageRef} className="neo-stage">
      <style>{styles}</style>

      {/* ── ESCENA 3D ─────────────────────────── */}
      <div className="neo-scene">
        <Suspense fallback={<div className="neo-loader" />}>
          <Spline
            scene={sceneUrl}
            onLoad={() => setIsSplineLoaded(true)}
            style={{ width: "100%", height: "100%" }}
          />
        </Suspense>
        {!isSplineLoaded && (
          <div className={`neo-scene-status ${showSplineFallback ? "is-visible" : ""}`}>
            <div className="neo-scene-status__panel">
              <div className="neo-scene-status__eyebrow">
                {showSplineFallback ? "escena 3D no disponible" : "cargando escena 3D"}
              </div>
              <div className="neo-scene-status__title">
                {showSplineFallback ? "El robot no ha cargado en esta preview." : "Iniciando animación interactiva…"}
              </div>
            </div>
          </div>
        )}
        {showSplineFallback && !isSplineLoaded && (
          <div className="neo-fallback-figure" aria-hidden="true">
            <div className="neo-fallback-figure__halo" />
            <div className="neo-fallback-figure__torso" />
            <div className="neo-fallback-figure__core" />
          </div>
        )}
        <div className="neo-chest-logo">NEO</div>
        <div className="neo-spline-mask" />
      </div>

      {/* ── BOTONES ORBITALES ─────────────────── */}
      <OrbitButton
        orbitClass="orbit--progreso"
        label="Progreso"
        dotColor="#5FA8FF"
        laserDelay="0s"
        isActive={activeKey === "progreso"}
        onToggle={toggle("progreso")}
      >
        <ProgresoPreview active={activeKey === "progreso"} />
      </OrbitButton>

      <OrbitButton
        orbitClass="orbit--entrenamientos"
        label="Entrenamientos"
        dotColor="#B08BFF"
        laserDelay=".8s"
        isActive={activeKey === "entrenamientos"}
        onToggle={toggle("entrenamientos")}
      >
        <EntrenamientosPreview active={activeKey === "entrenamientos"} />
      </OrbitButton>

      <OrbitButton
        orbitClass="orbit--nutricion"
        label="Nutrición"
        dotColor="#5FF7B0"
        laserDelay="1.6s"
        isActive={activeKey === "nutricion"}
        onToggle={toggle("nutricion")}
      >
        <NutricionPreview active={activeKey === "nutricion"} />
      </OrbitButton>

      <OrbitButton
        orbitClass="orbit--red-neuronal"
        label="Red Neuronal"
        dotColor="#7DF3FF"
        laserDelay="2.4s"
        isActive={activeKey === "red-neuronal"}
        onToggle={toggle("red-neuronal")}
      >
        <RedNeuronalPreview active={activeKey === "red-neuronal"} />
      </OrbitButton>

      {/* ── CTA ──────────────────────────────── */}
      <button className="neo-cta" onClick={onAccess}>
        Acceder a NEO
        <span className="neo-cta__arrow">→</span>
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   BOTÓN ORBITAL
   ════════════════════════════════════════════════════════════ */

function OrbitButton({
  orbitClass,
  label,
  dotColor,
  laserDelay,
  isActive,
  onToggle,
  children,
}: {
  orbitClass: string;
  label: string;
  dotColor: string;
  laserDelay: string;
  isActive: boolean;
  onToggle: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      data-orbit
      onClick={onToggle}
      className={`orbit ${orbitClass} ${isActive ? "is-active" : ""}`}
      aria-label={label}
    >
      <span className="pill" style={{ "--laser-delay": laserDelay } as React.CSSProperties}>
        <span className="dot" style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />
        <span>{label}</span>
      </span>
      {children}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════
   PREVIEWS
   ════════════════════════════════════════════════════════════ */

function ProgresoPreview({ active }: { active: boolean }) {
  return (
    <div className={`preview preview--progreso p-progreso ${active ? "is-playing" : ""}`}>
      <div className="preview__head">
        <span>rendimiento · 72h</span>
        <span className="status">▲ 2.1%</span>
      </div>
      <div className="value">
        +18.2<span className="unit">%</span>
      </div>
      <svg viewBox="0 0 200 48" preserveAspectRatio="none">
        <defs>
          <linearGradient id="neoGradProg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5FA8FF" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#5FA8FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="fill" fill="url(#neoGradProg)"
          d="M0,42 C20,40 40,36 60,30 C80,24 100,20 120,14 C140,10 160,6 180,4 L195,2 L200,2 L200,48 L0,48 Z" />
        <path className="line"
          d="M0,42 C20,40 40,36 60,30 C80,24 100,20 120,14 C140,10 160,6 180,4 L195,2" />
        <circle className="pt" cx="195" cy="2" r="3" />
      </svg>
      <div className="preview__foot">
        <span className="pos">+2.1%</span> · vs microciclo 11
      </div>
    </div>
  );
}

function EntrenamientosPreview({ active }: { active: boolean }) {
  return (
    <div className={`preview preview--entrenamientos p-train ${active ? "is-playing" : ""}`}>
      <div className="preview__head">
        <span>sesión 04 · hoy</span>
        <span className="status" style={{ color: "#B08BFF" }}>● live</span>
      </div>
      <div className="bars">
        <div className="bar" />
        <div className="bar" />
        <div className="bar current" />
        <div className="bar" />
      </div>
      <div className="labels">
        <span>S1</span><span>S2</span><span>S3</span><span>S4</span>
      </div>
      <div className="preview__foot">
        banca inclinada · <span className="vio">4×8</span> · rir 2
      </div>
    </div>
  );
}

function NutricionPreview({ active }: { active: boolean }) {
  return (
    <div className={`preview preview--nutricion p-nut ${active ? "is-playing" : ""}`}>
      <div className="preview__head">
        <span>adherencia · hoy</span>
        <span className="status" style={{ color: "#5FF7B0" }}>● sync</span>
      </div>
      <div className="ring-row">
        <div className="ring">
          <svg viewBox="0 0 64 64">
            <circle className="track" cx="32" cy="32" r="28" />
            <circle className="fill" cx="32" cy="32" r="28" transform="rotate(-90 32 32)" />
          </svg>
          <div className="pct">94%</div>
        </div>
        <div className="macros">
          <div className="macro p"><span className="mlabel">P</span><span className="track" /></div>
          <div className="macro c"><span className="mlabel">C</span><span className="track" /></div>
          <div className="macro f"><span className="mlabel">F</span><span className="track" /></div>
        </div>
      </div>
      <div className="preview__foot">
        <span className="pos">2 340 kcal</span> · target 2 400
      </div>
    </div>
  );
}

function RedNeuronalPreview({ active }: { active: boolean }) {
  return (
    <div className={`preview preview--red-neuronal p-neural ${active ? "is-playing" : ""}`}>
      <div className="preview__head">
        <span>red neuronal · activa</span>
        <span className="status" style={{ color: "#7DF3FF" }}>● 127 señales</span>
      </div>
      <svg viewBox="0 0 220 100" preserveAspectRatio="xMidYMid meet">
        <path className="link l1" d="M30,20 C80,25 130,30 180,25" />
        <path className="link l2" d="M30,20 C80,45 130,55 180,50" />
        <path className="link l3" d="M30,50 C80,30 130,25 180,25" />
        <path className="link l4" d="M30,50 C80,55 130,50 180,50" />
        <path className="link l5" d="M30,50 C80,70 130,75 180,75" />
        <path className="link l6" d="M30,80 C80,70 130,55 180,50" />
        <path className="link l7" d="M30,80 C80,80 130,78 180,75" />
        <circle className="node n1" cx="30" cy="20" r="4" />
        <circle className="node n2" cx="30" cy="50" r="4" />
        <circle className="node n3" cx="30" cy="80" r="4" />
        <circle className="node n4" cx="105" cy="35" r="3.5" />
        <circle className="node n5" cx="105" cy="65" r="3.5" />
        <circle className="node n6" cx="180" cy="25" r="4" />
        <circle className="node n7" cx="180" cy="50" r="4" />
        <circle className="node n8" cx="180" cy="75" r="4" />
      </svg>
      <div className="preview__foot">
        latencia <span className="pos">3 ms</span> · ajuste automático
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ESTILOS
   ════════════════════════════════════════════════════════════ */

const styles = `
.neo-stage{
  position:relative; width:100vw; height:100dvh; overflow:hidden;
  background:
    radial-gradient(ellipse 70% 50% at 50% 50%, rgba(95,168,255,0.04), transparent 70%),
    radial-gradient(ellipse at center, #0A0B10 0%, #000 100%);
  font-family: 'Geist', system-ui, -apple-system, sans-serif;
  color: #F2F3F5;
  --void:#000; --ink:#05060A; --panel:rgba(10,12,18,0.82);
  --line:rgba(255,255,255,0.08); --line-2:rgba(255,255,255,0.15);
  --fg:#F2F3F5; --fg-dim:#8C92A0; --fg-mute:#4E535F;
  --accent:#5FA8FF; --cyan:#7DF3FF; --green:#5FF7B0; --amber:#FFB547; --violet:#B08BFF;
  --mono:'Geist Mono', ui-monospace, monospace;
  --ease: cubic-bezier(.2,.7,.2,1);
  --logo-x: 50%; --logo-y: 53%;
  --robot-x: -8%; --robot-scale: 1.1;
}
.neo-stage::before{
  content:""; position:absolute; inset:0; opacity:.04; mix-blend-mode:overlay; z-index:1; pointer-events:none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
.neo-stage::after{
  content:""; position:absolute; inset:0; z-index:2; pointer-events:none;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%);
}
.neo-loader{
  position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
}
.neo-loader::after{
  content:""; width:22px; height:22px; border-radius:50%;
  border:1px solid rgba(255,255,255,0.15); border-top-color:rgba(255,255,255,0.6);
  animation: neoSpin 1s linear infinite;
}
@keyframes neoSpin{ to{ transform: rotate(360deg) } }

.neo-scene{
  position:absolute; inset:0; z-index:3;
  opacity:0; animation: neoFade 1.8s var(--ease) .3s forwards;
}
.neo-scene > div:first-child,
.neo-scene canvas,
.neo-scene iframe{
  transform: translateX(var(--robot-x)) scale(var(--robot-scale));
  transform-origin: center center;
}

.neo-spline-mask{
  position:absolute; bottom:0; right:0;
  width:160px; height:52px; z-index:4; pointer-events:none;
  background: radial-gradient(ellipse at 70% 70%, #000 30%, transparent 75%);
}

.neo-chest-logo{
  position:absolute; top: var(--logo-y); left: var(--logo-x);
  transform: translate(-50%,-50%); z-index: 5; pointer-events:none;
  font-weight: 800; font-size: 13px; letter-spacing: 0.22em;
  color: rgba(255,255,255,0.7);
  mix-blend-mode: plus-lighter;
  text-shadow: 0 0 1px rgba(255,255,255,0.4), 0 0 10px rgba(95,168,255,0.35);
  opacity: 0;
  animation: neoLogoIn 1.4s var(--ease) 1.6s forwards, neoLogoBreath 4s ease-in-out 3s infinite;
}
.neo-chest-logo::before, .neo-chest-logo::after{
  content:""; display:inline-block;
  width: 8px; height: 1px; background: rgba(255,255,255,0.5);
  vertical-align: middle; margin: 0 6px;
}
@keyframes neoLogoIn     { from{opacity:0; letter-spacing:.5em} to{opacity:.75; letter-spacing:.22em} }
@keyframes neoLogoBreath { 0%,100%{opacity:.7} 50%{opacity:.9} }
@keyframes neoFade       { to{ opacity:1 } }

/* ─── orbit buttons ─────────────────── */
.orbit{
  position:absolute; z-index:10; padding:0; background:none; border:0; cursor:pointer;
  opacity:0; transform: translateY(6px);
  animation: neoOrbitIn .9s var(--ease) forwards;
  font-family: inherit;
}
.orbit--progreso       { top: 12%; left: 50%; transform: translateX(-50%); animation-delay: 2.0s }
.orbit--entrenamientos { top: 44%; left: 7%;                               animation-delay: 2.15s }
.orbit--nutricion      { top: 44%; right: 7%;                              animation-delay: 2.30s }
.orbit--red-neuronal   { top: 76%; left: 50%; transform: translateX(-50%); animation-delay: 2.45s }
@keyframes neoOrbitIn{ to{ opacity:1; transform: translateX(var(--trx, 0)) translateY(0) } }

.orbit--progreso,
.orbit--red-neuronal{ --trx: -50% }

.pill{
  position:relative; display:inline-flex; align-items:center; gap:8px;
  padding: 9px 16px 9px 14px;
  border-radius: 999px;
  font-family: var(--mono); font-size: 10.5px; letter-spacing: .16em;
  text-transform: uppercase; color: var(--fg);
  background: rgba(10,12,18,0.8);
  border: 1px solid rgba(255,255,255,0.10);
  overflow: hidden; isolation: isolate;
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  white-space: nowrap; transition: all .35s var(--ease);
  box-shadow: 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
}
.pill::before{
  content:""; position:absolute; top:0; left:-60%;
  width: 60%; height:100%;
  background: linear-gradient(90deg, transparent 0%, rgba(95,168,255,0.15) 25%, rgba(125,243,255,0.75) 50%, rgba(95,168,255,0.15) 75%, transparent 100%);
  filter: blur(2px);
  animation: neoSweep 3.2s linear infinite;
  animation-delay: var(--laser-delay, 0s);
  pointer-events:none; z-index: 1;
}
@keyframes neoSweep{
  0%      { transform: translateX(0%)   }
  55%,100%{ transform: translateX(320%) }
}
.pill > *{ position:relative; z-index: 2 }
.pill .dot{ width: 5px; height: 5px; border-radius: 50% }

.orbit:hover .pill,
.orbit.is-active .pill{
  transform: translateY(-2px) scale(1.04);
  border-color: rgba(255,255,255,0.22);
  background: rgba(18,21,28,0.9);
  box-shadow:
    0 14px 38px rgba(0,0,0,0.55),
    0 0 0 1px rgba(95,168,255,0.25),
    inset 0 1px 0 rgba(255,255,255,0.08);
}

/* ─── preview ───────────────── */
.preview{
  position:absolute; min-width: 210px; max-width: 260px;
  padding: 13px 14px 12px; border-radius: 12px;
  background: linear-gradient(180deg, rgba(18,21,28,0.94) 0%, rgba(8,10,14,0.94) 100%);
  border: 1px solid var(--line-2);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(95,168,255,0.08), inset 0 1px 0 rgba(255,255,255,0.04);
  opacity: 0; pointer-events: none;
  transition: opacity .35s var(--ease), transform .35s var(--ease);
  z-index: 11; text-align:left;
}
.preview::before{
  content:""; position:absolute; top:-1px; left:14px; right:14px; height:1px;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent);
}
.orbit:hover .preview,
.orbit.is-active .preview{ opacity: 1; pointer-events: auto }

.preview__head{
  display:flex; align-items:center; justify-content:space-between;
  font-family: var(--mono); font-size: 9.5px; letter-spacing: .18em;
  text-transform: uppercase; color: var(--fg-mute); margin-bottom: 10px;
}
.preview__head .status{ font-size: 9px; color: var(--accent) }
.preview__foot{
  font-family: var(--mono); font-size: 10px; letter-spacing: .05em;
  color: var(--fg-dim); margin-top: 10px; padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.preview__foot .pos{ color: var(--green) }
.preview__foot .vio{ color: var(--violet) }

/* Posiciones preview */
.preview--progreso{ top: calc(100% + 12px); left: 50%; transform: translate(-50%, 6px) }
.orbit--progreso:hover .preview, .orbit--progreso.is-active .preview{ transform: translate(-50%, 0) }

.preview--entrenamientos{ left: calc(100% + 14px); top: 50%; transform: translate(6px, -50%) }
.orbit--entrenamientos:hover .preview, .orbit--entrenamientos.is-active .preview{ transform: translate(0, -50%) }

.preview--nutricion{ right: calc(100% + 14px); top: 50%; transform: translate(-6px, -50%) }
.orbit--nutricion:hover .preview, .orbit--nutricion.is-active .preview{ transform: translate(0, -50%) }

.preview--red-neuronal{ bottom: calc(100% + 12px); left: 50%; transform: translate(-50%, -6px) }
.orbit--red-neuronal:hover .preview, .orbit--red-neuronal.is-active .preview{ transform: translate(-50%, 0) }

/* ─── p-progreso ─── */
.p-progreso{ min-width: 230px }
.p-progreso .value{ font-family: var(--mono); font-weight: 600; font-size: 26px; letter-spacing: -0.02em; color: var(--fg); margin-bottom: 6px; display: inline-flex; align-items: baseline; gap: 3px }
.p-progreso .value .unit{ font-size: 13px; color: var(--fg-mute); font-weight: 500 }
.p-progreso svg{ width: 100%; height: 48px; display:block }
.p-progreso .line{
  fill:none; stroke: var(--accent); stroke-width: 1.5;
  stroke-linecap: round; stroke-linejoin: round;
  stroke-dasharray: 240; stroke-dashoffset: 240;
  filter: drop-shadow(0 0 5px rgba(95,168,255,0.5));
}
.p-progreso .fill{ opacity: 0 }
.p-progreso .pt{ fill: var(--accent); filter: drop-shadow(0 0 6px var(--accent)); opacity: 0 }

.orbit--progreso:hover .p-progreso .line,
.orbit--progreso.is-active .p-progreso .line{ animation: neoDrawLine 1.4s var(--ease) .15s forwards }
.orbit--progreso:hover .p-progreso .fill,
.orbit--progreso.is-active .p-progreso .fill{ animation: neoFadeIn .7s var(--ease) 1.3s forwards }
.orbit--progreso:hover .p-progreso .pt,
.orbit--progreso.is-active .p-progreso .pt{ animation: neoPointIn .5s var(--ease) 1.4s forwards, neoPulseDot 1.6s ease-in-out 2s infinite }

@keyframes neoDrawLine { to{ stroke-dashoffset: 0 } }
@keyframes neoFadeIn   { to{ opacity: .45 } }
@keyframes neoPointIn  { to{ opacity: 1 } }
@keyframes neoPulseDot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.6);opacity:.4} }

/* ─── p-train ─── */
.p-train .bars{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; align-items: end; height: 56px; margin-bottom: 4px }
.p-train .bar{ position: relative; width: 100%; height: 100%; background: rgba(255,255,255,0.04); border-radius: 4px; overflow: hidden }
.p-train .bar::after{ content:""; position: absolute; left:0; right:0; bottom:0; height: 0;
  background: linear-gradient(180deg, var(--violet) 0%, rgba(176,139,255,0.4) 100%);
  box-shadow: 0 -2px 10px rgba(176,139,255,0.5); border-radius: inherit;
}
.orbit--entrenamientos:hover .p-train .bar::after,
.orbit--entrenamientos.is-active .p-train .bar::after{ animation: neoBarGrow 1s var(--ease) forwards }
.p-train .bar:nth-child(1)::after{ animation-delay: .1s; --h: 65% }
.p-train .bar:nth-child(2)::after{ animation-delay: .25s; --h: 82% }
.p-train .bar:nth-child(3)::after{ animation-delay: .40s; --h: 92% }
.p-train .bar:nth-child(4)::after{ animation-delay: .55s; --h: 74% }

.p-train .bar.current{ border: 1px solid rgba(176,139,255,0.4) }
.p-train .bar.current::before{
  content:""; position:absolute; top: 4px; right: 4px;
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--violet); box-shadow: 0 0 8px var(--violet);
  animation: neoPulseDot 1.6s ease-in-out infinite; z-index: 1;
}
.p-train .labels{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
  font-family: var(--mono); font-size: 9px; letter-spacing: .1em; color: var(--fg-mute);
  text-align: center; margin-top: 6px; text-transform: uppercase;
}
@keyframes neoBarGrow{ to{ height: var(--h) } }

/* ─── p-nut ─── */
.p-nut{ min-width: 230px }
.p-nut .ring-row{ display: flex; align-items: center; gap: 14px; margin-bottom: 10px }
.p-nut .ring{ width: 64px; height: 64px; flex: 0 0 64px; position: relative }
.p-nut .ring svg{ width:100%; height:100% }
.p-nut .ring .track{ fill:none; stroke: rgba(255,255,255,0.06); stroke-width: 5 }
.p-nut .ring .fill{
  fill:none; stroke: var(--green); stroke-width: 5; stroke-linecap: round;
  stroke-dasharray: 176; stroke-dashoffset: 176;
  filter: drop-shadow(0 0 5px rgba(95,247,176,0.5));
}
.orbit--nutricion:hover .p-nut .ring .fill,
.orbit--nutricion.is-active .p-nut .ring .fill{ animation: neoRingFill 1.4s var(--ease) .2s forwards }
@keyframes neoRingFill{ to{ stroke-dashoffset: 10 } }

.p-nut .ring .pct{
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-family: var(--mono); font-weight: 600; font-size: 14px; color: var(--fg); opacity: 0;
}
.orbit--nutricion:hover .p-nut .ring .pct,
.orbit--nutricion.is-active .p-nut .ring .pct{ animation: neoFadeUp .6s var(--ease) 1.2s forwards }
@keyframes neoFadeUp{ from{opacity:0; transform: translateY(4px)} to{opacity:1; transform: translateY(0)} }

.p-nut .macros{ flex:1; display:flex; flex-direction:column; gap: 5px }
.p-nut .macro{ display: flex; align-items: center; gap: 8px; font-family: var(--mono); font-size: 9.5px; color: var(--fg-dim); letter-spacing: .08em; text-transform: uppercase }
.p-nut .macro .mlabel{ width: 14px }
.p-nut .macro .track{ flex: 1; height: 3px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden; position: relative }
.p-nut .macro .track::after{ content:""; position: absolute; inset: 0; width: 0; border-radius: inherit }
.p-nut .macro.p .track::after{ background: #FF9EC7 }
.p-nut .macro.c .track::after{ background: var(--cyan) }
.p-nut .macro.f .track::after{ background: var(--amber) }

.orbit--nutricion:hover .p-nut .macro.p .track::after,
.orbit--nutricion.is-active .p-nut .macro.p .track::after{ animation: neoFillBar 1s var(--ease) .4s forwards; --w: 88% }
.orbit--nutricion:hover .p-nut .macro.c .track::after,
.orbit--nutricion.is-active .p-nut .macro.c .track::after{ animation: neoFillBar 1s var(--ease) .6s forwards; --w: 72% }
.orbit--nutricion:hover .p-nut .macro.f .track::after,
.orbit--nutricion.is-active .p-nut .macro.f .track::after{ animation: neoFillBar 1s var(--ease) .8s forwards; --w: 64% }
@keyframes neoFillBar{ to{ width: var(--w) } }

/* ─── p-neural ─── */
.p-neural{ min-width: 220px }
.p-neural svg{ width: 100%; height: 110px; display: block }
.p-neural .node{ fill: rgba(10,12,18,1); stroke: var(--cyan); stroke-width: 1.2; opacity: 0;
  filter: drop-shadow(0 0 6px var(--cyan));
}
.p-neural .link{ fill: none; stroke: var(--cyan); stroke-width: 0.7;
  stroke-dasharray: 100; stroke-dashoffset: 100; opacity: 0.5;
  filter: drop-shadow(0 0 3px rgba(125,243,255,0.6));
}
.orbit--red-neuronal:hover .p-neural .node,
.orbit--red-neuronal.is-active .p-neural .node{
  animation: neoNodeIn .5s var(--ease) forwards, neoNodePulse 2.4s ease-in-out infinite;
}
.orbit--red-neuronal:hover .p-neural .link,
.orbit--red-neuronal.is-active .p-neural .link{ animation: neoDrawLink 1.2s var(--ease) forwards }

.p-neural .n1{ animation-delay: .10s, 2.0s }
.p-neural .n2{ animation-delay: .20s, 2.1s }
.p-neural .n3{ animation-delay: .30s, 2.2s }
.p-neural .n4{ animation-delay: .25s, 2.3s }
.p-neural .n5{ animation-delay: .35s, 2.4s }
.p-neural .n6{ animation-delay: .40s, 2.5s }
.p-neural .n7{ animation-delay: .50s, 2.6s }
.p-neural .n8{ animation-delay: .55s, 2.7s }

.p-neural .l1{ animation-delay: .6s }
.p-neural .l2{ animation-delay: .7s }
.p-neural .l3{ animation-delay: .8s }
.p-neural .l4{ animation-delay: .9s }
.p-neural .l5{ animation-delay: 1.0s }
.p-neural .l6{ animation-delay: 1.1s }
.p-neural .l7{ animation-delay: 1.2s }

@keyframes neoNodeIn    { to{ opacity: 1 } }
@keyframes neoNodePulse { 0%,100%{ filter: drop-shadow(0 0 6px var(--cyan)) } 50%{ filter: drop-shadow(0 0 14px var(--cyan)) } }
@keyframes neoDrawLink  { to{ stroke-dashoffset: 0; opacity: .7 } }

/* ─── CTA principal ─── */
.neo-cta{
  position: absolute; left: 50%; bottom: calc(env(safe-area-inset-bottom, 0px) + 4.5%);
  transform: translateX(-50%); z-index: 12;
  display: inline-flex; align-items: center; gap: 10px;
  padding: 14px 28px; border-radius: 999px;
  font-family: inherit; font-size: 14px; font-weight: 500; color: #05060A;
  background: linear-gradient(180deg, #ffffff 0%, #e4e7ec 100%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.7),
    0 10px 36px rgba(95,168,255,0.18),
    0 0 0 1px rgba(255,255,255,0.2);
  opacity: 0; animation: neoCtaIn 1s var(--ease) 2.7s forwards;
  transition: all .35s var(--ease); cursor: pointer; border: 0;
}
.neo-cta:hover{
  transform: translateX(-50%) translateY(-2px);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.8),
    0 16px 50px rgba(95,168,255,0.35),
    0 0 0 1px rgba(255,255,255,0.3);
}
.neo-cta__arrow{ transition: transform .35s var(--ease) }
.neo-cta:hover .neo-cta__arrow{ transform: translateX(3px) }
@keyframes neoCtaIn{ to{ opacity: 1 } }

/* ─── mobile ─── */
@media (max-width: 780px){
  .neo-stage{ --robot-x: -5%; --robot-scale: 1.15; --logo-y: 52% }
  .neo-chest-logo{ font-size: 11px; letter-spacing: .2em }
  .neo-chest-logo::before, .neo-chest-logo::after{ width: 6px; margin: 0 4px }

  .pill{ padding: 8px 13px 8px 11px; font-size: 9.5px; letter-spacing: .14em }
  .pill .dot{ width: 4px; height: 4px }

  .orbit--progreso       { top: 6% }
  .orbit--entrenamientos { top: 30%; left: 4% }
  .orbit--nutricion      { top: 30%; right: 4% }
  .orbit--red-neuronal   { top: auto; bottom: 18% }

  .preview{ min-width: 180px; max-width: 210px; padding: 11px 12px 10px }

  .preview--progreso{ top: calc(100% + 10px) }
  .preview--entrenamientos{ left: 0; top: calc(100% + 10px); transform: translate(0, 6px) }
  .orbit--entrenamientos:hover .preview, .orbit--entrenamientos.is-active .preview{ transform: translate(0, 0) }
  .preview--nutricion{ right: 0; top: calc(100% + 10px); transform: translate(0, 6px) }
  .orbit--nutricion:hover .preview, .orbit--nutricion.is-active .preview{ transform: translate(0, 0) }
  .preview--red-neuronal{ bottom: calc(100% + 10px) }

  .p-progreso .value{ font-size: 22px }
  .p-train .bars{ height: 48px }
  .p-nut .ring{ width: 54px; height: 54px; flex: 0 0 54px }
  .p-neural svg{ height: 95px }

  .neo-cta{ padding: 13px 24px; font-size: 13.5px; bottom: calc(env(safe-area-inset-bottom, 0px) + 3.5%) }
}

@media (max-width: 380px){
  .pill{ padding: 7px 11px 7px 10px; font-size: 9px }
  .preview{ min-width: 160px; max-width: 190px }
  .p-progreso .value{ font-size: 20px }
}

@media (prefers-reduced-motion: reduce){
  .neo-stage *, .neo-stage *::before, .neo-stage *::after{
    animation-duration: .01ms !important; animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
`;
