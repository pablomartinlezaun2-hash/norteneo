import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  Box,
  Camera,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  Focus,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PART_GROUPS,
  PARTS,
  PARTS_BY_ID,
  VARIANTS,
  bootFloorY,
  type BootVariant,
  type PartGroupId,
  type PartId,
} from "./catalog";
import { KangooBoot } from "./KangooBootModel";
import { PostFX } from "./PostFX";

export interface KangooBootViewerProps {
  className?: string;
  /** Id de variante inicial (ver VARIANTS en catalog.ts). */
  initialVariant?: string;
  /** Oculta el panel de controles (p. ej. para incrustar en una ficha de producto). */
  hideControls?: boolean;
  /** Valor inicial de despiece 0–1. */
  initialExplode?: number;
  /** Muestra los botones de descarga (PNG / GLB). */
  allowDownloads?: boolean;
}

const CAMERA_START = new THREE.Vector3(6.6, 2.6, 8.2);

/* ------------------------------------------------------------------ */
/* Escena                                                              */
/* ------------------------------------------------------------------ */

function StudioLights({ accent, studio }: { accent: string; studio: boolean }) {
  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight
        position={[4, 9, 5]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={1}
        shadow-camera-far={30}
      />
      <spotLight
        position={[-4, 6, -6]}
        angle={0.5}
        penumbra={1}
        intensity={studio ? 4 : 18}
        color={accent}
        distance={20}
      />
      <Environment resolution={512} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 7, 0]} scale={[12, 8, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2.2} position={[6, 2, 4]} scale={[4, 6, 1]} color="#e9eef6" />
        <Lightformer form="rect" intensity={1.4} position={[-6, 1.5, 4]} scale={[3, 6, 1]} color="#ffffff" />
        <Lightformer
          form="rect"
          intensity={studio ? 0.2 : 0.6}
          position={[-3, 1, -7]}
          scale={[3, 6, 1]}
          color={accent}
        />
        <Lightformer form="ring" intensity={2.5} position={[3, 4, 8]} scale={2.5} />
        <Lightformer form="rect" intensity={0.6} position={[0, -6, 0]} scale={[12, 12, 1]} color="#2a2420" />
      </Environment>
    </>
  );
}

function Floor({ progressRef, opacity }: { progressRef: React.MutableRefObject<number>; opacity: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.position.y = bootFloorY(progressRef.current) - 0.01;
  });
  return (
    <group ref={ref}>
      <ContactShadows opacity={opacity} scale={14} blur={2.6} far={4} resolution={512} color="#000000" />
    </group>
  );
}

/** Aleja suavemente la cámara durante el despiece y recentra el objetivo. */
function CameraRig({
  explode,
  controls,
  resetSignal,
}: {
  explode: number;
  controls: React.MutableRefObject<OrbitControlsImpl | null>;
  resetSignal: number;
}) {
  const { camera, size } = useThree();
  const active = useRef(true);
  const reset = useRef(false);

  useEffect(() => {
    active.current = true;
  }, [explode]);
  useEffect(() => {
    if (resetSignal > 0) {
      reset.current = true;
      active.current = true;
    }
  }, [resetSignal]);
  // Si el usuario mueve la cámara, deja de animarla.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const stop = () => {
      active.current = false;
      reset.current = false;
    };
    c.addEventListener("start", stop);
    return () => c.removeEventListener("start", stop);
  }, [controls]);

  const tmpTarget = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const c = controls.current;
    if (!c || !active.current) return;
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 3.5);
    // Distancia que encaja el modelo (montado o despiezado) en el encuadre.
    const t = Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov / 2));
    const aspect = size.width / Math.max(1, size.height);
    const h = THREE.MathUtils.lerp(4.9, 9.8, explode);
    const w = THREE.MathUtils.lerp(3.8, 6.4, explode);
    const dist = Math.max(h / 2 / t, w / 2 / (t * aspect)) * 1.1;
    tmpTarget.set(0, THREE.MathUtils.lerp(0, -0.55, explode), 0);
    c.target.lerp(tmpTarget, k);
    const dir = reset.current ? CAMERA_START.clone().normalize() : camera.position.clone().sub(c.target).normalize();
    const want = c.target.clone().addScaledVector(dir, dist);
    camera.position.lerp(want, k);
    c.update();
    if (camera.position.distanceTo(want) < 0.01 && c.target.distanceTo(tmpTarget) < 0.005) {
      active.current = false;
      reset.current = false;
    }
  });
  return null;
}

/* ------------------------------------------------------------------ */
/* UI                                                                  */
/* ------------------------------------------------------------------ */

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1 text-sm text-white/80">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-[var(--kj-accent)]" : "bg-white/15",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  );
}

function IconButton({
  onClick,
  title,
  children,
  active,
}: {
  onClick: () => void;
  title: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border text-xs font-medium transition-colors",
        active
          ? "border-[var(--kj-accent)] bg-[var(--kj-accent)]/15 text-white"
          : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}

function download(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}

/* ------------------------------------------------------------------ */
/* Visor                                                               */
/* ------------------------------------------------------------------ */

export default function KangooBootViewer({
  className,
  initialVariant = "negro-naranja",
  hideControls = false,
  initialExplode = 0,
  allowDownloads = true,
}: KangooBootViewerProps) {
  const [variantId, setVariantId] = useState(initialVariant);
  const variant: BootVariant = useMemo(() => VARIANTS.find((v) => v.id === variantId) ?? VARIANTS[0], [variantId]);
  const [explode, setExplode] = useState(initialExplode);
  const [selected, setSelected] = useState<PartId | null>(null);
  const [hovered, setHovered] = useState<PartId | null>(null);
  const [hidden, setHidden] = useState<Set<PartId>>(() => new Set());
  const [isolate, setIsolate] = useState(false);
  const [guides, setGuides] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  // Por defecto, estudio claro como las fotos de producto.
  const [studio, setStudio] = useState(true);
  // Sombreado realista (oclusión ambiental): desactivado en táctiles de gama baja.
  const [hq, setHq] = useState(() => typeof window === "undefined" || !window.matchMedia("(pointer: coarse)").matches);
  const [panelOpen, setPanelOpen] = useState(
    () => typeof window === "undefined" || window.matchMedia("(min-width: 640px)").matches,
  );
  const [resetSignal, setResetSignal] = useState(0);

  const controls = useRef<OrbitControlsImpl | null>(null);
  const progressRef = useRef(0);
  const bootRef = useRef<THREE.Group>(null);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  const toggleHidden = useCallback((id: PartId) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectPart = useCallback((id: PartId | null) => {
    setSelected((prev) => (prev === id ? null : id));
  }, []);

  const exportGLB = useCallback(() => {
    const obj = bootRef.current;
    if (!obj) return;
    const toggled: THREE.Object3D[] = [];
    obj.traverse((o) => {
      if (o.userData.noExport && o.visible) {
        o.visible = false;
        toggled.push(o);
      }
    });
    new GLTFExporter().parse(
      obj,
      (res) => {
        toggled.forEach((o) => (o.visible = true));
        const blob = new Blob([res as ArrayBuffer], { type: "model/gltf-binary" });
        const url = URL.createObjectURL(blob);
        download(url, `kangoo-jumps-kjxr3-${variant.id}.glb`);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      },
      (err) => {
        toggled.forEach((o) => (o.visible = true));
        console.error("Error exportando GLB", err);
      },
      { binary: true, onlyVisible: true },
    );
  }, [variant.id]);

  const screenshot = useCallback(() => {
    const gl = glRef.current;
    if (!gl) return;
    download(gl.domElement.toDataURL("image/png"), `kangoo-jumps-kjxr3-${variant.id}.png`);
  }, [variant.id]);

  const sel = selected ? PARTS_BY_ID[selected] : null;
  const grouped = useMemo(() => {
    const g = new Map<PartGroupId, typeof PARTS>();
    PARTS.forEach((p) => g.set(p.group, [...(g.get(p.group) ?? []), p]));
    return [...g.entries()];
  }, []);

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden bg-[#070707] text-white", className)}
      style={
        {
          "--kj-accent": variant.accent,
          backgroundImage: studio
            ? "radial-gradient(ellipse 75% 60% at 50% 40%, #ffffff 0%, #eeeeee 55%, #cfcfd1 100%)"
            : `radial-gradient(ellipse 70% 55% at 50% 42%, ${variant.accent}26 0%, #120d09 45%, #050505 100%)`,
        } as React.CSSProperties
      }
    >
      <div className={cn("absolute inset-0", !hideControls && "lg:right-[22.5rem]")}>
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: CAMERA_START.toArray(), fov: 32, near: 0.1, far: 100 }}
          gl={{
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
          onCreated={({ gl }) => {
            glRef.current = gl;
          }}
          onPointerMissed={(e) => {
            if (e.type === "click") setSelected(null);
          }}
        >
          <Suspense fallback={null}>
            <StudioLights accent={variant.accent} studio={studio} />
            <KangooBoot
              ref={bootRef}
              variant={variant}
              explode={explode}
              selected={selected}
              hovered={hovered}
              hidden={hidden}
              isolate={isolate}
              guides={guides}
              onHover={setHovered}
              onSelect={selectPart}
              progressRef={progressRef}
            />
            <Floor progressRef={progressRef} opacity={studio ? 0.55 : 0.75} />
          </Suspense>
          <OrbitControls
            ref={controls}
            makeDefault
            enableDamping
            dampingFactor={0.08}
            autoRotate={autoRotate}
            autoRotateSpeed={0.7}
            minDistance={2.5}
            maxDistance={26}
            target={[0, 0, 0]}
          />
          <CameraRig explode={explode} controls={controls} resetSignal={resetSignal} />
          <PostFX ao={hq} />
        </Canvas>
      </div>

      {/* Cabecera */}
      <div className="pointer-events-none absolute left-4 top-4 max-w-[60%] sm:left-6 sm:top-6">
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.2em]",
            studio ? "text-black/50" : "text-white/50",
          )}
        >
          Kangoo Jumps
        </p>
        <h1
          className="text-3xl font-black italic leading-none tracking-tight sm:text-5xl"
          style={{ color: variant.accent }}
        >
          KJXR3
        </h1>
        <p className={cn("mt-1 text-sm font-medium sm:text-base", studio ? "text-black/75" : "text-white/80")}>
          {variant.name}
        </p>
        <p className={cn("mt-2 hidden text-xs sm:block", studio ? "text-black/45" : "text-white/40")}>
          Arrastra para girar · rueda o pellizco para zoom · clic en una pieza para ver su detalle
        </p>
      </div>

      {/* Etiqueta de hover */}
      {hovered && hovered !== selected && (
        <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-xs font-medium backdrop-blur">
          {PARTS_BY_ID[hovered].name}
        </div>
      )}

      {/* Ficha de la pieza seleccionada */}
      {sel && (
        <div className="absolute bottom-4 left-4 w-[min(340px,calc(100%-2rem))] rounded-2xl border border-white/10 bg-black/70 p-4 shadow-2xl backdrop-blur-md sm:bottom-6 sm:left-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: variant.accent }}>
                {PART_GROUPS[sel.group]}
              </p>
              <h2 className="text-lg font-bold leading-tight">{sel.name}</h2>
            </div>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setSelected(null)}
              className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-white/75">{sel.description}</p>
          <p className="mt-2 text-xs text-white/50">
            <span className="font-semibold text-white/70">Material:</span> {sel.material}
          </p>
          <div className="mt-3 flex gap-2">
            <IconButton title="Aislar" onClick={() => setIsolate((v) => !v)} active={isolate}>
              <Focus className="h-3.5 w-3.5" /> {isolate ? "Mostrar todo" : "Aislar"}
            </IconButton>
            <IconButton title="Ocultar" onClick={() => toggleHidden(sel.id)}>
              {hidden.has(sel.id) ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {hidden.has(sel.id) ? "Mostrar" : "Ocultar"}
            </IconButton>
          </div>
        </div>
      )}

      {/* Panel de control */}
      {!hideControls && (
        <aside
          className={cn(
            "absolute z-10 flex flex-col overflow-hidden border border-white/10 bg-black/60 shadow-2xl backdrop-blur-xl transition-[max-height]",
            "inset-x-2 bottom-2 rounded-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-6 sm:w-80",
            panelOpen ? "max-h-[48vh] sm:max-h-none" : "max-h-12 sm:max-h-12",
            sel && "max-sm:hidden",
          )}
        >
          <button
            type="button"
            onClick={() => setPanelOpen((v) => !v)}
            className="flex h-12 shrink-0 items-center justify-between px-4 text-sm font-semibold"
          >
            <span className="flex items-center gap-2">
              <Wrench className="h-4 w-4" style={{ color: variant.accent }} /> Configurador 3D
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", !panelOpen && "rotate-180")} />
          </button>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pb-4">
            <Section title="Color" icon={<Box className="h-3.5 w-3.5" />}>
              <div className="flex flex-wrap gap-2">
                {VARIANTS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    title={v.name}
                    aria-label={v.name}
                    onClick={() => setVariantId(v.id)}
                    className={cn(
                      "relative h-9 w-9 overflow-hidden rounded-full border-2 transition-transform hover:scale-110",
                      v.id === variant.id ? "border-white" : "border-white/15",
                    )}
                    style={{
                      background: `linear-gradient(135deg, ${v.shell} 0 55%, ${v.accent} 55% 100%)`,
                    }}
                  />
                ))}
              </div>
            </Section>

            <Section title="Despiece" icon={<Layers className="h-3.5 w-3.5" />}>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(explode * 100)}
                  onChange={(e) => setExplode(Number(e.target.value) / 100)}
                  aria-label="Nivel de despiece"
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[var(--kj-accent)]"
                />
                <span className="w-10 text-right text-xs tabular-nums text-white/60">{Math.round(explode * 100)}%</span>
              </div>
              <div className="flex gap-2">
                <IconButton title="Montar" onClick={() => setExplode(0)} active={explode === 0}>
                  Montar
                </IconButton>
                <IconButton title="Desmontar" onClick={() => setExplode(1)} active={explode === 1}>
                  Desmontar
                </IconButton>
              </div>
            </Section>

            <Section title="Piezas" icon={<Wrench className="h-3.5 w-3.5" />}>
              <div className="space-y-3">
                {grouped.map(([g, parts]) => (
                  <div key={g}>
                    <p className="mb-1 text-[11px] font-medium text-white/40">{PART_GROUPS[g]}</p>
                    <ul className="space-y-0.5">
                      {parts.map((p) => (
                        <li key={p.id} className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => selectPart(p.id)}
                            onMouseEnter={() => setHovered(p.id)}
                            onMouseLeave={() => setHovered(null)}
                            className={cn(
                              "flex-1 truncate rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                              selected === p.id ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/5",
                              hidden.has(p.id) && "text-white/30 line-through",
                            )}
                          >
                            {p.name}
                          </button>
                          <button
                            type="button"
                            aria-label={hidden.has(p.id) ? `Mostrar ${p.name}` : `Ocultar ${p.name}`}
                            onClick={() => toggleHidden(p.id)}
                            className="rounded-md p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                          >
                            {hidden.has(p.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {hidden.size > 0 && (
                <button
                  type="button"
                  onClick={() => setHidden(new Set())}
                  className="text-xs font-medium text-white/60 underline-offset-2 hover:text-white hover:underline"
                >
                  Mostrar todas las piezas
                </button>
              )}
            </Section>

            <Section title="Vista" icon={<Eye className="h-3.5 w-3.5" />}>
              <Toggle label="Aislar pieza seleccionada" checked={isolate} onChange={setIsolate} />
              <Toggle label="Líneas guía de despiece" checked={guides} onChange={setGuides} />
              <Toggle label="Fondo de estudio claro" checked={studio} onChange={setStudio} />
              <Toggle label="Sombreado realista (oclusión)" checked={hq} onChange={setHq} />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <IconButton title="Auto-rotación" onClick={() => setAutoRotate((v) => !v)} active={autoRotate}>
                  {autoRotate ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} Girar
                </IconButton>
                <IconButton title="Restablecer vista" onClick={() => setResetSignal((n) => n + 1)}>
                  <RotateCcw className="h-3.5 w-3.5" /> Vista
                </IconButton>
                {allowDownloads && (
                  <>
                    <IconButton title="Captura PNG" onClick={screenshot}>
                      <Camera className="h-3.5 w-3.5" /> PNG
                    </IconButton>
                    <IconButton title="Exportar modelo GLB" onClick={exportGLB}>
                      <Download className="h-3.5 w-3.5" /> GLB
                    </IconButton>
                  </>
                )}
              </div>
            </Section>
          </div>
        </aside>
      )}
    </div>
  );
}
