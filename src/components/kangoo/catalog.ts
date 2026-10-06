/**
 * Catálogo de piezas y variantes de color del modelo Kangoo Jumps KJ-XR3.
 * Los offsets de despiece están en unidades de ensamblaje (1 u ≈ 10 cm).
 */

export type PartId =
  | "shell"
  | "liner"
  | "tongue"
  | "cuff"
  | "strap"
  | "cuffBuckle"
  | "instepBuckle"
  | "rivets"
  | "basePlate"
  | "heelWedges"
  | "screws"
  | "upperShell"
  | "frontClip"
  | "springs"
  | "anchors"
  | "lowerShell"
  | "rubberPad";

export type PartGroupId = "bota" | "cierres" | "muelle";

export interface PartDef {
  id: PartId;
  name: string;
  group: PartGroupId;
  material: string;
  description: string;
  /** Desplazamiento en despiece total. */
  offset: [number, number, number];
  /** 0 = sale primero, 1 = sale el último. */
  order: number;
}

export const PART_GROUPS: Record<PartGroupId, string> = {
  bota: "Bota",
  cierres: "Cierres y fijaciones",
  muelle: "Sistema de rebote",
};

export const PARTS: PartDef[] = [
  {
    id: "shell",
    name: "Carcasa inferior",
    group: "bota",
    material: "Polímero técnico inyectado, acabado brillo + suela mate",
    description:
      "Estructura rígida que envuelve el pie. Las aberturas ovaladas de la puntera ventilan y aligeran la bota; la suela mate apoya sobre la placa base.",
    offset: [0, 0, 0],
    order: 1,
  },
  {
    id: "liner",
    name: "Botín interior",
    group: "bota",
    material: "Tejido 3D mesh transpirable + espuma",
    description: "Forro acolchado extraíble que se adapta al pie y absorbe la humedad.",
    offset: [-0.3, 1.8, 0],
    order: 0.3,
  },
  {
    id: "tongue",
    name: "Lengüeta KJ",
    group: "bota",
    material: "Neopreno con logotipo KJ en relieve",
    description: "Lengüeta alta y acolchada que reparte la presión de las hebillas sobre el empeine y la tibia.",
    offset: [1.7, 0.8, 0],
    order: 0.2,
  },
  {
    id: "cuff",
    name: "Caña articulada",
    group: "bota",
    material: "Polímero técnico inyectado, acabado brillo",
    description: "Pieza superior que sujeta el tobillo. Pivota sobre los remaches y acompaña la flexión del salto.",
    offset: [-1.6, 0.4, 0],
    order: 0.35,
  },
  {
    id: "strap",
    name: "Cinta de velcro (power strap)",
    group: "cierres",
    material: "Cinta de nylon en sarga + hebilla ahumada",
    description: "Cierra la parte alta de la caña y fija la pierna al botín.",
    offset: [-1.6, 1.25, 0],
    order: 0,
  },
  {
    id: "cuffBuckle",
    name: "Hebilla de la caña",
    group: "cierres",
    material: "Palanca de policarbonato ahumado + arco de acero",
    description: "Cierre micrométrico que ajusta la caña sobre el tobillo.",
    offset: [-0.6, 0.35, 1.1],
    order: 0.08,
  },
  {
    id: "instepBuckle",
    name: "Hebilla del empeine",
    group: "cierres",
    material: "Palanca de policarbonato ahumado + arco de acero",
    description: "Ajusta la carcasa sobre el empeine para que el pie no se desplace al rebotar.",
    offset: [0.4, 0.8, 1.0],
    order: 0.08,
  },
  {
    id: "rivets",
    name: "Remaches pivotantes",
    group: "cierres",
    material: "Acero inoxidable cepillado",
    description: "Ejes de giro que unen la caña con la carcasa a ambos lados del tobillo.",
    offset: [0, 0, 1],
    order: 0.25,
  },
  {
    id: "basePlate",
    name: "Placa base",
    group: "muelle",
    material: "Polímero técnico mate texturizado",
    description: "Une la bota con el sistema de rebote y reparte la carga en toda la planta.",
    offset: [0.25, -0.65, 0],
    order: 0.75,
  },
  {
    id: "heelWedges",
    name: "Topes de talón y central",
    group: "muelle",
    material: "TPU de color",
    description:
      "Topes de color entre la suela y el arco: los laterales del talón evitan torsiones y el central limita la compresión.",
    offset: [-0.2, -0.7, 0.85],
    order: 0.55,
  },
  {
    id: "screws",
    name: "Tornillería de fijación",
    group: "muelle",
    material: "Acero zincado, cabeza Allen",
    description: "Fijan la placa base y la carcasa a la concha superior.",
    offset: [0.35, -1.0, 0],
    order: 0.7,
  },
  {
    id: "upperShell",
    name: "Concha superior",
    group: "muelle",
    material: "Polímero de alta resistencia",
    description:
      "Arco superior: va atornillado bajo la placa base, baja por detrás del talón hasta la pletina trasera y por delante hasta el clip.",
    offset: [0.5, -1.35, 0],
    order: 0.6,
  },
  {
    id: "frontClip",
    name: "Clip delantero",
    group: "muelle",
    material: "TPU de color",
    description: "Articulación delantera que une la concha superior con la inferior y guía las gomas.",
    offset: [1.55, -1.45, 0],
    order: 0.45,
  },
  {
    id: "springs",
    name: "Muelles elásticos",
    group: "muelle",
    material: "Elastómero de alta resiliencia",
    description:
      "Dos pares de gomas tensan el arco y devuelven la energía del salto. Su dureza se elige según el peso del usuario.",
    offset: [0.6, -1.75, 0.75],
    order: 0.2,
  },
  {
    id: "anchors",
    name: "Anclajes y pletina trasera",
    group: "muelle",
    material: "Polímero + pasador de acero",
    description:
      "Pletina que cierra el óvalo uniendo las dos conchas por detrás y postes donde se enganchan los muelles.",
    offset: [0.75, -1.95, 0],
    order: 0.3,
  },
  {
    id: "lowerShell",
    name: "Concha inferior",
    group: "muelle",
    material: "Polímero de alta resistencia",
    description: "Arco de rebote que se deforma al aterrizar y recupera su forma gracias a los muelles.",
    offset: [0.75, -2.25, 0],
    order: 0.4,
  },
  {
    id: "rubberPad",
    name: "Suela de goma",
    group: "muelle",
    material: "Caucho antideslizante con tacos",
    description: "Pisada amortiguada con tacos de agarre; se sustituye cuando se desgasta.",
    offset: [0.9, -2.75, 0],
    order: 0.15,
  },
];

/** Desplazamiento vertical para centrar la bota montada en el origen. */
export const BOOT_Y_OFFSET = -0.5;

export const PARTS_BY_ID = Object.fromEntries(PARTS.map((p) => [p.id, p])) as Record<PartId, PartDef>;

export interface BootVariant {
  id: string;
  name: string;
  /** Color de carcasa, caña y conchas. */
  shell: string;
  /** Carcasa metalizada (cromo/plata). */
  metallic?: boolean;
  /** Color de muelles, clip y topes. */
  accent: string;
  accentMetallic?: boolean;
}

export const VARIANTS: BootVariant[] = [
  { id: "negro-naranja", name: "Negro · Naranja", shell: "#0b0b0d", accent: "#ff5a12" },
  { id: "negro-rosa", name: "Negro · Rosa", shell: "#0b0b0d", accent: "#ff3fa4" },
  { id: "negro-amarillo", name: "Negro · Amarillo", shell: "#0b0b0d", accent: "#d8f01c" },
  { id: "negro-gris", name: "Negro · Gris", shell: "#0b0b0d", accent: "#8e9399" },
  { id: "blanco-rosa", name: "Blanco · Rosa", shell: "#ecebe6", accent: "#ff3fa4" },
  { id: "blanco-negro", name: "Blanco · Negro", shell: "#ecebe6", accent: "#18181a" },
  { id: "plata", name: "Plata", shell: "#c9cacc", metallic: true, accent: "#b5b8bc", accentMetallic: true },
];

/** Altura del suelo (bajo la suela de goma) en coordenadas de escena. */
export const bootFloorY = (explode: number) => -1.86 + BOOT_Y_OFFSET + PARTS_BY_ID.rubberPad.offset[1] * explode;
