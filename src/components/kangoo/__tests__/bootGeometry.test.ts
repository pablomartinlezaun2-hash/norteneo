import * as THREE from "three";
import { buildBootGeometry } from "../bootGeometry";
import { BOOT_Y_OFFSET, PARTS, VARIANTS, bootFloorY } from "../catalog";

const hasNaN = (g: THREE.BufferGeometry) => {
  const a = g.getAttribute("position").array as ArrayLike<number>;
  for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) return true;
  return false;
};

describe("Kangoo Jumps 3D geometry", () => {
  const G = buildBootGeometry();
  const geometries = Object.entries(G).filter(([, v]) => v instanceof THREE.BufferGeometry) as [
    string,
    THREE.BufferGeometry,
  ][];

  it("genera todas las geometrías con vértices finitos", () => {
    expect(geometries.length).toBeGreaterThan(20);
    for (const [name, g] of geometries) {
      expect(g.getAttribute("position").count, name).toBeGreaterThan(0);
      expect(hasNaN(g), name).toBe(false);
    }
  });

  it("las normales de las láminas gruesas apuntan hacia fuera", () => {
    for (const g of [G.cuff, G.lowerShell, G.upperShell, G.basePlate, G.tongue]) {
      const pos = g.getAttribute("position");
      const nrm = g.getAttribute("normal");
      const center = new THREE.Box3()
        .setFromBufferAttribute(pos as THREE.BufferAttribute)
        .getCenter(new THREE.Vector3());
      // En el vértice más alejado del centro la normal debe alejarse del centro.
      let best = 0;
      let idx = 0;
      const p = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        const d = p.fromBufferAttribute(pos, i).distanceToSquared(center);
        if (d > best) {
          best = d;
          idx = i;
        }
      }
      p.fromBufferAttribute(pos, idx).sub(center);
      const n = new THREE.Vector3().fromBufferAttribute(nrm, idx);
      expect(n.dot(p)).toBeGreaterThan(0);
    }
  });

  it("la bota montada se apoya sobre la suela de goma", () => {
    const box = new THREE.Box3();
    G.knobs.forEach((m) => box.expandByPoint(new THREE.Vector3().setFromMatrixPosition(m)));
    const lowestTip = box.min.y - 0.093;
    const floor = bootFloorY(0) - BOOT_Y_OFFSET;
    expect(Math.abs(floor - lowestTip)).toBeLessThan(0.08);
  });

  it("catálogo coherente", () => {
    expect(new Set(PARTS.map((p) => p.id)).size).toBe(PARTS.length);
    expect(VARIANTS.length).toBeGreaterThanOrEqual(5);
  });
});
