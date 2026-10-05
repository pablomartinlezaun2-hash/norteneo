import * as THREE from "three";
import type { BootVariant } from "./catalog";
import {
  brushedMetalMaps,
  leatherMaps,
  meshFabricMaps,
  plasticMaps,
  rubberMaps,
  texturedPlasticMaps,
  webbingMaps,
} from "./textures";

export interface BootMaterials {
  shell: THREE.MeshPhysicalMaterial;
  shellSole: THREE.MeshPhysicalMaterial;
  springShell: THREE.MeshPhysicalMaterial;
  matteBlack: THREE.MeshPhysicalMaterial;
  accent: THREE.MeshPhysicalMaterial;
  spring: THREE.MeshPhysicalMaterial;
  rubber: THREE.MeshStandardMaterial;
  rubberGrey: THREE.MeshStandardMaterial;
  fabric: THREE.MeshPhysicalMaterial;
  neoprene: THREE.MeshPhysicalMaterial;
  webbing: THREE.MeshPhysicalMaterial;
  metal: THREE.MeshPhysicalMaterial;
  chrome: THREE.MeshPhysicalMaterial;
  smoked: THREE.MeshPhysicalMaterial;
  hole: THREE.MeshStandardMaterial;
}

const withRepeat = (t: THREE.Texture | undefined, x: number, y = x) => {
  if (!t) return undefined;
  const c = t.clone();
  c.repeat.set(x, y);
  c.needsUpdate = true;
  return c;
};

export function createBootMaterials(v: BootVariant): BootMaterials {
  const plastic = plasticMaps();
  const tex = texturedPlasticMaps();
  const fabric = meshFabricMaps();
  const web = webbingMaps();
  const metal = brushedMetalMaps();
  const rub = rubberMaps();
  const lea = leatherMaps();

  const light = new THREE.Color(v.shell).getHSL({ h: 0, s: 0, l: 0 }).l > 0.5;

  const shell = new THREE.MeshPhysicalMaterial({
    name: "Carcasa",
    color: v.shell,
    metalness: v.metallic ? 0.92 : 0,
    roughness: v.metallic ? 0.16 : light ? 0.3 : 0.24,
    clearcoat: 1,
    clearcoatRoughness: v.metallic ? 0.05 : 0.04,
    normalMap: withRepeat(plastic.normal, 3),
    normalScale: new THREE.Vector2(0.12, 0.12),
    roughnessMap: withRepeat(plastic.roughness, 1),
    specularIntensity: 1,
    envMapIntensity: v.metallic ? 1.4 : 1.1,
  });

  const shellSole = new THREE.MeshPhysicalMaterial({
    name: "Suela carcasa",
    color: v.metallic ? "#1b1c1e" : light ? "#d9d8d2" : "#0d0d0f",
    roughness: 0.62,
    normalMap: withRepeat(tex.normal, 4),
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughnessMap: withRepeat(tex.roughness, 4),
    clearcoat: 0.15,
    clearcoatRoughness: 0.5,
  });

  const springShell = shell.clone();
  springShell.name = "Conchas";
  springShell.color = new THREE.Color(v.metallic ? "#1a1b1d" : light ? v.shell : "#101012");
  springShell.metalness = 0;
  springShell.roughness = 0.38;
  springShell.clearcoat = 0.5;
  springShell.clearcoatRoughness = 0.25;

  const matteBlack = new THREE.MeshPhysicalMaterial({
    name: "Plástico técnico",
    color: "#0f0f11",
    roughness: 0.66,
    normalMap: withRepeat(tex.normal, 5),
    normalScale: new THREE.Vector2(0.6, 0.6),
    roughnessMap: withRepeat(tex.roughness, 5),
  });

  const accent = new THREE.MeshPhysicalMaterial({
    name: "TPU color",
    color: v.accent,
    metalness: v.accentMetallic ? 0.85 : 0,
    roughness: v.accentMetallic ? 0.25 : 0.42,
    clearcoat: 0.6,
    clearcoatRoughness: 0.3,
    sheen: v.accentMetallic ? 0 : 0.3,
    sheenColor: new THREE.Color(v.accent),
    normalMap: withRepeat(plastic.normal, 4),
    normalScale: new THREE.Vector2(0.25, 0.25),
  });

  const spring = new THREE.MeshPhysicalMaterial({
    name: "Muelle elástico",
    color: v.accent,
    metalness: v.accentMetallic ? 0.8 : 0,
    roughness: v.accentMetallic ? 0.3 : 0.38,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
    normalMap: withRepeat(plastic.normal, 2),
    normalScale: new THREE.Vector2(0.15, 0.15),
  });

  const rubber = new THREE.MeshStandardMaterial({
    name: "Caucho",
    color: "#2a2b2e",
    roughness: 0.92,
    normalMap: withRepeat(rub.normal, 3),
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughnessMap: withRepeat(rub.roughness, 3),
  });
  const rubberGrey = rubber.clone();
  rubberGrey.name = "Caucho gris";
  rubberGrey.color = new THREE.Color("#6d7074");

  const fabricMat = new THREE.MeshPhysicalMaterial({
    name: "Tejido 3D mesh",
    color: "#3a3b40",
    map: withRepeat(fabric.color, 6),
    normalMap: withRepeat(fabric.normal, 6),
    normalScale: new THREE.Vector2(0.9, 0.9),
    roughnessMap: withRepeat(fabric.roughness, 6),
    roughness: 0.95,
    sheen: 1,
    sheenRoughness: 0.55,
    sheenColor: new THREE.Color("#5a5d66"),
    side: THREE.DoubleSide,
  });

  const neoprene = new THREE.MeshPhysicalMaterial({
    name: "Neopreno",
    color: "#121214",
    roughness: 0.62,
    normalMap: withRepeat(lea.normal, 4),
    normalScale: new THREE.Vector2(0.5, 0.5),
    roughnessMap: withRepeat(lea.roughness, 4),
    sheen: 0.6,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color("#3c3c44"),
  });

  const webbing = new THREE.MeshPhysicalMaterial({
    name: "Cinta nylon",
    color: "#1a1a1d",
    map: withRepeat(web.color, 22, 1),
    normalMap: withRepeat(web.normal, 22, 1),
    normalScale: new THREE.Vector2(0.8, 0.8),
    roughness: 0.82,
    sheen: 0.8,
    sheenRoughness: 0.4,
    sheenColor: new THREE.Color("#4a4a52"),
  });

  const metalMat = new THREE.MeshPhysicalMaterial({
    name: "Acero cepillado",
    color: "#cfd1d4",
    metalness: 1,
    roughness: 0.32,
    normalMap: withRepeat(metal.normal, 2),
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughnessMap: withRepeat(metal.roughness, 2),
    anisotropy: 0.6,
  });

  const chrome = new THREE.MeshPhysicalMaterial({
    name: "Cromo",
    color: "#e6e8ea",
    metalness: 1,
    roughness: 0.07,
  });

  // Policarbonato ahumado: transparencia simple (sin pasada de transmisión) para
  // mantener el coste de render bajo en móviles.
  const smoked = new THREE.MeshPhysicalMaterial({
    name: "Policarbonato ahumado",
    color: "#3d4a52",
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.88,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    specularIntensity: 1,
  });

  const hole = new THREE.MeshStandardMaterial({
    name: "Hueco",
    color: "#050506",
    roughness: 0.8,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });

  return {
    shell,
    shellSole,
    springShell,
    matteBlack,
    accent,
    spring,
    rubber,
    rubberGrey,
    fabric: fabricMat,
    neoprene,
    webbing,
    metal: metalMat,
    chrome,
    smoked,
    hole,
  };
}

export function disposeBootMaterials(m: BootMaterials) {
  Object.values(m).forEach((mat) => mat.dispose());
}
