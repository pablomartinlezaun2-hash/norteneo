import * as THREE from "three";

/**
 * Texturas PBR procedurales (sin descargas): mapas de normales, rugosidad y
 * color generados en canvas a partir de campos de altura tileables.
 * Se generan una sola vez y se cachean.
 */

const cache = new Map<string, unknown>();
function cached<T>(key: string, make: () => T): T {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key) as T;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** Ruido de valor tileable con celdas anisotrópicas. */
function valueNoise(size: number, cellsX: number, cellsY: number, seed: number): Float32Array {
  const rnd = mulberry32(seed);
  const grid = new Float32Array(cellsX * cellsY);
  for (let i = 0; i < grid.length; i++) grid[i] = rnd();
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    const gy = (y / size) * cellsY;
    const y0 = Math.floor(gy);
    const ty = fade(gy - y0);
    const r0 = (y0 % cellsY) * cellsX;
    const r1 = ((y0 + 1) % cellsY) * cellsX;
    for (let x = 0; x < size; x++) {
      const gx = (x / size) * cellsX;
      const x0 = Math.floor(gx);
      const tx = fade(gx - x0);
      const c0 = x0 % cellsX;
      const c1 = (x0 + 1) % cellsX;
      const a = grid[r0 + c0] + (grid[r0 + c1] - grid[r0 + c0]) * tx;
      const b = grid[r1 + c0] + (grid[r1 + c1] - grid[r1 + c0]) * tx;
      out[y * size + x] = a + (b - a) * ty;
    }
  }
  return out;
}

function fbm(size: number, cells: number, octaves: number, seed: number, gain = 0.5, aniso = 1): Float32Array {
  const out = new Float32Array(size * size);
  let amp = 1;
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    const c = cells * 2 ** o;
    const n = valueNoise(size, Math.max(1, Math.round(c / aniso)), c, seed + o * 101);
    for (let i = 0; i < out.length; i++) out[i] += n[i] * amp;
    total += amp;
    amp *= gain;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

/** Ruido celular (Worley F1) tileable, útil para grano de piel sintética. */
function worley(size: number, cells: number, seed: number): Float32Array {
  const rnd = mulberry32(seed);
  const pts: [number, number][] = [];
  for (let i = 0; i < cells * cells; i++) pts.push([rnd(), rnd()]);
  const out = new Float32Array(size * size);
  const cs = size / cells;
  for (let y = 0; y < size; y++) {
    const cy = Math.floor(y / cs);
    for (let x = 0; x < size; x++) {
      const cx = Math.floor(x / cs);
      let best = 1e9;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const gx = (cx + dx + cells) % cells;
          const gy = (cy + dy + cells) % cells;
          const p = pts[gy * cells + gx];
          const px = (cx + dx + p[0]) * cs;
          const py = (cy + dy + p[1]) * cs;
          const d = Math.hypot(px - x, py - y);
          if (d < best) best = d;
        }
      }
      out[y * size + x] = Math.min(1, best / cs);
    }
  }
  return out;
}

function canvas(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  return { c, ctx, img: ctx.createImageData(size, size) };
}

function heightToNormal(h: Float32Array, size: number, strength: number): HTMLCanvasElement {
  const { c, ctx, img } = canvas(size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    const ym = ((y - 1 + size) % size) * size;
    const yp = ((y + 1) % size) * size;
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size;
      const xp = (x + 1) % size;
      const dx = (h[y * size + xp] - h[y * size + xm]) * strength;
      const dy = (h[yp + x] - h[ym + x]) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      d[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      d[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      d[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function grayCanvas(h: Float32Array, size: number, map: (v: number) => number): HTMLCanvasElement {
  const { c, ctx, img } = canvas(size);
  const d = img.data;
  for (let i = 0; i < h.length; i++) {
    const v = Math.max(0, Math.min(255, map(h[i]) * 255));
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
    d[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function tex(c: HTMLCanvasElement, color = false): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
}

export interface PbrMaps {
  normal: THREE.CanvasTexture;
  roughness?: THREE.CanvasTexture;
  color?: THREE.CanvasTexture;
}

/** Piel de naranja muy fina de plástico inyectado brillante. */
export const plasticMaps = () =>
  cached<PbrMaps>("plastic", () => {
    const s = 512;
    const h = fbm(s, 24, 4, 11, 0.55);
    const big = fbm(s, 4, 2, 77);
    return {
      normal: tex(heightToNormal(h, s, 2.2)),
      roughness: tex(grayCanvas(big, s, (v) => 0.8 + v * 0.4)),
    };
  });

/**
 * Imperfecciones de uso para plásticos brillantes: manchas, huellas y
 * micro-arañazos en un mapa de rugosidad (más claro = más rugoso). Rompe el
 * reflejo de espejo perfecto que delata un render sintético.
 */
export const wearMaps = () =>
  cached<PbrMaps>("wear", () => {
    const s = 1024;
    const rnd = mulberry32(97);
    const blot = fbm(s, 5, 4, 71, 0.55);
    const fine = fbm(s, 64, 2, 73, 0.5);
    const { c, ctx, img } = canvas(s);
    for (let i = 0; i < blot.length; i++) {
      const smudge = Math.max(0, Math.min(1, (blot[i] - 0.5) * 3.2));
      const v = 0.3 + smudge * 0.45 + fine[i] * 0.12;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = Math.min(255, v * 255);
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // Huellas: grupos de arcos concéntricos muy tenues.
    ctx.lineCap = "round";
    for (let f = 0; f < 7; f++) {
      const cx = rnd() * s;
      const cy = rnd() * s;
      const r0 = 18 + rnd() * 22;
      const rot = rnd() * Math.PI;
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 1.4;
      for (let k = 0; k < 14; k++) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, r0 + k * 3.2, (r0 + k * 3.2) * 0.72, rot, 0.2, Math.PI * 1.75);
        ctx.stroke();
      }
    }
    // Micro-arañazos finos en direcciones aleatorias.
    for (let k = 0; k < 900; k++) {
      const x = rnd() * s;
      const y = rnd() * s;
      const a = rnd() * Math.PI;
      const len = 6 + rnd() * 40;
      ctx.strokeStyle = `rgba(255,255,255,${0.05 + rnd() * 0.12})`;
      ctx.lineWidth = 0.6 + rnd() * 0.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      ctx.stroke();
    }
    return { normal: tex(heightToNormal(fine, s, 0.4)), roughness: tex(c) };
  });

/** Plástico técnico mate texturizado (placa base, palancas). */
export const texturedPlasticMaps = () =>
  cached<PbrMaps>("texplastic", () => {
    const s = 512;
    const h = fbm(s, 64, 3, 23, 0.6);
    return {
      normal: tex(heightToNormal(h, s, 6)),
      roughness: tex(grayCanvas(h, s, (v) => 0.75 + v * 0.35)),
    };
  });

/** Tejido "3D spacer mesh" del botín interior: celdas hexagonales + hilo. */
export const meshFabricMaps = () =>
  cached<PbrMaps>("meshfabric", () => {
    const s = 512;
    const cols = 16;
    const rows = 18;
    const cw = s / cols;
    const rh = s / rows;
    const thread = fbm(s, 128, 2, 5, 0.5);
    const h = new Float32Array(s * s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        let best = 1e9;
        const r = Math.floor(y / rh);
        for (let dr = -1; dr <= 1; dr++) {
          const rr = r + dr;
          const shift = ((rr % 2) + 2) % 2 ? cw / 2 : 0;
          const cy = (rr + 0.5) * rh;
          const c = Math.floor((x - shift) / cw);
          for (let dc = -1; dc <= 1; dc++) {
            const cx = (c + dc + 0.5) * cw + shift;
            const d = Math.hypot((x - cx) / cw, (y - cy) / rh);
            if (d < best) best = d;
          }
        }
        const hole = Math.min(1, Math.max(0, (best - 0.26) / 0.14));
        h[y * s + x] = hole * 0.85 + thread[y * s + x] * 0.15;
      }
    }
    const col = canvas(s);
    for (let i = 0; i < h.length; i++) {
      const v = 30 + h[i] * 70;
      col.img.data[i * 4] = v;
      col.img.data[i * 4 + 1] = v;
      col.img.data[i * 4 + 2] = v * 1.04;
      col.img.data[i * 4 + 3] = 255;
    }
    col.ctx.putImageData(col.img, 0, 0);
    return {
      normal: tex(heightToNormal(h, s, 5)),
      roughness: tex(grayCanvas(h, s, (v) => 1 - v * 0.15)),
      color: tex(col.c, true),
    };
  });

/** Cinta de nylon en sarga (twill) para el power strap. */
export const webbingMaps = () =>
  cached<PbrMaps>("webbing", () => {
    const s = 512;
    const n = fbm(s, 64, 2, 9);
    const h = new Float32Array(s * s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const twill = 0.5 + 0.5 * Math.sin(((x + y) / s) * Math.PI * 2 * 40);
        const weft = 0.5 + 0.5 * Math.sin((y / s) * Math.PI * 2 * 128);
        h[y * s + x] = twill * 0.7 + weft * 0.2 + n[y * s + x] * 0.1;
      }
    }
    const col = canvas(s);
    for (let i = 0; i < h.length; i++) {
      const v = 255 * (0.55 + h[i] * 0.45);
      col.img.data[i * 4] = col.img.data[i * 4 + 1] = col.img.data[i * 4 + 2] = v;
      col.img.data[i * 4 + 3] = 255;
    }
    col.ctx.putImageData(col.img, 0, 0);
    return { normal: tex(heightToNormal(h, s, 4)), color: tex(col.c, true) };
  });

/** Metal cepillado (vetas en dirección U). */
export const brushedMetalMaps = () =>
  cached<PbrMaps>("brushed", () => {
    const s = 512;
    const h = fbm(s, 96, 3, 31, 0.6, 48);
    return {
      normal: tex(heightToNormal(h, s, 1.4)),
      roughness: tex(grayCanvas(h, s, (v) => 0.75 + v * 0.5)),
    };
  });

/** Goma vulcanizada con grano. */
export const rubberMaps = () =>
  cached<PbrMaps>("rubber", () => {
    const s = 512;
    const h = fbm(s, 48, 4, 41, 0.6);
    const sp = fbm(s, 160, 1, 43);
    for (let i = 0; i < h.length; i++) h[i] = h[i] * 0.8 + (sp[i] > 0.72 ? 0.25 : 0);
    return {
      normal: tex(heightToNormal(h, s, 5)),
      roughness: tex(grayCanvas(h, s, (v) => 0.9 + v * 0.1)),
    };
  });

/** Polipiel granulada (lengüeta). */
export const leatherMaps = () =>
  cached<PbrMaps>("leather", () => {
    const s = 512;
    const w = worley(s, 28, 51);
    const n = fbm(s, 32, 3, 53);
    const h = new Float32Array(s * s);
    for (let i = 0; i < h.length; i++) h[i] = Math.sqrt(w[i]) * 0.8 + n[i] * 0.2;
    return {
      normal: tex(heightToNormal(h, s, 3.2)),
      roughness: tex(grayCanvas(h, s, (v) => 0.7 + (1 - v) * 0.5)),
    };
  });

export interface TextDecalOptions {
  width?: number;
  height?: number;
  font?: string;
  color?: string;
  stroke?: string;
  letterSpacing?: number;
  sub?: string;
  subFont?: string;
}

/** Textura transparente con texto (logotipos/serigrafías). */
export function textDecal(key: string, text: string, o: TextDecalOptions = {}) {
  return cached(`text:${key}:${text}:${o.color}`, () => {
    const w = o.width ?? 1024;
    const h = o.height ?? 512;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = o.font ?? `italic 900 ${h * 0.62}px "Arial Black", Arial, sans-serif`;
    if ("letterSpacing" in ctx && o.letterSpacing) {
      (ctx as unknown as { letterSpacing: string }).letterSpacing = `${o.letterSpacing}px`;
    }
    const y = o.sub ? h * 0.42 : h / 2;
    if (o.stroke) {
      ctx.lineWidth = h * 0.03;
      ctx.strokeStyle = o.stroke;
      ctx.strokeText(text, w / 2, y);
    }
    ctx.fillStyle = o.color ?? "#e8e8ea";
    ctx.fillText(text, w / 2, y);
    if (o.sub) {
      ctx.font = o.subFont ?? `700 ${h * 0.16}px Arial, sans-serif`;
      ctx.fillText(o.sub, w / 2, h * 0.82);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  });
}
