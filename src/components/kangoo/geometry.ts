import * as THREE from "three";

/**
 * Generadores de geometría paramétrica para el modelo Kangoo Jumps.
 *
 * Todas las piezas se describen como superficies paramétricas f(u, v) en
 * coordenadas de ensamblaje (1 unidad ≈ 10 cm). Ejes: +X puntera, +Y arriba,
 * +Z lado exterior (lateral) de la bota derecha.
 */

export type SurfaceFn = (u: number, v: number, out: THREE.Vector3) => THREE.Vector3;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** sign(x)·|x|^p, base de las superelipses. */
export const spow = (x: number, p: number) => Math.sign(x) * Math.pow(Math.abs(x), p);

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _d = new THREE.Vector3();

export interface SurfaceFrame {
  p: THREE.Vector3;
  du: THREE.Vector3;
  dv: THREE.Vector3;
  n: THREE.Vector3;
}

/** Punto, derivadas parciales normalizadas y normal (du × dv) de la superficie. */
export function surfaceFrame(fn: SurfaceFn, u: number, v: number, flip = false): SurfaceFrame {
  const e = 1e-3;
  const p = fn(u, v, new THREE.Vector3());
  const u0 = Math.max(0, u - e);
  const u1 = Math.min(1, u + e);
  const v0 = Math.max(0, v - e);
  const v1 = Math.min(1, v + e);
  const du = fn(u1, v, _a.clone()).sub(fn(u0, v, _b));
  const dv = fn(u, v1, _c.clone()).sub(fn(u, v0, _d));
  const n = new THREE.Vector3().crossVectors(du, dv);
  if (flip) n.negate();
  if (n.lengthSq() < 1e-14) n.set(0, 1, 0);
  return { p, du: du.normalize(), dv: dv.normalize(), n: n.normalize() };
}

/** Asegura que cada triángulo apunta hacia la normal media de sus vértices. */
function orientTriangles(pos: Float32Array, nrm: Float32Array, idx: number[]) {
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  const g = new THREE.Vector3();
  for (let i = 0; i < idx.length; i += 3) {
    const i0 = idx[i] * 3;
    const i1 = idx[i + 1] * 3;
    const i2 = idx[i + 2] * 3;
    a.fromArray(pos, i0);
    b.fromArray(pos, i1).sub(a);
    c.fromArray(pos, i2).sub(a);
    g.crossVectors(b, c);
    if (g.lengthSq() < 1e-16) continue;
    n.set(
      nrm[i0] + nrm[i1] + nrm[i2],
      nrm[i0 + 1] + nrm[i1 + 1] + nrm[i2 + 1],
      nrm[i0 + 2] + nrm[i1 + 2] + nrm[i2 + 2],
    );
    if (g.dot(n) < 0) {
      const t = idx[i + 1];
      idx[i + 1] = idx[i + 2];
      idx[i + 2] = t;
    }
  }
}

export interface ThickSheetOptions {
  nu: number;
  nv: number;
  thickness: number | ((u: number, v: number) => number);
  /** Segmentos del canto redondeado (media caña). */
  edgeSegments?: number;
  /** Segmentos del remate redondeado en u = 0 y u = 1. */
  capSegments?: number;
  uvScale?: [number, number];
  /** Invierte qué cara se considera "exterior". */
  flip?: boolean;
  /** Distribución de muestras en u (por defecto lineal). */
  uMap?: (t: number) => number;
}

/**
 * Lámina con grosor real y todos los cantos redondeados a partir de una
 * superficie paramétrica: cara exterior, cara interior, cantos en v = 0/1 y
 * remates en u = 0/1. Las normales se calculan analíticamente, así que las
 * transiciones entre caras y cantos son suaves (aspecto de pieza inyectada).
 */
export function buildThickSheet(fn: SurfaceFn, o: ThickSheetOptions): THREE.BufferGeometry {
  const es = o.edgeSegments ?? 6;
  const cs = o.capSegments ?? 5;
  const [su, sv] = o.uvScale ?? [1, 1];
  const thick = typeof o.thickness === "number" ? () => o.thickness as number : o.thickness;
  const uMap = o.uMap ?? ((t: number) => t);

  type Row = { u: number; a: number; dir: number };
  const rows: Row[] = [];
  for (let k = 0; k < cs; k++) rows.push({ u: 0, a: (Math.PI / 2) * (1 - k / cs), dir: -1 });
  for (let i = 0; i <= o.nu; i++) rows.push({ u: uMap(i / o.nu), a: 0, dir: 0 });
  for (let k = 1; k <= cs; k++) rows.push({ u: 1, a: (Math.PI / 2) * (k / cs), dir: 1 });

  type Col = { v: number; b: number; t: number };
  const loop: Col[] = [];
  for (let j = 0; j <= o.nv; j++) loop.push({ v: j / o.nv, b: 0, t: (j / o.nv) * 0.5 });
  for (let k = 1; k < es; k++) loop.push({ v: 1, b: (Math.PI * k) / es, t: 0.5 });
  for (let j = o.nv; j >= 0; j--) loop.push({ v: j / o.nv, b: Math.PI, t: 0.5 + (1 - j / o.nv) * 0.5 });
  for (let k = 1; k < es; k++) loop.push({ v: 0, b: Math.PI + (Math.PI * k) / es, t: 1 });
  loop.push({ ...loop[0], t: 1 });

  const nRows = rows.length;
  const nCols = loop.length;
  const pos = new Float32Array(nRows * nCols * 3);
  const nrm = new Float32Array(nRows * nCols * 3);
  const uv = new Float32Array(nRows * nCols * 2);

  const tmp = new THREE.Vector3();
  const off = new THREE.Vector3();
  const nn = new THREE.Vector3();
  const frames = new Map<string, SurfaceFrame>();
  const frameOf = (u: number, v: number) => {
    const key = `${u.toFixed(5)}|${v.toFixed(5)}`;
    let f = frames.get(key);
    if (!f) {
      f = surfaceFrame(fn, u, v, o.flip);
      frames.set(key, f);
    }
    return f;
  };

  let w = 0;
  for (let r = 0; r < nRows; r++) {
    const row = rows[r];
    const c = Math.cos(row.a);
    const sa = Math.sin(row.a);
    for (let k = 0; k < nCols; k++) {
      const col = loop[k];
      const f = frameOf(row.u, col.v);
      const t = thick(row.u, col.v) / 2;
      const cb = Math.cos(col.b);
      const sb = Math.sin(col.b);
      off
        .copy(f.n)
        .multiplyScalar(cb)
        .addScaledVector(f.dv, sb)
        .multiplyScalar(t * c);
      off.addScaledVector(f.du, sa * t * row.dir);
      tmp.copy(f.p).add(off);
      nn.copy(f.n)
        .multiplyScalar(cb * c)
        .addScaledVector(f.dv, sb * c)
        .addScaledVector(f.du, sa * row.dir);
      if (nn.lengthSq() < 1e-12) nn.copy(f.n);
      nn.normalize();
      pos[w * 3] = tmp.x;
      pos[w * 3 + 1] = tmp.y;
      pos[w * 3 + 2] = tmp.z;
      nrm[w * 3] = nn.x;
      nrm[w * 3 + 1] = nn.y;
      nrm[w * 3 + 2] = nn.z;
      uv[w * 2] = (row.u + row.dir * sa * 0.01) * su;
      uv[w * 2 + 1] = col.t * sv;
      w++;
    }
  }

  const idx: number[] = [];
  for (let r = 0; r < nRows - 1; r++) {
    for (let k = 0; k < nCols - 1; k++) {
      const a = r * nCols + k;
      const b = (r + 1) * nCols + k;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  orientTriangles(pos, nrm, idx);

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

/**
 * Sólido cerrado por secciones (v recorre el anillo). Los extremos u = 0/1
 * deben colapsar a un punto o línea; las costuras se suavizan.
 */
export function buildLoft(
  fn: SurfaceFn,
  nu: number,
  nv: number,
  opts: { uvScale?: [number, number]; uMap?: (t: number) => number } = {},
): THREE.BufferGeometry {
  const [su, sv] = opts.uvScale ?? [1, 1];
  const uMap = opts.uMap ?? ((t: number) => t);
  const cols = nv + 1;
  const pos = new Float32Array((nu + 1) * cols * 3);
  const uv = new Float32Array((nu + 1) * cols * 2);
  const p = new THREE.Vector3();
  for (let i = 0; i <= nu; i++) {
    const u = uMap(i / nu);
    for (let j = 0; j <= nv; j++) {
      fn(u, (j % nv) / nv, p);
      const k = i * cols + j;
      pos[k * 3] = p.x;
      pos[k * 3 + 1] = p.y;
      pos[k * 3 + 2] = p.z;
      uv[k * 2] = u * su;
      uv[k * 2 + 1] = (j / nv) * sv;
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const a = i * cols + j;
      const b = (i + 1) * cols + j;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  // Volumen con signo para garantizar normales hacia fuera.
  let vol = 0;
  const A = new THREE.Vector3();
  const B = new THREE.Vector3();
  const C = new THREE.Vector3();
  for (let t = 0; t < idx.length; t += 3) {
    A.fromArray(pos, idx[t] * 3);
    B.fromArray(pos, idx[t + 1] * 3);
    C.fromArray(pos, idx[t + 2] * 3);
    vol += A.dot(B.cross(C));
  }
  if (vol < 0) {
    for (let t = 0; t < idx.length; t += 3) {
      const s = idx[t + 1];
      idx[t + 1] = idx[t + 2];
      idx[t + 2] = s;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();

  // Costura: promedia normales del primer y último vértice de cada anillo.
  const nrm = g.getAttribute("normal") as THREE.BufferAttribute;
  const n0 = new THREE.Vector3();
  const n1 = new THREE.Vector3();
  for (let i = 0; i <= nu; i++) {
    const a = i * cols;
    const b = i * cols + nv;
    n0.fromBufferAttribute(nrm, a);
    n1.fromBufferAttribute(nrm, b);
    n0.add(n1).normalize();
    nrm.setXYZ(a, n0.x, n0.y, n0.z);
    nrm.setXYZ(b, n0.x, n0.y, n0.z);
  }
  // Polos: normal = dirección desde el anillo vecino hacia el polo.
  const fixPole = (row: number, neighbour: number) => {
    const c0 = new THREE.Vector3();
    const c1 = new THREE.Vector3();
    for (let j = 0; j < nv; j++) {
      c0.add(p.fromArray(pos, (row * cols + j) * 3));
      c1.add(p.fromArray(pos, (neighbour * cols + j) * 3));
    }
    c0.divideScalar(nv);
    c1.divideScalar(nv);
    let spread = 0;
    for (let j = 0; j < nv; j++) spread = Math.max(spread, p.fromArray(pos, (row * cols + j) * 3).distanceTo(c0));
    if (spread > 0.02) return;
    const d = c0.clone().sub(c1).normalize();
    for (let j = 0; j <= nv; j++) {
      const k = row * cols + j;
      n0.fromBufferAttribute(nrm, k).lerp(d, 0.6).normalize();
      nrm.setXYZ(k, n0.x, n0.y, n0.z);
    }
  };
  fixPole(0, 1);
  fixPole(nu, nu - 1);
  nrm.needsUpdate = true;
  g.computeBoundingSphere();
  return g;
}

/** Curva en el plano XY con marco fijo (binormal = Z). */
export class PlanarPath {
  readonly curve: THREE.CatmullRomCurve3;
  private readonly lut: { t: number; s: number }[] = [];

  constructor(points: [number, number][], tension = 0.5) {
    this.curve = new THREE.CatmullRomCurve3(
      points.map(([x, y]) => new THREE.Vector3(x, y, 0)),
      false,
      "centripetal",
      tension,
    );
  }

  point(t: number, out = new THREE.Vector3()) {
    return this.curve.getPointAt(clamp01(t), out);
  }

  tangent(t: number, out = new THREE.Vector3()) {
    return this.curve.getTangentAt(clamp01(t), out);
  }

  /** Normal en el plano: T × Z. */
  normal(t: number, out = new THREE.Vector3()) {
    const T = this.tangent(t, out);
    return out.set(T.y, -T.x, 0).normalize();
  }

  get length() {
    return this.curve.getLength();
  }
}

/** Polígono de perfil para LatheGeometry a partir de pares [radio, altura]. */
export const lathe = (pts: [number, number][], segments = 40) =>
  new THREE.LatheGeometry(
    pts.map(([r, h]) => new THREE.Vector2(r, h)),
    segments,
  );

/** Base ortonormal → matriz con el eje Z alineado a la normal. */
export function basisMatrix(
  position: THREE.Vector3,
  normal: THREE.Vector3,
  towards: THREE.Vector3,
  scale = 1,
): THREE.Matrix4 {
  const z = normal.clone().normalize();
  const x = towards.clone().addScaledVector(z, -towards.dot(z));
  if (x.lengthSq() < 1e-8) x.set(1, 0, 0);
  x.normalize();
  const y = new THREE.Vector3().crossVectors(z, x).normalize();
  const m = new THREE.Matrix4().makeBasis(x, y, z);
  m.scale(new THREE.Vector3(scale, scale, scale));
  m.setPosition(position);
  return m;
}
