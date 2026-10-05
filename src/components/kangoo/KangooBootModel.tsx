import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Decal } from "@react-three/drei";
import * as THREE from "three";
import { BOOT_Y_OFFSET, PARTS, PARTS_BY_ID, type BootVariant, type PartId } from "./catalog";
import { buildBootGeometry, disposeBootGeometry, type BootGeometry, type BuckleSpec } from "./bootGeometry";
import { createBootMaterials, disposeBootMaterials, type BootMaterials } from "./materials";
import { textDecal } from "./textures";
import { clamp01 } from "./geometry";

const HIGHLIGHT = new THREE.Color("#3fa9ff");

export interface KangooBootProps {
  variant: BootVariant;
  /** Objetivo de despiece 0 (montada) … 1 (despiece completo). */
  explode: number;
  selected?: PartId | null;
  hovered?: PartId | null;
  hidden?: ReadonlySet<PartId>;
  /** Atenúa todas las piezas salvo la seleccionada. */
  isolate?: boolean;
  /** Líneas guía punteadas entre posición montada y despiece. */
  guides?: boolean;
  onHover?: (id: PartId | null) => void;
  onSelect?: (id: PartId | null) => void;
  /** Recibe el valor de despiece animado en cada frame. */
  progressRef?: MutableRefObject<number>;
}

interface PartCtx {
  offset: [number, number, number];
  progress: MutableRefObject<number>;
}
const PartContext = createContext<PartCtx | null>(null);

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface PartState {
  selected: PartId | null;
  hovered: PartId | null;
  hidden: ReadonlySet<PartId>;
  isolate: boolean;
}

interface Registry {
  parts: Map<PartId, { group: THREE.Group; anchor: THREE.Vector3 | null }>;
}

interface PartGroupProps {
  id: PartId;
  eRef: MutableRefObject<number>;
  state: MutableRefObject<PartState>;
  registry: Registry;
  root: MutableRefObject<THREE.Group | null>;
  onHover?: (id: PartId | null) => void;
  onSelect?: (id: PartId | null) => void;
  children: ReactNode;
}

type FxMaterial = THREE.Material & {
  emissive?: THREE.Color;
  emissiveIntensity?: number;
  userData: { fxClone?: boolean; base?: { transparent: boolean; opacity: number; depthWrite: boolean } };
};

/**
 * Grupo de una pieza: aplica el desplazamiento de despiece escalonado y
 * clona los materiales de sus mallas para poder resaltarla o atenuarla sin
 * afectar al resto de piezas.
 */
function PartGroup({ id, eRef, state, registry, root, onHover, onSelect, children }: PartGroupProps) {
  const ref = useRef<THREE.Group>(null);
  const def = PARTS_BY_ID[id];
  const progress = useRef(0);
  const clones = useRef(new Map<THREE.Material, FxMaterial>());
  const ctx = useMemo<PartCtx>(() => ({ offset: def.offset, progress }), [def]);

  useEffect(() => {
    const entry = { group: ref.current!, anchor: null as THREE.Vector3 | null };
    registry.parts.set(id, entry);
    const map = clones.current;
    return () => {
      registry.parts.delete(id);
      map.forEach((m) => m.dispose());
      map.clear();
    };
  }, [id, registry]);

  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    const start = def.order * 0.45;
    const p = ease(clamp01((eRef.current - start) / 0.55));
    progress.current = p;
    g.position.set(def.offset[0] * p, def.offset[1] * p, def.offset[2] * p);

    const entry = registry.parts.get(id);
    if (entry && !entry.anchor && p === 0 && root.current) {
      const box = new THREE.Box3().setFromObject(g);
      if (!box.isEmpty()) entry.anchor = root.current.worldToLocal(box.getCenter(new THREE.Vector3()));
    }

    const s = state.current;
    g.visible = !s.hidden.has(id);
    const ghost = s.isolate && s.selected !== null && s.selected !== id;
    const hl =
      s.hovered === id && !ghost ? 0.35 : s.selected === id ? 0.16 + 0.1 * Math.sin(st.clock.elapsedTime * 4) : 0;

    g.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material || Array.isArray(mesh.material)) return;
      let mat = mesh.material as FxMaterial;
      if (!mat.userData.fxClone) {
        let c = clones.current.get(mat);
        if (!c) {
          c = mat.clone() as FxMaterial;
          c.userData = {
            fxClone: true,
            base: { transparent: mat.transparent, opacity: mat.opacity, depthWrite: mat.depthWrite },
          };
          clones.current.set(mat, c);
        }
        mesh.material = c;
        mat = c;
      }
      const base = mat.userData.base!;
      const wantTransparent = ghost || base.transparent;
      if (mat.transparent !== wantTransparent) {
        mat.transparent = wantTransparent;
        mat.needsUpdate = true;
      }
      mat.opacity = ghost ? 0.08 * base.opacity : base.opacity;
      mat.depthWrite = ghost ? false : base.depthWrite;
      if (mat.emissive) {
        mat.emissive.copy(HIGHLIGHT);
        mat.emissiveIntensity = hl;
      }
    });
  });

  const interactive = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    const s = state.current;
    return !(s.isolate && s.selected !== null && s.selected !== id) && !s.hidden.has(id) && !!e;
  };

  return (
    <group
      ref={ref}
      name={def.name}
      userData={{ partId: id }}
      onPointerOver={(e) => {
        if (!interactive(e)) return;
        e.stopPropagation();
        onHover?.(id);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        if (state.current.hovered === id) onHover?.(null);
      }}
      onClick={(e) => {
        if (!interactive(e) || e.delta > 6) return;
        e.stopPropagation();
        onSelect?.(id);
      }}
    >
      <PartContext.Provider value={ctx}>{children}</PartContext.Provider>
    </group>
  );
}

/** Sub-pieza que se separa en Z hacia el lado contrario (simetría lateral/medial). */
function MirrorPiece({ children }: { children: ReactNode }) {
  const ctx = useContext(PartContext);
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current || !ctx) return;
    ref.current.position.z = -2 * ctx.offset[2] * ctx.progress.current;
  });
  return <group ref={ref}>{children}</group>;
}

function MatrixGroup({ matrix, children }: { matrix: THREE.Matrix4; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    ref.current.matrix.copy(matrix);
    ref.current.matrix.decompose(ref.current.position, ref.current.quaternion, ref.current.scale);
  }, [matrix]);
  return <group ref={ref}>{children}</group>;
}

function Instances({
  geometry,
  material,
  matrices,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  matrices: THREE.Matrix4[];
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    matrices.forEach((mx, i) => m.setMatrixAt(i, mx));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [matrices]);
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, matrices.length]}
      geometry={geometry}
      material={material}
      castShadow
      receiveShadow
    />
  );
}

function Buckle({ spec, G, M }: { spec: BuckleSpec; G: BootGeometry; M: BootMaterials }) {
  return (
    <>
      <MatrixGroup matrix={spec.lever}>
        <mesh geometry={G.buckleBase} material={M.matteBlack} />
        <mesh geometry={G.buckleLever} material={M.smoked} />
        <mesh geometry={G.bucklePin} material={M.metal} />
      </MatrixGroup>
      <MatrixGroup matrix={spec.ladder}>
        <mesh geometry={G.ladderBase} material={M.matteBlack} />
        <mesh geometry={G.ladderTeeth} material={M.matteBlack} />
      </MatrixGroup>
      <mesh geometry={spec.wire} material={M.chrome} />
    </>
  );
}

function DecalMat({
  map,
  color,
  metal = 0,
  rough = 0.3,
}: {
  map: THREE.Texture;
  color: string;
  metal?: number;
  rough?: number;
}) {
  return (
    <meshPhysicalMaterial
      map={map}
      color={color}
      metalness={metal}
      roughness={rough}
      clearcoat={1}
      clearcoatRoughness={0.1}
      transparent
      depthWrite={false}
      polygonOffset
      polygonOffsetFactor={-6}
    />
  );
}

export const KangooBoot = forwardRef<THREE.Group, KangooBootProps>(function KangooBoot(
  {
    variant,
    explode,
    selected = null,
    hovered = null,
    hidden = new Set<PartId>(),
    isolate = false,
    guides = true,
    onHover,
    onSelect,
    progressRef,
  },
  forwarded,
) {
  const root = useRef<THREE.Group>(null);
  useImperativeHandle(forwarded, () => root.current!);

  const G = useMemo(() => buildBootGeometry(), []);
  useEffect(() => () => disposeBootGeometry(G), [G]);

  const M = useMemo(() => createBootMaterials(variant), [variant]);
  useEffect(() => () => disposeBootMaterials(M), [M]);

  const tex = useMemo(
    () => ({
      kj: textDecal("kj", "KJ", { color: "#ffffff" }),
      xr3: textDecal("xr3", "XR3", { color: "#ffffff", sub: "KANGOO JUMPS" }),
      logo: textDecal("logo", "Kangoo Jumps", {
        color: "#ffffff",
        font: `italic 700 120px Arial, sans-serif`,
        width: 1024,
        height: 256,
      }),
      brand: textDecal("brand", "KANGOO JUMPS", {
        color: "#ffffff",
        font: `900 150px Arial, sans-serif`,
        width: 1600,
        height: 256,
      }),
    }),
    [],
  );

  const eRef = useRef(0);
  const state = useRef<PartState>({ selected, hovered, hidden, isolate });
  state.current = { selected, hovered, hidden, isolate };
  const registry = useMemo<Registry>(() => ({ parts: new Map() }), []);

  // Líneas guía.
  const guideGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(PARTS.length * 6), 3));
    return g;
  }, []);
  const guideMat = useMemo(
    () =>
      new THREE.LineDashedMaterial({
        color: "#ffffff",
        dashSize: 0.08,
        gapSize: 0.06,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      }),
    [],
  );
  const guideRef = useRef<THREE.LineSegments>(null);
  useEffect(
    () => () => {
      guideGeom.dispose();
      guideMat.dispose();
    },
    [guideGeom, guideMat],
  );

  useEffect(() => {
    root.current?.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
  });

  useFrame((_, dt) => {
    const target = clamp01(explode);
    eRef.current += (target - eRef.current) * (1 - Math.exp(-dt * 2.6));
    if (Math.abs(target - eRef.current) < 1e-4) eRef.current = target;
    if (progressRef) progressRef.current = eRef.current;

    const lines = guideRef.current;
    if (!lines) return;
    const pos = guideGeom.getAttribute("position") as THREE.BufferAttribute;
    let n = 0;
    registry.parts.forEach(({ group, anchor }, id) => {
      if (!anchor || !group.visible || hidden.has(id) || group.position.lengthSq() < 1e-4) return;
      pos.setXYZ(n++, anchor.x, anchor.y, anchor.z);
      pos.setXYZ(n++, anchor.x + group.position.x, anchor.y + group.position.y, anchor.z + group.position.z);
    });
    guideGeom.setDrawRange(0, n);
    pos.needsUpdate = true;
    lines.computeLineDistances();
    lines.visible = guides && n > 0;
  });

  const common = { eRef, state, registry, root, onHover, onSelect };

  return (
    <group ref={root} position={[0, BOOT_Y_OFFSET, 0]} name="KangooJumps_KJXR3">
      <lineSegments ref={guideRef} geometry={guideGeom} material={guideMat} userData={{ noExport: true }} />

      {/* ---------------- Bota ---------------- */}
      <PartGroup id="shell" {...common}>
        <mesh geometry={G.shell} material={M.shell} />
        <mesh geometry={G.shellSole} material={M.shellSole} />
        {G.holes.map((m, i) => (
          <MatrixGroup key={i} matrix={m}>
            <mesh geometry={G.holeDisc} material={M.hole} />
            <mesh geometry={G.holeRim} material={M.shell} />
          </MatrixGroup>
        ))}
      </PartGroup>

      <PartGroup id="liner" {...common}>
        <mesh geometry={G.liner} material={M.fabric} />
      </PartGroup>

      <PartGroup id="tongue" {...common}>
        <mesh geometry={G.tongue} material={M.neoprene}>
          <Decal
            position={G.tongueLogo.position}
            rotation={G.tongueLogo.rotation}
            scale={[0.5, 0.33, 0.3]}
            depthTest
            polygonOffsetFactor={-6}
          >
            <DecalMat map={tex.kj} color="#55555e" rough={0.15} />
          </Decal>
        </mesh>
      </PartGroup>

      <PartGroup id="cuff" {...common}>
        <mesh geometry={G.cuff} material={M.shell}>
          <Decal
            position={G.cuffLogo.position}
            rotation={G.cuffLogo.rotation}
            scale={[0.34, 0.17, 0.2]}
            depthTest
            polygonOffsetFactor={-6}
          >
            <DecalMat key={variant.id} map={tex.xr3} color={variant.accent} metal={0.4} />
          </Decal>
        </mesh>
      </PartGroup>

      {/* ---------------- Cierres ---------------- */}
      <PartGroup id="strap" {...common}>
        <mesh geometry={G.strap} material={M.webbing} />
        <MatrixGroup matrix={G.strapBuckle}>
          <mesh material={M.smoked} position={[0, 0, 0.018]}>
            <boxGeometry args={[0.22, 0.17, 0.036]} />
          </mesh>
          <mesh material={M.chrome} position={[-0.115, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.2, 16]} />
          </mesh>
        </MatrixGroup>
      </PartGroup>

      <PartGroup id="cuffBuckle" {...common}>
        <Buckle spec={G.cuffBuckle} G={G} M={M} />
      </PartGroup>

      <PartGroup id="instepBuckle" {...common}>
        <Buckle spec={G.instepBuckle} G={G} M={M} />
      </PartGroup>

      <PartGroup id="rivets" {...common}>
        <MatrixGroup matrix={G.rivets[0]}>
          <mesh geometry={G.rivet} material={M.metal} />
        </MatrixGroup>
        <MirrorPiece>
          <MatrixGroup matrix={G.rivets[1]}>
            <mesh geometry={G.rivet} material={M.metal} />
          </MatrixGroup>
        </MirrorPiece>
      </PartGroup>

      {/* ---------------- Sistema de rebote ---------------- */}
      <PartGroup id="basePlate" {...common}>
        <mesh geometry={G.basePlate} material={M.matteBlack} />
      </PartGroup>

      <PartGroup id="heelWedges" {...common}>
        <mesh geometry={G.heelWedge} material={M.accent} position={[0, 0, 0.45]} />
        <MirrorPiece>
          <mesh geometry={G.heelWedge} material={M.accent} position={[0, 0, -0.505]} />
        </MirrorPiece>
      </PartGroup>

      <PartGroup id="screws" {...common}>
        {G.screws.map((m, i) => (
          <MatrixGroup key={i} matrix={m}>
            <mesh geometry={G.screwHead} material={M.metal} />
            <mesh geometry={G.screwSocket} material={M.hole} />
          </MatrixGroup>
        ))}
      </PartGroup>

      <PartGroup id="upperShell" {...common}>
        <mesh geometry={G.upperShell} material={M.springShell} />
        {G.upperHoles.map((m, i) => (
          <MatrixGroup key={i} matrix={m}>
            <mesh material={M.hole}>
              <circleGeometry args={[0.04, 24]} />
            </mesh>
          </MatrixGroup>
        ))}
      </PartGroup>

      <PartGroup id="frontClip" {...common}>
        <mesh geometry={G.clipCap} material={M.accent} />
        <mesh geometry={G.clipRibs} material={M.accent} />
        <mesh geometry={G.clipPin} material={M.metal} />
      </PartGroup>

      <PartGroup id="springs" {...common}>
        {[1, -1].map((side) => {
          const content = (
            <>
              {G.springCords
                .filter((c) => c.side === side)
                .map((c, i) => (
                  <MatrixGroup key={i} matrix={c.matrix}>
                    <mesh geometry={G.springCord} material={M.spring} />
                  </MatrixGroup>
                ))}
              {G.medallions
                .filter((c) => c.side === side)
                .map((c, i) => (
                  <MatrixGroup key={`m${i}`} matrix={c.matrix}>
                    <mesh geometry={G.medallion} material={M.accent} />
                  </MatrixGroup>
                ))}
            </>
          );
          return side === 1 ? <group key={side}>{content}</group> : <MirrorPiece key={side}>{content}</MirrorPiece>;
        })}
      </PartGroup>

      <PartGroup id="anchors" {...common}>
        {G.anchors.map((m, i) => (
          <MatrixGroup key={i} matrix={m}>
            <mesh geometry={G.anchorPost} material={M.matteBlack} />
            <mesh geometry={G.anchorPin} material={M.metal} />
          </MatrixGroup>
        ))}
      </PartGroup>

      <PartGroup id="lowerShell" {...common}>
        <mesh geometry={G.lowerShell} material={M.springShell}>
          <Decal
            position={G.lowerLogo.position}
            rotation={G.lowerLogo.rotation}
            scale={[0.62, 0.17, 0.2]}
            depthTest
            polygonOffsetFactor={-6}
          >
            <DecalMat map={tex.logo} color="#4a4a52" rough={0.5} />
          </Decal>
          <Decal
            position={G.lowerText.position}
            rotation={G.lowerText.rotation}
            scale={[1.3, 0.2, 0.2]}
            depthTest
            polygonOffsetFactor={-6}
          >
            <DecalMat map={tex.brand} color="#3a3a40" rough={0.5} />
          </Decal>
        </mesh>
      </PartGroup>

      <PartGroup id="rubberPad" {...common}>
        <mesh geometry={G.rubberBase} material={M.rubber} />
        <mesh geometry={G.bumper} material={M.rubberGrey} />
        <Instances geometry={G.knob} material={M.rubber} matrices={G.knobs} />
      </PartGroup>
    </group>
  );
});
