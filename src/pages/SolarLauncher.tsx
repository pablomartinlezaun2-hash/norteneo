import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

type TabId = "entrenamientos" | "progreso" | "nutricion" | "perfil" | "disenar";

interface SolarTab {
  id: TabId;
  label: string;
  emoji: string;
  color: string;
  glow: string;
  orbit: number;
  initialAngle: number;
  speed: number;
  route: string;
  tabKey: string;
}

const TABS: SolarTab[] = [
  { id: "entrenamientos", label: "Entrenamientos", emoji: "💪", color: "#FF6B6B", glow: "#FF6B6B", orbit: 145, initialAngle: 0,   speed: 0.4,  route: "/", tabKey: "workouts" },
  { id: "progreso",       label: "Progreso",       emoji: "📈", color: "#4FC3F7", glow: "#4FC3F7", orbit: 210, initialAngle: 72,  speed: 0.25, route: "/", tabKey: "progress" },
  { id: "nutricion",      label: "Nutrición",      emoji: "🥗", color: "#81C784", glow: "#81C784", orbit: 165, initialAngle: 144, speed: 0.35, route: "/", tabKey: "nutrition" },
  { id: "perfil",         label: "Perfil",         emoji: "👤", color: "#CE93D8", glow: "#CE93D8", orbit: 240, initialAngle: 216, speed: 0.2,  route: "/", tabKey: "profile" },
  { id: "disenar",        label: "Diseñar",        emoji: "✨", color: "#FFD54F", glow: "#FFD54F", orbit: 185, initialAngle: 288, speed: 0.3,  route: "/", tabKey: "design" },
];

const STAR_COUNT = 180;

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleDelay: number;
}

function generateStars(): Star[] {
  return Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    opacity: Math.random() * 0.7 + 0.2,
    twinkleDelay: Math.random() * 4,
  }));
}

const NEBULAS = [
  { top: "10%", left: "5%",  w: 300, h: 200, color: "#7c3aed" },
  { top: "60%", left: "55%", w: 260, h: 180, color: "#0ea5e9" },
  { top: "30%", left: "65%", w: 200, h: 140, color: "#ec4899" },
];

export default function SolarLauncher() {
  const navigate = useNavigate();
  const stars = useMemo(generateStars, []);
  const [angles, setAngles] = useState<number[]>(() => TABS.map(t => t.initialAngle));
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<TabId | null>(null);
  const [activeId, setActiveId] = useState<TabId>("entrenamientos");
  const [dimensions, setDimensions] = useState({ w: 400, h: 700 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Orbital animation
  useEffect(() => {
    const update = (ts: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = ts;
      const delta = (ts - lastTimeRef.current) / 1000;
      lastTimeRef.current = ts;
      setAngles(prev => prev.map((a, i) => (a + TABS[i].speed * delta * 30) % 360));
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Resize
  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        setDimensions({
          w: containerRef.current.offsetWidth,
          h: containerRef.current.offsetHeight,
        });
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setMouseOffset({ x: dx * 28, y: dy * 18 });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !touch) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (touch.clientX - cx) / (rect.width / 2);
    const dy = (touch.clientY - cy) / (rect.height / 2);
    setMouseOffset({ x: dx * 28, y: dy * 18 });
  }, []);

  // Device orientation (móvil)
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      const gamma = Math.max(-30, Math.min(30, e.gamma || 0));
      const beta = Math.max(-30, Math.min(30, (e.beta || 0) - 30));
      setMouseOffset({ x: (gamma / 30) * 28, y: (beta / 30) * 18 });
    };
    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, []);

  const cx = dimensions.w / 2;
  const cy = dimensions.h / 2;

  const planetPositions = TABS.map((tab, i) => {
    const rad = (angles[i] * Math.PI) / 180;
    const x = cx + Math.cos(rad) * tab.orbit + mouseOffset.x * (tab.orbit / 200);
    const y = cy + Math.sin(rad) * tab.orbit * 0.45 + mouseOffset.y * (tab.orbit / 300);
    return { ...tab, x, y };
  });

  const handlePlanetClick = (id: TabId) => {
    setActiveId(id);
    const tab = TABS.find(t => t.id === id);
    if (!tab) return;
    // Persist desired tab so Index can pick it up if needed
    try { sessionStorage.setItem("neo-launcher-target", tab.tabKey); } catch { /* noop */ }
    navigate(tab.route);
  };

  const activeTab = TABS.find(t => t.id === activeId);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMouseOffset({ x: 0, y: 0 })}
      onTouchMove={handleTouchMove}
      style={{
        width: "100%",
        height: "100dvh",
        background: "radial-gradient(ellipse at 50% 40%, #0a0e2a 0%, #030510 60%, #000008 100%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Exo 2', system-ui, sans-serif",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;600;700&display=swap');
        @keyframes twinkle {
          0%, 100% { opacity: var(--base-op); transform: scale(1); }
          50% { opacity: calc(var(--base-op) * 0.3); transform: scale(0.7); }
        }
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
        }
        @keyframes core-breathe {
          0%, 100% { box-shadow: 0 0 20px 6px #ffffff33, 0 0 60px 20px #7c3aed44; transform: translate(-50%, -50%) scale(1); }
          50% { box-shadow: 0 0 30px 10px #ffffff44, 0 0 90px 30px #7c3aed66; transform: translate(-50%, -50%) scale(1.05); }
        }
        @keyframes label-appear {
          from { opacity: 0; transform: translateY(4px) translateX(-50%); }
          to { opacity: 1; transform: translateY(0) translateX(-50%); }
        }
        @keyframes nebula-drift {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.12; }
          50% { transform: scale(1.08) rotate(3deg); opacity: 0.18; }
        }
      `}</style>

      {/* Nebulas */}
      {NEBULAS.map((n, i) => (
        <div
          key={`neb-${i}`}
          style={{
            position: "absolute",
            top: n.top,
            left: n.left,
            width: n.w,
            height: n.h,
            background: `radial-gradient(ellipse, ${n.color}88, transparent 70%)`,
            filter: "blur(40px)",
            animation: `nebula-drift ${10 + i * 2}s ease-in-out infinite`,
            animationDelay: `${i * 1.5}s`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Stars */}
      {stars.map(s => (
        <div
          key={s.id}
          style={{
            position: "absolute",
            top: `${s.y}%`,
            left: `${s.x}%`,
            width: s.size,
            height: s.size,
            background: "white",
            borderRadius: "50%",
            ["--base-op" as string]: String(s.opacity),
            opacity: s.opacity,
            animation: `twinkle ${2 + s.twinkleDelay}s ease-in-out infinite`,
            animationDelay: `${s.twinkleDelay}s`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Orbit guides */}
      {TABS.map(tab => (
        <div
          key={`orbit-${tab.id}`}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: tab.orbit * 2,
            height: tab.orbit * 0.9,
            border: `1px solid ${tab.color}15`,
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Sun core */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "radial-gradient(circle, #ffffff 0%, #ffd54f 40%, #7c3aed 100%)",
          animation: "core-breathe 4s ease-in-out infinite",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          zIndex: 5,
        }}
      >
        🏃
      </div>

      {/* Planets */}
      {planetPositions.map(p => {
        const isHovered = hoveredId === p.id;
        const isActive = activeId === p.id;
        const planetSize = isHovered || isActive ? 64 : 52;
        return (
          <div
            key={p.id}
            onMouseEnter={() => setHoveredId(p.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => handlePlanetClick(p.id)}
            style={{
              position: "absolute",
              top: p.y,
              left: p.x,
              transform: "translate(-50%, -50%)",
              cursor: "pointer",
              zIndex: 10,
              transition: "filter 0.3s",
              filter: isHovered || isActive ? "brightness(1.2)" : "brightness(1)",
            }}
          >
            {(isHovered || isActive) && [0, 1].map(i => (
              <div
                key={`ring-${i}`}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: planetSize,
                  height: planetSize,
                  borderRadius: "50%",
                  border: `2px solid ${p.glow}`,
                  animation: `pulse-ring 1.6s ease-out infinite`,
                  animationDelay: `${i * 0.8}s`,
                  pointerEvents: "none",
                }}
              />
            ))}
            <div
              style={{
                width: planetSize,
                height: planetSize,
                borderRadius: "50%",
                background: `radial-gradient(circle at 30% 30%, ${p.color}ff, ${p.color}66)`,
                boxShadow: `0 0 24px 4px ${p.glow}77, inset -4px -6px 12px #00000055`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: planetSize * 0.45,
                transition: "width 0.25s, height 0.25s, font-size 0.25s",
              }}
            >
              {p.emoji}
            </div>

            {(isHovered || isActive) && (
              <div
                style={{
                  position: "absolute",
                  top: planetSize + 6,
                  left: "50%",
                  transform: "translateX(-50%)",
                  color: p.color,
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  textShadow: `0 0 8px ${p.glow}`,
                  animation: "label-appear 0.25s ease-out",
                  letterSpacing: "0.04em",
                }}
              >
                {p.label}
              </div>
            )}
          </div>
        );
      })}

      {/* Bottom HUD */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: 18,
            color: activeTab?.color || "white",
            textShadow: `0 0 20px ${activeTab?.color || "white"}`,
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          {activeTab?.label}
        </div>
        <div style={{ display: "flex", gap: 8, pointerEvents: "auto" }}>
          {TABS.map(t => (
            <button
              key={`dot-${t.id}`}
              onClick={() => handlePlanetClick(t.id)}
              aria-label={t.label}
              style={{
                width: t.id === activeId ? 24 : 8,
                height: 8,
                borderRadius: 4,
                border: "none",
                background: t.id === activeId ? t.color : `${t.color}55`,
                boxShadow: t.id === activeId ? `0 0 12px ${t.glow}` : "none",
                cursor: "pointer",
                transition: "width 0.3s, background 0.3s",
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 24,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "#ffffff55",
          fontSize: 11,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        Mueve el ratón · Toca los planetas
      </div>
    </div>
  );
}
