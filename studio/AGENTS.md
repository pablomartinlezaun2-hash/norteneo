# NEO Studio · guía de construcción para agentes

Web de lujo de **NEO Studio**, el estudio creativo de Pablo: vídeo con IA, 3D con IA, webs de autor, postproducción (IA + After Effects + DaVinci), contenido para redes y "cine con tu móvil". Tono: Apple, Rolex, Ferrari. Embudo: captación → retención → explicación detallada → venta.

**Documentos de referencia** (léelos para tu parte):
- `docs/plan-aprobado.md`: plan aprobado. Manda en rutas y estructura.
- `docs/estructura-panel.md`: síntesis del panel de diseño, ganadora "maison de lujo". Úsala para **copy, detalles y comportamiento**. Si contradice esta guía, gana esta guía.

## 1. Reglas de oro (obligatorias)

### Arte de dirección
- Un único momento firma por página. El resto es sobrio.
- Nada de fade-up genérico en cada bloque.
- Máximo 1–2 secciones `pin` por página.

### Tipografía
- Una sola familia: Archivo variable, con eje de anchura.
- Utilidades de tamaño: `type-hero`, `type-display`, `type-title`, `type-lead`, `type-body`, `type-small`, `type-meta`.
- Titulares en *sentence case*. Nada de eyebrows en MAYÚSCULAS.
- Hero de ≤2 líneas y subtítulo de ≤20 palabras. Medida de lectura de 65ch (`measure`).

### Color
| Token | Valor | Uso |
|---|---|---|
| `ink` | `#000` | Fondo |
| `paper` | `#f5f5f7` | Texto |
| `mute` | `#a1a1a6` | Texto secundario |
| `dim` | `#86868b` | Texto terciario pequeño |
| `line` / `line-strong` | — | Hairlines |
| `accent` | `#3d9bff` | Solo enlaces "Descubrir", foco, estados activos, el asterisco y el punto REC |
| `light` / `light-ink` | — | Solo la sección "Cliente privado" |

- El CTA principal es una píldora blanca (`<Cta variant="primary">`).

### Motion
- Easings `expo.out` / `cubic-bezier(0.16,1,0.3,1)`.
- Duraciones: entradas de 500–800 ms; salidas al 60–70 %.
- Stagger de 30–50 ms con ≤8 elementos.
- Sin bounce/elastic, sin cursor custom, sin scroll hijacking. Scroll nativo, sin Lenis.
- Magnético solo en 2 CTAs de toda la web: el del hero y el del cliente privado o cierre.

### GSAP
- Importa siempre desde `@/lib/motion` (plugins ya registrados: ScrollTrigger, SplitText, Flip).
- Todo el código va dentro de `useGSAP(() => {...}, { scope: ref })`. Los handlers posteriores van con `contextSafe`.
- Usa `gsap.matchMedia()` con `MQ.motion` / `MQ.reduce` / `MQ.desktop`. No anides `gsap.context` dentro.
- ScrollTrigger va en timelines o tweens de nivel superior. Usa `scrub` o `toggleActions`, nunca los dos.
- No animes el elemento pineado: anima sus hijos.
- Nada de `markers` y nada de `window.addEventListener('scroll')`.
- Titulares: usa `useSplitReveal(ref)` (máscara de líneas). Con `{ on: 'load', delay: heroDelay() }` en el hero.
- **No uses framer-motion** (no está instalado ni se debe instalar).

### Accesibilidad
- Cada sección necesita una variante diseñada de `prefers-reduced-motion`: estado final legible, sin pins ni scrub, vídeos en póster con play.
- Contenido visible sin JS.
- Foco visible, objetivos táctiles ≥44 px, contraste ≥4,5:1.
- Los vídeos que se reproducen solos llevan botón de pausa: `<Video controls>` ya lo trae.

### Rendimiento
- No metas Three.js.
- Los vídeos se cargan con `<Video>`: póster primero, `preload=none` y reproducción en vista.
- Medios con dimensiones fijas (`aspect-*`) para CLS 0.

### Copy (ES principal, EN de calidad nativa)
- **Prohibido inventar** métricas, clientes, testimonios, premios o años.
- Si falta un dato, el bloque no se renderiza o usa la variante tipográfica sin hueco vacío.
- Prohibido: em-dashes (—), "Elevate / Seamless / Unleash / Next-gen", "→" pegado al texto, numeración decorativa 01/02, tres tarjetas iguales icono + título + texto, gradientes en texto y glass decorativo.
- CTAs de ≤3 palabras: "Solicitar propuesta", "Ver trabajo", "Descubrir".
- **Transparencia IA:** las piezas generadas llevan una etiqueta discreta `<Meta>Generado con IA, dirigido por NEO</Meta>` (EN: "AI-generated, directed by NEO").
- El spot "Running" es un concepto de una marca que no es cliente: etiqueta "Concepto · no oficial" / "Concept · unofficial". No muestres el nombre de la marca en texto.

### Hilo de marca
El titular del hero termina en un asterisco azul: **"Imagen de lujo, sin plató\*"**. El cierre (Closing) lo resuelve:
- Primera frase: "\*Ningún plato, copa ni abrigo de esta página pasó por un plató. Todo lo dirigió NEO."
- Segunda frase: "Imagina tu marca."

## 2. Comandos y entorno (¡importante, trabajamos 5 agentes a la vez en el mismo árbol!)

**Puedes ejecutar:**
- `npx tsc -b --noEmit`: typecheck de todo. Si falla en archivos que no son tuyos, ignóralo y dilo en tu informe.
- `npx eslint <tus archivos>`.
- Capturas contra el servidor de desarrollo compartido, que ya está arrancado en `http://127.0.0.1:5174` (modo CSR con HMR):
  `BASE_URL=http://127.0.0.1:5174 node scripts/shot.mjs <ruta> qa-output/<tu-agente>/<nombre>.png <ancho> <alto> [--full] [--scroll=PX] [--reduced] [--wait=MS]`
  - El script imprime los errores de consola y si hay scroll horizontal.
  - Comprueba **375×812** y **1440×900**, en **ES y EN** y con `--reduced`.
  - Mira las capturas con la herramienta de leer imágenes.
  - El Chromium de pruebas no reproduce H.264, pero sí AV1, que es la primera fuente.

**Prohibido:**
- `npm install` o añadir dependencias.
- `npm run build` o `npm run dev`, y arrancar otro servidor.
- Modificar archivos que no sean tuyos (ver sección 5).
- Hacer commits. Los hace el coordinador.

Si necesitas un cambio en un componente compartido, crea una variante local dentro de tus archivos o descríbelo en tu informe final.

## 3. Piezas compartidas (ya hechas, úsalas)

| Import | Qué es |
|---|---|
| `@/i18n` | `useLang()`, `useCopy({es,en})`, `type L<T>`, `pick()` |
| `@/i18n/paths` | `to.home/services/service(lang,id)/work/case(lang,slug)/studio/contact(lang,serviceId?)/thanks/legal(lang,id)`, `alternatePath()`. **Nunca escribas rutas a mano.** |
| `@/content/site` | `site.name/url/whatsapp/email/leadEndpoint/instagram`, `whatsappHref(msg)`. Pueden estar vacíos: oculta el canal si lo están |
| `@/content/services` | Los 6 servicios: `id`, `slug`, `name`, `line`, `format`, `media`. También `serviceById`, `serviceBySlug` |
| `@/content/cases` | Casos: `kind` client / study / concept / own, `sector`, `services`, `media`, `gallery`, `url`. También `sectors`, `caseBySlug`, `casesFor` |
| `@/lib/media` | `getMedia(id)`, `frameUrl(seq, n)`, tipos. Manifiesto en `src/content/media.json` |
| `@/lib/motion` | `gsap`, `ScrollTrigger`, `SplitText`, `Flip`, `useGSAP`, `MQ`, `DUR`, `EASE`, `STAGGER`, `heroDelay()`, `prefersReducedMotion()` |
| `@/hooks/useSplitReveal` | Revelado de titulares por líneas enmascaradas |
| `@/hooks/useMagnetic` | Magnetismo (solo 2 CTAs) |
| `@/hooks/useMediaQuery` | `useMediaQuery(q)`, `useReducedMotion()` |
| `@/hooks/useInView` | IntersectionObserver |
| `@/components/Video` | `<Video media="reel-land" portrait="reel-port" priority label="…" controls exclusive play="inview" fit="cover" className="aspect-video" />` |
| `@/components/ImageSequence` | Canvas para scroll-scrub. Detalle debajo |
| `@/components/BeforeAfter` | Comparador accesible (range nativo). `before` y `after` son nodos (`<Video>`, `<img>`…) |
| `@/components/PhoneFrame` | Marco de móvil para piezas 9:16 |
| `@/components/Meta` | `[ … ]` en `type-meta` |
| `@/components/Cta` | `<Cta to variant="primary" \| "ghost" \| "text" \| "dark" magnetic>` y `<DiscoverLink to>` (acento azul con chevron) |
| `@/components/Logo` | Wordmark NEO en SVG |
| `@/components/Seo` | `<Seo title description noindex jsonLd />`: título, canonical, hreflang, OG |

**Uso de `ImageSequence`:**
```tsx
const seq = useRef<ImageSequenceHandle>(null)
<ImageSequence ref={seq} media="gastro" fit="contain" label="…" />
// ScrollTrigger:
onUpdate: (st) => seq.current?.render(st.progress)
```
- `setFocus(x)` cambia el punto focal en modo cover.
- `variant`: `auto` / `desktop` / `mobile`.
- Las secuencias disponibles son `gastro`, `tacos-drop` y `golden-key`, con variantes desktop y mobile. Mira `seq` en `media.json`.

## 4. Catálogo de medios (IDs de `media.json`)

| ID | Contenido | Formato |
|---|---|---|
| `reel-land` / `reel-port` | Reel del hero: vino → cuchillo y oro → llave → comedor de lujo (16:9) / moda → gastronomía → ático → llave (9:16) | 10 s, loop |
| `gastro` | Cuchillo, hierbas, sal y piel de limón flotando en bokeh dorado; plato con humo y copa. Fondo negro. **Secuencia: escritorio 150 frames 1280×720 contain, móvil 75 frames 960×540 contain** | 16:9, 5 s |
| `wine` | Humo rojo que se convierte en vino en una copa sobre mármol negro (loop) | 16:9, 6 s |
| `fpv-kitchen` | Plano FPV que cruza una cocina profesional hasta un comedor de lujo con lámpara de araña | 16:9, 8 s |
| `tacos-spot` | Spot de tacos: brasa, queso fundido, salsa, packshot dorado | 16:9, 8 s |
| `tacos-drop` | Macro de una gota de salsa sobre tacos. **Secuencia: 160 / 80 frames (móvil 640×800 cover)** | 16:9, 8 s |
| `flambe` | Flambeado y emplatado de pescado sobre fondo negro | 16:9, 8 s |
| `golden-key` | Llave dorada 3D: explosión de oro, arena, cerradura con luz, packshot. **Secuencia: 150 / 75 frames (móvil 640×800 cover)** | 16:9, 6 s |
| `empire-teaser` | Real Empire Estate: cerradura cian, escalera de cristal, ático, logo | 9:16, 7 s |
| `empire-film` | Real Empire Estate, montaje limpio sin textos con faltas: llave, pasillo, "VENDER", "ALQUILAR", ciudad, logo con anillos | 9:16, ~11 s |
| `fashion` | Videoclip de moda: abrigo burdeos, trono, bailarinas | 9:16, 14 s |
| `ugc-move` | UGC generado con IA: chica grabándose en su piso nuevo | 9:16, 15 s |
| `running` | Spot de running de concepto (no oficial) | 9:16, 16 s |
| `logo` | Animación original del logo NEO sobre negro (con reflejo) | 16:9, 5 s |

**Huecos pendientes** (no inventes nada; diseña el bloque para que funcione sin ellos):
- grabaciones de pantalla de las 6 webs
- foto de Pablo
- par Log/gradado para el comparador
- vídeos explicativos de 60 s
- testimonios

## 5. Reparto de archivos (cada agente solo toca lo suyo)

| Agente | Archivos propios |
|---|---|
| **A1 · Hero + Manifiesto + La Mesa** | `src/sections/home/Hero.tsx`, `Manifesto.tsx`, `Signature.tsx` y cualquier archivo nuevo en `src/sections/home/hero/` |
| **A2 · La Casa + Atelier + Cliente privado + hub de servicios** | `src/sections/home/House.tsx`, `Atelier.tsx`, `PrivateClient.tsx`, `src/pages/ServicesHub.tsx` y nuevos en `src/sections/house/` |
| **A3 · Webs + Colección + Cierre + Footer** | `src/sections/home/WebsRail.tsx`, `Collection.tsx`, `Closing.tsx`, `src/components/Footer.tsx` y nuevos en `src/sections/closing/` |
| **A4 · Páginas de servicio** | `src/pages/Service.tsx`, `src/content/services/*.ts` (detalle por servicio) y nuevos en `src/sections/service/` |
| **A5 · Trabajo + casos + estudio + contacto + legal + 404** | `src/pages/Work.tsx`, `Case.tsx`, `Studio.tsx`, `Contact.tsx`, `Thanks.tsx`, `Legal.tsx`, `NotFound.tsx` y nuevos en `src/sections/work/`, `src/sections/contact/`, `src/content/legal/` |

Archivos compartidos, **solo el coordinador**: `src/components/*` (salvo Footer para A3), `src/lib/*`, `src/hooks/*`, `src/i18n/*`, `src/content/{site,services,cases,media}.*`, `src/routes.tsx`, `src/pages/Home.tsx`, `src/styles/global.css`.

Necesitas clases nuevas: usa utilidades de Tailwind v4 en línea. Nada de CSS global.

## 6. Definición de terminado
1. Funciona en ES y EN (`/…` y `/en/…`) con copy completo en ambos idiomas.
2. Capturas revisadas a 375 y 1440, y con `--reduced`: sin errores de consola y sin scroll horizontal.
3. `npx tsc -b --noEmit` limpio en tus archivos y `npx eslint <tus archivos>` limpio.
4. Informe final breve:
   - qué hiciste
   - decisiones de diseño
   - rutas de las capturas clave
   - cualquier cambio que necesites en archivos compartidos
   - datos pendientes del cliente
