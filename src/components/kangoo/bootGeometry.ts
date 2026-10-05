import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  PlanarPath,
  SurfaceFn,
  basisMatrix,
  buildLoft,
  buildThickSheet,
  clamp01,
  lathe,
  lerp,
  smoothstep,
  spow,
  surfaceFrame,
} from "./geometry";

/* ------------------------------------------------------------------ */
/* Carcasa                                                             */
/* ------------------------------------------------------------------ */

const X_HEEL = -1.5;
const X_TOE = 1.55;

export function shellProfile(s: number) {
  const heelR = 0.12;
  const toeR = 0.3;
  let env = 1;
  if (s < heelR) env = Math.sqrt(Math.max(0, 1 - ((heelR - s) / heelR) ** 2));
  else if (s > 1 - toeR) env = Math.sqrt(Math.max(0, 1 - ((s - (1 - toeR)) / toeR) ** 2));
  const w = (0.41 + 0.09 * Math.exp(-(((s - 0.66) / 0.22) ** 2))) * env;
  const yBot = 0.07 * smoothstep(0.8, 1, s);
  const top = 0.62 + 0.66 * (1 - smoothstep(0.18, 0.8, s));
  const hEnv = s > 1 - toeR ? 0.42 + 0.58 * Math.pow(env, 0.6) : 1;
  return { w, yBot, yTop: yBot + (top - yBot) * hEnv };
}

const shellSurface =
  (o: { widthScale?: number; maxHeight?: number; upExp?: number; downExp?: number; grow?: number } = {}): SurfaceFn =>
  (u, v, out) => {
    const s = clamp01(u);
    const x = lerp(X_HEEL - (o.grow ?? 0), X_TOE + (o.grow ?? 0), s);
    const p = shellProfile(s);
    const yBot = p.yBot - (o.grow ?? 0) * 0.5;
    const yTop = o.maxHeight ? Math.min(p.yTop, p.yBot + o.maxHeight) : p.yTop;
    const w = p.w * (o.widthScale ?? 1) + (p.w > 0 ? (o.grow ?? 0) : 0);
    const th = v * Math.PI * 2;
    const c = Math.cos(th);
    const sn = Math.sin(th);
    const e = 2 / (sn >= 0 ? (o.upExp ?? 2.4) : (o.downExp ?? 7));
    const yc = (yTop + yBot) / 2;
    const hh = (yTop - yBot) / 2;
    const y = yc + hh * spow(sn, e);
    // El talón se estrecha hacia el tobillo.
    const taper = 1 - 0.1 * smoothstep(0.35, 1.25, y) * (1 - smoothstep(0.2, 0.6, s));
    return out.set(x, y, w * spow(c, e) * taper);
  };

export const shellFn = shellSurface();
const shellUMap = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

/* ------------------------------------------------------------------ */
/* Caña (cuff), con inclinación hacia delante                          */
/* ------------------------------------------------------------------ */

export const CUFF = { cx: -0.8, pivotY: 1.0, tilt: 0.16, phiOpen: 0.78, yMin: 0.74, yMax: 2.32 };

function cuffRadii(y: number) {
  const vv = clamp01((y - CUFF.yMin) / (CUFF.yMax - CUFF.yMin));
  return {
    rx: 0.76 - 0.14 * smoothstep(0, 0.7, vv) + 0.04 * smoothstep(0.88, 1, vv),
    rz: 0.58 - 0.09 * smoothstep(0, 0.7, vv) + 0.03 * smoothstep(0.88, 1, vv),
  };
}

/** Aplica la inclinación de la caña alrededor del pivote (remaches). */
export function tiltCuff(x: number, y: number, z: number, out: THREE.Vector3) {
  const dx = x - CUFF.cx;
  const dy = y - CUFF.pivotY;
  const c = Math.cos(CUFF.tilt);
  const s = Math.sin(CUFF.tilt);
  return out.set(CUFF.cx + dx * c + dy * s, CUFF.pivotY - dx * s + dy * c, z);
}

/** Punto sobre la superficie media de la caña para un ángulo y altura dados. */
export function cuffPoint(phi: number, y: number, radial: number, out: THREE.Vector3, frontPull = 0) {
  const { rx, rz } = cuffRadii(y);
  const e = 2 / 2.4;
  const cp = Math.cos(phi);
  const pull = cp > 0 ? frontPull * Math.pow(cp, 6) : 0;
  const lx = (rx - pull + radial) * spow(cp, e);
  const lz = (rz + radial) * spow(Math.sin(phi), e);
  return tiltCuff(CUFF.cx + lx, y, lz, out);
}

export const cuffFn: SurfaceFn = (u, v, out) => {
  const phi = CUFF.phiOpen + u * (Math.PI * 2 - 2 * CUFF.phiOpen);
  const k = (1 + Math.cos(phi)) / 2;
  const yb = CUFF.yMin + 0.3 * Math.pow(k, 1.6);
  const yt = 2.2 - 0.16 * k;
  return cuffPoint(phi, lerp(yb, yt, v), 0, out);
};

/* ------------------------------------------------------------------ */
/* Botín interior                                                      */
/* ------------------------------------------------------------------ */

const linerPath = new PlanarPath([
  [1.05, 0.3],
  [0.5, 0.31],
  [-0.1, 0.38],
  [-0.55, 0.6],
  [-0.76, 1.0],
  [-0.74, 1.5],
  [-0.66, 2.0],
  [-0.58, 2.52],
]);

const _T = new THREE.Vector3();
const _N = new THREE.Vector3();
const _C = new THREE.Vector3();

export const linerFn: SurfaceFn = (u, v, out) => {
  const cut = 0.94;
  const t = Math.min(u / cut, 1);
  const k = smoothstep(0.42, 0.68, t);
  let a1 = lerp(0.18, 0.44, k);
  let a2 = lerp(0.2, 0.48, k);
  let b = lerp(0.3, 0.43, k);
  const n = lerp(3, 2.2, k);
  if (t < 0.1) {
    const env = Math.sqrt(Math.max(0, 1 - ((0.1 - t) / 0.1) ** 2));
    a1 *= env;
    a2 *= env;
    b *= env;
  }
  // Cuello acolchado y abertura que desciende hacia el interior.
  let scale = 1 + 0.06 * Math.exp(-(((t - 0.95) / 0.04) ** 2));
  linerPath.point(t, _C);
  linerPath.tangent(t, _T);
  linerPath.normal(t, _N);
  if (u > cut) {
    const q = (u - cut) / (1 - cut);
    scale *= Math.pow(1 - q, 0.5) * 0.9 + 0.1 * (1 - q);
    _C.addScaledVector(_T, -0.35 * Math.pow(q, 1.4));
  }
  const th = v * Math.PI * 2;
  const c = Math.cos(th);
  const s = Math.sin(th);
  const e = 2 / n;
  const nc = (c >= 0 ? a1 : a2) * spow(c, e) * scale;
  const zc = b * spow(s, e) * scale;
  return out.copy(_C).addScaledVector(_N, nc).setZ(zc);
};

/* ------------------------------------------------------------------ */
/* Lengüeta                                                            */
/* ------------------------------------------------------------------ */

const tonguePath = new PlanarPath([
  [0.32, 0.72],
  [0.0, 0.93],
  [-0.2, 1.18],
  [-0.26, 1.5],
  [-0.17, 2.0],
  [-0.09, 2.5],
  [-0.07, 2.62],
]);

const tongueHalfW = (u: number) => {
  const base = 0.24 + 0.06 * smoothstep(0, 0.4, u);
  return u > 0.86 ? base * Math.pow(Math.max(0, 1 - ((u - 0.86) / 0.14) ** 2), 0.35) : base;
};

export const tongueFn: SurfaceFn = (u, v, out) => {
  const hw = tongueHalfW(u);
  const z = (v * 2 - 1) * hw;
  tonguePath.point(u, _C);
  tonguePath.normal(u, _N); // apunta hacia delante/arriba
  const wrap = 0.14 * (v * 2 - 1) ** 2;
  return out.copy(_C).addScaledVector(_N, -wrap).setZ(z);
};

/* ------------------------------------------------------------------ */
/* Power strap                                                         */
/* ------------------------------------------------------------------ */

export const STRAP_Y = 1.8;
const strapPhi = (u: number) => lerp(0.06, Math.PI * 2 + 0.46, u);

export const strapFn: SurfaceFn = (u, v, out) => {
  const phi = strapPhi(u);
  const lift = 0.043 + 0.02 * smoothstep(0.86, 0.95, u);
  return cuffPoint(phi, STRAP_Y + (v - 0.5) * 0.2, lift, out, 0.13);
};

/* ------------------------------------------------------------------ */
/* Sistema de rebote                                                   */
/* ------------------------------------------------------------------ */

export const upperPath = new PlanarPath([
  [-1.56, -1.46],
  [-1.72, -1.05],
  [-1.62, -0.55],
  [-1.3, -0.2],
  [-0.7, -0.165],
  [0.1, -0.19],
  [0.75, -0.3],
  [1.3, -0.48],
  [1.73, -0.76],
]);

export const lowerPath = new PlanarPath([
  [1.8, -0.78],
  [1.76, -1.15],
  [1.52, -1.5],
  [0.92, -1.7],
  [0.0, -1.74],
  [-0.8, -1.69],
  [-1.3, -1.6],
  [-1.6, -1.52],
]);

const upperHalfW = (u: number) => lerp(0.45, 0.42, smoothstep(0.65, 1, u));
const lowerHalfW = (u: number) => 0.4 + 0.07 * smoothstep(0.0, 0.3, u) - 0.02 * smoothstep(0.85, 1, u);

const pathSurface =
  (path: PlanarPath, halfW: (u: number) => number, dish: number, offset = 0, u0 = 0, u1 = 1): SurfaceFn =>
  (u, v, out) => {
    const t = lerp(u0, u1, u);
    path.point(t, _C);
    path.normal(t, _N);
    const z = (v * 2 - 1) * halfW(t);
    return out
      .copy(_C)
      .addScaledVector(_N, offset + dish * (v * 2 - 1) ** 2)
      .setZ(z);
  };

export const upperShellFn = pathSurface(upperPath, upperHalfW, -0.03);
export const lowerShellFn = pathSurface(lowerPath, lowerHalfW, 0.035);
/** Base de goma por la cara exterior de la concha inferior. */
export const rubberBaseFn = pathSurface(lowerPath, (u) => lowerHalfW(u) - 0.01, 0.035, -0.072, 0.13, 0.86);

export const SPRING = {
  front: new THREE.Vector3(1.7, -0.84, 0),
  rear: new THREE.Vector3(-1.2, -1.42, 0),
  z: [0.37, 0.44],
};

/* ------------------------------------------------------------------ */
/* Cierres                                                             */
/* ------------------------------------------------------------------ */

export interface BuckleSpec {
  lever: THREE.Matrix4;
  ladder: THREE.Matrix4;
  wire: THREE.TubeGeometry;
}

function framePoint(fn: SurfaceFn, u: number, v: number, lift: number, flip = false) {
  const f = surfaceFrame(fn, u, v, flip);
  return { p: f.p.clone().addScaledVector(f.n, lift), n: f.n, du: f.du, dv: f.dv };
}

function shellOutward(u: number, v: number, lift: number) {
  const f = framePoint(shellFn, u, v, 0);
  // Normal exterior: alejándose del eje de la sección.
  const p = shellProfile(u);
  const center = new THREE.Vector3(f.p.x, (p.yTop + p.yBot) / 2, 0);
  if (f.n.dot(f.p.clone().sub(center)) < 0) f.n.negate();
  f.p.addScaledVector(f.n, lift);
  return f;
}

function instepBuckle(): BuckleSpec {
  const s = 0.5;
  const a = shellOutward(s, 52 / 360, 0.012);
  const b = shellOutward(s, 140 / 360, 0.012);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 16; i++) {
    const deg = lerp(64, 132, i / 16);
    pts.push(shellOutward(s, deg / 360, 0.1 + 0.02 * Math.sin((Math.PI * i) / 16)).p);
  }
  return {
    lever: basisMatrix(a.p, a.n, b.p.clone().sub(a.p)),
    ladder: basisMatrix(b.p, b.n, a.p.clone().sub(b.p)),
    wire: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.012, 8, false),
  };
}

function cuffNormalAt(phi: number, y: number) {
  const p0 = cuffPoint(phi, y, 0, new THREE.Vector3());
  const p1 = cuffPoint(phi, y, 0.05, new THREE.Vector3());
  return { p: p0, n: p1.sub(p0).normalize() };
}

function cuffBuckle(): BuckleSpec {
  const y = 1.32;
  const pa = CUFF.phiOpen + 0.2;
  const pb = Math.PI * 2 - CUFF.phiOpen - 0.2;
  const a = cuffNormalAt(pa, y);
  const b = cuffNormalAt(pb, y);
  a.p.addScaledVector(a.n, 0.04);
  b.p.addScaledVector(b.n, 0.04);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 20; i++) {
    const phi = lerp(pa - 0.12, pb + 0.12 - Math.PI * 2, i / 20);
    pts.push(cuffPoint(phi, y, 0.1, new THREE.Vector3(), 0.12));
  }
  return {
    lever: basisMatrix(a.p, a.n, b.p.clone().sub(a.p)),
    ladder: basisMatrix(b.p, b.n, a.p.clone().sub(b.p)),
    wire: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.012, 8, false),
  };
}

/* ------------------------------------------------------------------ */
/* Ensamblado de geometrías                                            */
/* ------------------------------------------------------------------ */

export interface Placement {
  matrix: THREE.Matrix4;
}

export interface BootGeometry {
  shell: THREE.BufferGeometry;
  shellSole: THREE.BufferGeometry;
  holes: THREE.Matrix4[];
  holeRim: THREE.BufferGeometry;
  holeDisc: THREE.BufferGeometry;
  liner: THREE.BufferGeometry;
  tongue: THREE.BufferGeometry;
  tongueLogo: { position: THREE.Vector3; rotation: THREE.Euler };
  cuff: THREE.BufferGeometry;
  cuffLogo: { position: THREE.Vector3; rotation: THREE.Euler };
  strap: THREE.BufferGeometry;
  strapBuckle: THREE.Matrix4;
  buckleBase: THREE.BufferGeometry;
  buckleLever: THREE.BufferGeometry;
  bucklePin: THREE.BufferGeometry;
  ladderBase: THREE.BufferGeometry;
  ladderTeeth: THREE.BufferGeometry;
  instepBuckle: BuckleSpec;
  cuffBuckle: BuckleSpec;
  rivet: THREE.BufferGeometry;
  rivets: THREE.Matrix4[];
  basePlate: THREE.BufferGeometry;
  heelWedge: THREE.BufferGeometry;
  screwHead: THREE.BufferGeometry;
  screwSocket: THREE.BufferGeometry;
  screws: THREE.Matrix4[];
  upperShell: THREE.BufferGeometry;
  upperHoles: THREE.Matrix4[];
  lowerShell: THREE.BufferGeometry;
  lowerLogo: { position: THREE.Vector3; rotation: THREE.Euler };
  lowerText: { position: THREE.Vector3; rotation: THREE.Euler };
  upperText: { position: THREE.Vector3; rotation: THREE.Euler };
  upperRearText: { position: THREE.Vector3; rotation: THREE.Euler };
  centerStop: THREE.BufferGeometry;
  rearBracket: THREE.BufferGeometry;
  rearBar: THREE.BufferGeometry;
  clipCap: THREE.BufferGeometry;
  clipRibs: THREE.BufferGeometry;
  clipPin: THREE.BufferGeometry;
  springCord: THREE.BufferGeometry;
  springCords: { matrix: THREE.Matrix4; side: number }[];
  medallion: THREE.BufferGeometry;
  medallions: { matrix: THREE.Matrix4; side: number }[];
  anchorPost: THREE.BufferGeometry;
  anchorPin: THREE.BufferGeometry;
  anchors: THREE.Matrix4[];
  rubberBase: THREE.BufferGeometry;
  bumper: THREE.BufferGeometry;
  knob: THREE.BufferGeometry;
  knobs: THREE.Matrix4[];
}

const eulerFromBasis = (normal: THREE.Vector3, up: THREE.Vector3) => {
  const m = basisMatrix(new THREE.Vector3(), normal, new THREE.Vector3().crossVectors(up, normal));
  return new THREE.Euler().setFromRotationMatrix(m);
};

export function buildBootGeometry(): BootGeometry {
  /* Carcasa ------------------------------------------------------- */
  const shell = buildLoft(shellFn, 120, 72, { uvScale: [3, 3], uMap: shellUMap });
  const shellSole = buildLoft(
    shellSurface({ widthScale: 1.08, maxHeight: 0.3, upExp: 8, downExp: 10, grow: 0.04 }),
    120,
    72,
    { uvScale: [3, 3], uMap: shellUMap },
  );

  const holes: THREE.Matrix4[] = [];
  const holeSpots: [number, number, number][] = [
    [0.87, 90, 1],
    [0.82, 52, 0.85],
    [0.82, 128, 0.85],
  ];
  for (const [s, deg, sc] of holeSpots) {
    const f = shellOutward(s, deg / 360, 0.002);
    holes.push(basisMatrix(f.p, f.n, new THREE.Vector3(1, 0, 0), sc));
  }
  const holeDisc = new THREE.CircleGeometry(1, 40).scale(0.2, 0.085, 1);
  const holeRim = new THREE.TorusGeometry(1, 0.1, 12, 48).scale(0.208, 0.092, 0.16);

  /* Botín y lengüeta --------------------------------------------- */
  const liner = buildLoft(linerFn, 110, 56, { uvScale: [4, 3] });
  const tongue = buildThickSheet(tongueFn, {
    nu: 70,
    nv: 18,
    thickness: (u, v) => 0.012 + 0.07 * (1 - 0.65 * Math.pow(Math.abs(v * 2 - 1), 5)) * smoothstep(0, 0.1, u),
    uvScale: [2.2, 0.6],
    edgeSegments: 6,
  });
  const tl = framePoint(tongueFn, 0.8, 0.5, 0);
  const tongueN = tl.n.x < 0 ? tl.n.clone().negate() : tl.n.clone();
  const tongueLogo = {
    position: tl.p.clone().addScaledVector(tongueN, 0.04),
    rotation: eulerFromBasis(tongueN, tl.du.clone()),
  };

  /* Caña ---------------------------------------------------------- */
  const cuff = buildThickSheet(cuffFn, {
    nu: 110,
    nv: 40,
    thickness: 0.06,
    uvScale: [4, 1.6],
    edgeSegments: 6,
  });
  const cl = cuffNormalAt(Math.PI * 0.62, 1.32);
  const cuffLogo = {
    position: cl.p.clone().addScaledVector(cl.n, 0.03),
    rotation: eulerFromBasis(cl.n, new THREE.Vector3(Math.sin(CUFF.tilt), Math.cos(CUFF.tilt), 0)),
  };

  /* Power strap --------------------------------------------------- */
  const strap = buildThickSheet(strapFn, {
    nu: 160,
    nv: 6,
    thickness: 0.018,
    uvScale: [1, 1],
    edgeSegments: 4,
    capSegments: 3,
  });
  const sb = framePoint(strapFn, 0.975, 0.5, 0);
  const sbOut = cuffPoint(strapPhi(0.975), STRAP_Y, 0.2, new THREE.Vector3()).sub(sb.p).normalize();
  const strapBuckle = basisMatrix(sb.p.clone().addScaledVector(sbOut, 0.03), sbOut, sb.du.clone().negate());

  /* Hebillas ------------------------------------------------------ */
  const buckleBase = new RoundedBoxGeometry(0.36, 0.16, 0.03, 3, 0.012).translate(0, 0, 0.012);
  const buckleLever = new RoundedBoxGeometry(0.42, 0.15, 0.05, 4, 0.022).rotateY(-0.1).translate(0.03, 0, 0.055);
  const bucklePin = new THREE.CylinderGeometry(0.014, 0.014, 0.15, 16).translate(-0.12, 0, 0.04);
  const ladderBase = new RoundedBoxGeometry(0.3, 0.1, 0.028, 3, 0.01).translate(0, 0, 0.012);
  const teeth: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    teeth.push(new RoundedBoxGeometry(0.024, 0.09, 0.03, 2, 0.008).translate(-0.11 + i * 0.045, 0, 0.034));
  }
  const ladderTeeth = mergeGeometries(teeth)!;

  /* Remaches ------------------------------------------------------ */
  const rivet = lathe(
    [
      [0.09, 0],
      [0.088, 0.014],
      [0.08, 0.03],
      [0.06, 0.042],
      [0.03, 0.049],
      [0, 0.05],
    ],
    48,
  ).rotateX(Math.PI / 2);
  const rivets = [Math.PI / 2, (Math.PI * 3) / 2].map((phi) => {
    const r = cuffNormalAt(phi, CUFF.pivotY);
    return basisMatrix(r.p.clone().addScaledVector(r.n, 0.025), r.n, new THREE.Vector3(1, 0, 0));
  });

  /* Placa base ---------------------------------------------------- */
  const basePlate = buildThickSheet(
    (u, v, out) => {
      const x = lerp(-1.53, 1.5, u);
      const s = clamp01((x - X_HEEL) / (X_TOE - X_HEEL));
      const w = shellProfile(s).w * 1.04 + 0.03;
      return out.set(x, -0.055 + 0.07 * smoothstep(0.8, 1, s), (v * 2 - 1) * w);
    },
    { nu: 90, nv: 16, thickness: 0.11, uvScale: [3, 1], edgeSegments: 5, capSegments: 4 },
  );

  /* Topes de talón (aleta) --------------------------------------- */
  const wedgeShape = new THREE.Shape();
  wedgeShape.moveTo(-1.34, 0.0);
  wedgeShape.lineTo(-0.72, 0.0);
  wedgeShape.quadraticCurveTo(-0.95, -0.08, -1.2, -0.27);
  wedgeShape.quadraticCurveTo(-1.36, -0.15, -1.34, 0.0);
  const heelWedge = new THREE.ExtrudeGeometry(wedgeShape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 4,
    curveSegments: 24,
  });

  /* Tornillería --------------------------------------------------- */
  const screwHead = lathe(
    [
      [0, -0.026],
      [0.042, -0.026],
      [0.045, -0.02],
      [0.045, -0.006],
      [0.04, 0],
      [0.0, 0],
    ],
    32,
  );
  const screwSocket = new THREE.CylinderGeometry(0.018, 0.018, 0.004, 6).translate(0, -0.027, 0);
  const screws = [
    [-1.0, 0.22],
    [-1.0, -0.22],
    [-0.25, 0.22],
    [-0.25, -0.22],
  ].map(([x, z]) => new THREE.Matrix4().makeTranslation(x, -0.21, z));

  /* Conchas ------------------------------------------------------- */
  const upperShell = buildThickSheet(upperShellFn, {
    nu: 90,
    nv: 18,
    thickness: 0.09,
    uvScale: [4, 1],
    edgeSegments: 6,
  });
  const upperHoles: THREE.Matrix4[] = [];
  for (const [u, v] of [
    [0.38, 0.3],
    [0.38, 0.7],
    [0.47, 0.5],
    [0.56, 0.3],
    [0.56, 0.7],
  ]) {
    const f = framePoint(upperShellFn, u, v, 0);
    const n = f.n.y < 0 ? f.n.clone() : f.n.clone().negate();
    upperHoles.push(basisMatrix(f.p.clone().addScaledVector(n, 0.047), n, f.du));
  }
  // Agujeros pasantes visibles en la parte descubierta del arco.
  for (const [u, v] of [
    [0.76, 0.25],
    [0.76, 0.75],
    [0.87, 0.5],
    [0.12, 0.3],
    [0.12, 0.7],
    [0.2, 0.5],
  ]) {
    const f = framePoint(upperShellFn, u, v, 0);
    const n = f.n.y > 0 ? f.n.clone() : f.n.clone().negate();
    upperHoles.push(basisMatrix(f.p.clone().addScaledVector(n, 0.047), n, f.du));
  }
  const ur = framePoint(upperShellFn, 0.16, 0.5, 0);
  const urOut = ur.n.x < 0 ? ur.n.clone() : ur.n.clone().negate();
  const upperRearText = {
    position: ur.p.clone().addScaledVector(urOut, 0.05),
    rotation: eulerFromBasis(urOut, new THREE.Vector3().crossVectors(urOut, ur.du).negate()),
  };
  const ut = framePoint(upperShellFn, 0.79, 0.5, 0);
  const utUp = ut.n.y > 0 ? ut.n.clone() : ut.n.clone().negate();
  const upperText = {
    position: ut.p.clone().addScaledVector(utUp, 0.05),
    rotation: eulerFromBasis(utUp, new THREE.Vector3().crossVectors(utUp, ut.du)),
  };

  const lowerShell = buildThickSheet(lowerShellFn, {
    nu: 120,
    nv: 18,
    thickness: 0.1,
    uvScale: [5, 1],
    edgeSegments: 6,
  });
  const ll = framePoint(lowerShellFn, 0.07, 0.5, 0);
  const llOut = ll.n.x > 0 ? ll.n.clone() : ll.n.clone().negate();
  const lowerLogo = {
    position: ll.p.clone().addScaledVector(llOut, 0.05),
    rotation: eulerFromBasis(llOut, ll.du.clone().negate()),
  };
  const lt = framePoint(lowerShellFn, 0.5, 0.5, 0);
  const ltIn = lt.n.y > 0 ? lt.n.clone() : lt.n.clone().negate();
  const lowerText = {
    position: lt.p.clone().addScaledVector(ltIn, 0.05),
    rotation: eulerFromBasis(ltIn, new THREE.Vector3(0, 0, 1)),
  };

  /* Clip delantero ----------------------------------------------- */
  const clipCap = new RoundedBoxGeometry(0.34, 0.3, 1.02, 6, 0.11).rotateZ(-0.35).translate(1.79, -0.74, 0);
  const ribs: THREE.BufferGeometry[] = [];
  for (const z of [-0.3, -0.1, 0.1, 0.3]) {
    ribs.push(new RoundedBoxGeometry(0.05, 0.12, 0.13, 3, 0.02).translate(0.165, 0.0, z));
  }
  const clipRibs = mergeGeometries(ribs)!.rotateZ(-0.35).translate(1.79, -0.74, 0);
  const clipPin = new THREE.CylinderGeometry(0.022, 0.022, 1.06, 20).rotateX(Math.PI / 2).translate(1.77, -0.79, 0);

  /* Muelles ------------------------------------------------------- */
  const dir = SPRING.rear.clone().sub(SPRING.front);
  const len = dir.length();
  const springCord = new THREE.CylinderGeometry(0.024, 0.024, len, 18, 1, false);
  // UV a lo largo del cordón para las estrías.
  const springCords: { matrix: THREE.Matrix4; side: number }[] = [];
  const medallions: { matrix: THREE.Matrix4; side: number }[] = [];
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  for (const side of [1, -1]) {
    for (const z of SPRING.z) {
      const mid = SPRING.front
        .clone()
        .add(SPRING.rear)
        .multiplyScalar(0.5)
        .setZ(z * side);
      springCords.push({ matrix: new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1)), side });
    }
    for (const t of [0.28, 0.72]) {
      const p = SPRING.front
        .clone()
        .lerp(SPRING.rear, t)
        .setZ(((SPRING.z[0] + SPRING.z[1]) / 2) * side);
      medallions.push({ matrix: new THREE.Matrix4().compose(p, q, new THREE.Vector3(1, 1, 1)), side });
    }
  }
  const medallion = lathe(
    [
      [0, -0.06],
      [0.046, -0.06],
      [0.054, -0.045],
      [0.054, 0.045],
      [0.046, 0.06],
      [0, 0.06],
    ],
    32,
  ).rotateX(Math.PI / 2);

  /* Anclajes ------------------------------------------------------ */
  const anchorPost = new RoundedBoxGeometry(0.1, 0.24, 0.16, 3, 0.03).translate(0, 0.08, 0);
  const anchorPin = new THREE.CylinderGeometry(0.02, 0.02, 0.24, 16).rotateX(Math.PI / 2).translate(0, 0.14, 0);
  const anchors = [1, -1].map((side) =>
    new THREE.Matrix4().makeTranslation(SPRING.rear.x, SPRING.rear.y - 0.14, ((SPRING.z[0] + SPRING.z[1]) / 2) * side),
  );

  /* Tope central y pletina trasera ------------------------------ */
  const centerStop = new RoundedBoxGeometry(0.5, 0.15, 0.62, 4, 0.05).rotateZ(-0.16).translate(0.68, -0.17, 0);
  const rearBracket = new RoundedBoxGeometry(0.3, 0.12, 1.0, 4, 0.04).rotateZ(0.5).translate(-1.6, -1.47, 0);
  const rearBar = new THREE.CylinderGeometry(0.022, 0.022, 1.08, 20).rotateX(Math.PI / 2).translate(-1.66, -1.4, 0);

  /* Suela de goma ------------------------------------------------- */
  const rubberBase = buildThickSheet(rubberBaseFn, {
    nu: 100,
    nv: 14,
    thickness: 0.045,
    uvScale: [5, 1],
    edgeSegments: 5,
  });

  const bumperParts: THREE.BufferGeometry[] = [];
  {
    const f = framePoint(lowerShellFn, 0.135, 0.5, 0);
    const out = f.n.x > 0 ? f.n.clone() : f.n.clone().negate();
    for (let i = 0; i < 6; i++) {
      const z = -0.36 + i * 0.144;
      const m = basisMatrix(f.p.clone().addScaledVector(out, 0.07).setZ(z), out, f.du);
      bumperParts.push(new RoundedBoxGeometry(0.06, 0.11, 0.07, 3, 0.025).applyMatrix4(m));
    }
  }
  const bumper = mergeGeometries(bumperParts)!;

  const knob = lathe(
    [
      [0, 0],
      [0.064, 0],
      [0.07, 0.018],
      [0.066, 0.05],
      [0.05, 0.078],
      [0.026, 0.09],
      [0, 0.093],
    ],
    20,
  )
    .rotateX(Math.PI / 2)
    .scale(1.25, 1, 1);
  const knobs: THREE.Matrix4[] = [];
  {
    const u0 = 0.17;
    const u1 = 0.84;
    const L = lowerPath.length * (u1 - u0);
    const rows = Math.round(L / 0.16);
    for (let r = 0; r <= rows; r++) {
      const t = lerp(u0, u1, r / rows);
      const cols = r % 2 === 0 ? [-0.33, -0.11, 0.11, 0.33] : [-0.4, -0.22, 0, 0.22, 0.4];
      const p = lowerPath.point(t);
      const n = lowerPath.normal(t).negate();
      const tan = lowerPath.tangent(t);
      const hw = lowerHalfW(t) - 0.01;
      for (const z of cols) {
        const k = r % 2 === 0 ? 1 : 0.8;
        const lift = 0.093 - 0.035 * (z / hw) ** 2;
        knobs.push(basisMatrix(p.clone().addScaledVector(n, lift).setZ(z), n, tan, k));
      }
    }
  }

  return {
    shell,
    shellSole,
    holes,
    holeRim,
    holeDisc,
    liner,
    tongue,
    tongueLogo,
    cuff,
    cuffLogo,
    strap,
    strapBuckle,
    buckleBase,
    buckleLever,
    bucklePin,
    ladderBase,
    ladderTeeth,
    instepBuckle: instepBuckle(),
    cuffBuckle: cuffBuckle(),
    rivet,
    rivets,
    basePlate,
    heelWedge,
    screwHead,
    screwSocket,
    screws,
    upperShell,
    upperHoles,
    lowerShell,
    lowerLogo,
    lowerText,
    upperText,
    upperRearText,
    centerStop,
    rearBracket,
    rearBar,
    clipCap,
    clipRibs,
    clipPin,
    springCord,
    springCords,
    medallion,
    medallions,
    anchorPost,
    anchorPin,
    anchors,
    rubberBase,
    bumper,
    knob,
    knobs,
  };
}

export function disposeBootGeometry(g: BootGeometry) {
  Object.values(g).forEach((v) => {
    if (v instanceof THREE.BufferGeometry) v.dispose();
    else if (v && typeof v === "object" && "wire" in v) (v as BuckleSpec).wire.dispose();
  });
}
