# NEO Studio: web de lujo del estudio (plan)

## Context
Pablo dirige un estudio creativo (marca **NEO**). Sus servicios son:
- generación 3D con IA
- webs de autor nivel Awwwards
- vídeos premium con IA
- edición profesional (IA + After Effects + DaVinci)
- automatización de contenido y guiones
- "cine con tu móvil" (Blackmagic Camera, perfiles Log/P3, edición IA)

Quiere una web de marca de lujo (Apple, Rolex, Ferrari) con este embudo: captación → retención → explicación detallada → venta. Debe tener hero con vídeo, fotos de alta calidad y vídeos explicativos en subpáginas, y revelar la información poco a poco, como Apple.

**Decisiones del usuario**
- App nueva e independiente en `/studio` dentro del repo `norteneo`. La app de fitness no se toca.
- Assets reales del cliente.
- Paleta: negro absoluto + blanco + 1 acento.
- Idiomas: ES + EN.
- Ha pedido "continúa con la web, despliega agentes".

**Investigación hecha**
- 9 repos de skills leídos: GSAP oficial, frontend-design, impeccable, taste, ui-ux-pro-max, refactoring-ui, designer-skills, Apple, claudekit. Resumen en el Anexo A.
- 14 webs de referencia analizadas, incluido el código de Oryzo desde un mirror. Anexo B.
- Unos 15 demos Codrops MIT localizados en GitHub. Anexo C.
- Panel de diseño: la propuesta "keynote Apple" está terminada y es la base de esta estructura. Faltan las otras dos propuestas y los jueces; sus mejoras se injertarán al empezar la Fase 1, sin cambiar la estructura aprobada.

**Entorno**
- Contenedor cloud. No hay acceso a `/Users/pablo/...`.
- Las webs externas están bloqueadas: las 6 webs del portfolio y las de referencia.
- GitHub y npm sí funcionan.
- El conector de Drive solo sirve para archivos de unos 2 MB o menos.
- Media recibida por el chat: 11 clips + 1 spot Nike.

## Catálogo de vídeo (recibido)
| Clip | Contenido | Formato | Destino |
|---|---|---|---|
| hf_20260611_235902 | Cuchillo, hierbas, sal y oro flotando; plato con humo (fondo negro) | 2K 16:9, 60 fps, 5 s | **Momento firma** (scroll-scrub) |
| hf_20260612_001610 | Humo rojo → vino en copa, remolino, loop | 720p 16:9, 6 s | Reel del hero (plano de apertura y póster LCP) |
| hf_20260722_211653 | Plano FPV que cruza la cocina hasta un comedor de lujo | 1080p 16:9, 8 s | Reel del hero + caso Restauración |
| hf_20260722_211540 | Spot tacos: brasa, queso, salsa, packshot dorado | 1080p 16:9, 8 s | Tile Vídeo IA + hero de /servicios/video-ia |
| hf_20260722_211811 | Tacos macro, gota de salsa | 2K 16:9, 8 s | Momento propio de Vídeo IA ("Una gota. 480 fotogramas.") |
| hf_20260722_211932 | Flambeado → emplatado de pescado | 1080p 16:9, 8 s | Caso Restauración |
| hf_20260701_022810 | Llave dorada 3D: explosión de oro, cerradura con luz | 1080p 16:9, 6 s | Tile y página 3D IA, caso Inmobiliaria |
| hf_20260713_171749 | Real Empire Estate, teaser (cerradura, ático, logo) | 1080×1920, 7 s | Caso Inmobiliaria (vertical en marco de móvil) |
| hf_20260713_171729 | Real Empire Estate, película de marca | 1080×1920, 15 s | Tile Edición / caso Inmobiliaria. ⚠ textos IA con faltas: usar solo planos sin texto |
| hf_20260815_224703 | Videoclip de moda burdeos | 720×1280, 14 s | Tile Contenido / caso Moda |
| hf_20260630_235219 | UGC IA: selfie en piso nuevo | 1080×1920, 15 s | Página Contenido (UGC IA). No se presenta como grabación real con móvil |
| video_sin_textos | Spot running Nike (textos borrados, manchas visibles) | 720×1280, 16 s | **En espera**: preguntar si es spec propio (etiqueta "Concepto · no oficial") o un anuncio ajeno |

## Estructura aprobable de la web
**Idea rectora:** cada servicio se presenta como un producto Apple. Una idea por pantalla. La web demuestra en vez de afirmar ("Nada de esto se rodó").

**Sistema visual**
- Color: fondo #000, para que los vídeos con fondo negro se fundan con la página. Texto #F5F5F7, secundario #A1A1A6, hairlines blancas al 14 %.
- Acento azul NEO #3D9BFF, usado solo en enlaces "Descubrir", foco y selección. El CTA es una píldora blanca.
- Tipografía: Archivo variable autoalojada. Eje de anchura Expanded para titulares cortos, normal para texto. Metadatos `[ entre corchetes ]` con cifras tabulares.
- Scroll nativo 1:1, sin Lenis. Funciona mejor en las webviews de Instagram y TikTok.

### Mapa del sitio (ES / EN con prefijo /en, prerender estático por ruta)
`/` · `/servicios` (hub + comparador) · `/servicios/{video-ia,3d-ia,webs,edicion,contenido,cine-movil}` · `/trabajo` + `/trabajo/:slug` · `/estudio` · `/contacto?servicio=` · `/legal/{privacidad,aviso-legal,cookies}`

### Home (embudo)
| # | Sección | Etapa | Contenido / titular ES | Asset | Técnica |
|---|---|---|---|---|---|
| 1 | Hero | Captación | **"Cine de lujo. Sin rodaje."** + 1 subtítulo + CTA "Solicitar propuesta" / "Ver trabajo" | Reel de 10–12 s: vino → llave → FPV cocina → ático Real Empire → moda, con fundidos a negro. Versión 16:9 y versión 9:16 para móvil con los clips verticales | Póster AVIF precargado (LCP). SplitText en máscara de líneas, 700 ms expo.out. Botón de pausa |
| 2 | Manifiesto | → Retención | **"Antes, un rodaje. Ahora, criterio."** | Solo tipografía | Máscara de líneas una vez |
| 3 | **Momento firma** (único pin) | Retención / prueba | "Un corte limpio." → "Sal, pimienta, limón." → **"Nada de esto se rodó."** | Gastronomía, secuencia WebP (150 frames en escritorio, 75 en móvil) | Canvas + ScrollTrigger pin scrub 0.3 (OPTIKKA / imageSequenceScrub). En reduced-motion: 3 fotogramas apilados |
| 4 | Servicios (tiles Apple) | Explicación nivel 1 | 6 servicios en formatos distintos: 2 a sangre, 2 filas de 2 columnas. Cada uno con "Descubrir" + "Solicitar propuesta" | Vídeo IA: spot tacos · Webs: grabación (hueco) · 3D: llave · Cine móvil: comparador Log/gradado (hueco) · Contenido: moda 9:16 · Edición: Real Empire | Autoplay en vista, un vídeo a la vez. El comparador antes/después es la única microinteracción |
| 5 | "¿Cuál es para ti?" | Explicación → venta | 5 situaciones → 1–2 servicios recomendados | Tipografía + hairlines discontinuas | GSAP Flip. Sin JS: lista de enlaces |
| 6 | Trabajo | Retención / prueba | **"Hecho y publicado."** Carril por sectores: Restauración, Inmobiliaria, Moda, NEO app, 6 webs | Clips + grabaciones de webs (hueco) | Carril con scroll-snap nativo, sin pin. Vídeo en hover o al centrarse |
| 7 | Hecho por personas | Confianza | **"La IA genera. Nosotros decidimos."** | Foto de Pablo (hueco) | Quieto a propósito |
| 8 | Testimonios | Venta | Tabla tipo ficha técnica | Solo si hay ≥2 testimonios reales | Sin animación |
| 9 | Cierre (peak-end) | Venta | **"Todo esto lo hizo NEO. Imagina tu marca."** + CTA magnético + Reservar llamada / WhatsApp | Partículas de polvo dorado | Se reutiliza `ParticleField` (src/components/CinematicOnboarding.tsx:27-109). Imagen fija en gama baja |

### Subpágina de servicio (una plantilla, datos por servicio)
1. Nav local fija.
2. Hero con vídeo.
3. "Míralo en 60 segundos": vídeo explicativo (hueco) con subtítulos VTT ES/EN.
4. Tres capítulos (afirmación + interacción + prueba), con el momento propio del servicio como único pin.
5. Proceso.
6. Ejemplos filtrados.
7. Ficha técnica.
8. FAQ (derechos de uso y etiquetado de contenido IA).
9. "Combina con".
10. CTA con el servicio ya marcado.

Momento propio de cada servicio:
- Vídeo IA: scrub de la gota de tacos + slider start/end frame.
- 3D IA: scrub de la llave hasta la cerradura con luz. Visor GLB cuando haya modelo.
- Webs: grabación de pantalla sincronizada con el scroll.
- Edición: el mismo clip con 3 montajes intercambiables.
- Contenido: pieza vertical + su guion iluminándose línea a línea.
- Cine móvil: comparador Log ↔ gradado + ficha de ajustes Blackmagic Camera.

### Conversión
- Sin precios públicos.
- `/contacto`: brief guiado en 5 pasos:
  1. servicio
  2. marca y sector
  3. objetivo, plazo y rango opcional
  4. referencias
  5. contacto + RGPD
- El brief guarda borrador local. Sin JS se muestra como formulario largo.
- Envío a un endpoint configurable (`VITE_LEAD_ENDPOINT`). Si no hay endpoint, se abre un email o WhatsApp prellenado.
- Confirmación con reserva de llamada (Cal.com).
- Nav: wordmark NEO, Trabajo, Servicios, Estudio, Contacto, ES/EN y píldora "Propuesta".
- Menú móvil con clip-path (EaseReverseClipMenu). Sin preloader bloqueante.
- Transiciones con View Transitions (elemento compartido tile → hero) y fundido a negro como fallback.

### Presupuesto de motion
- **Se anima:** máscaras de titulares, el scrub firma, vídeos en vista, Flip del selector, carril de trabajo, menú, transición de página, partículas del cierre y 2 CTAs magnéticos.
- **Quieto a propósito:** texto de cuerpo, tiles, la sección "personas", tablas, formularios y la retícula de /trabajo.

## Implementación (paso a paso, con agentes)
Todo en la rama `claude/loving-mccarthy-a2vw6l`. Al final de cada fase: commit + push, PR en borrador y capturas para Pablo.

### Fase 0: cimientos (yo, secuencial)
1. **Scaffold de `studio/`**
   - Stack: Vite 7, React 19, TS, Tailwind v4, react-router-dom 6, vite-react-ssg (prerender ES/EN), gsap 3.15, @gsap/react, @fontsource-variable/archivo.
   - Tokens en `studio/src/styles/tokens.css` y `vercel.json`.
2. **Infraestructura de animación** en `studio/src/lib/motion.ts`: registerPlugin una sola vez (ScrollTrigger, SplitText, Flip), helpers de `gsap.matchMedia` para reduced-motion y `useSplitReveal`.
3. **Componentes base**
   - Layout, Nav, MobileMenu, Footer, Button (con `useMagnetic` vía gsap.quickTo).
   - `Video`: AV1/H.264, póster, pausa, IntersectionObserver.
   - `PhoneFrame`, `Meta [ ]`, `Section`.
4. **i18n por rutas** con diccionarios TS separados por sección: `studio/src/content/{es,en}/*.ts`. Así cada agente toca archivos distintos.
5. **Pipeline de media** en `studio/scripts/media.sh` (ffmpeg):
   - H.264 CRF ~23 + AV1 (svt) en 1080p y 720p, con faststart y sin audio en los loops.
   - Pósters AVIF + JPG.
   - Secuencias WebP para los scrubs.
   - Montaje del reel del hero en 16:9 y 9:16.
   - Presupuesto: escritorio ≤6 MB por scrub, móvil ≤2 MB.
   - Los originales HEVC se quedan fuera de git; solo se commitean las versiones optimizadas en `studio/public/media/`.
   - Antes de empezar, borrar el resultado temporal de la prueba de Drive en `~/.claude/projects/.../tool-results/`.
6. **Stubs** de cada sección y página (archivos vacíos con su contrato de props y claves de contenido), para que los agentes trabajen en paralelo sin conflictos.

### Fase 1: construcción en paralelo (Workflow, menos de 10 agentes, archivos disjuntos)
- Agente Hero + Manifiesto.
- Agente Momento firma (canvas scrub).
- Agente Tiles de servicios + comparador antes/después.
- Agente "¿Cuál es para ti?" + Trabajo (carril).
- Agente Cierre + partículas + Footer.
- Agente plantilla de servicio + datos de los 6 servicios.
- Agente /trabajo + /trabajo/:slug + /estudio.
- Agente /contacto (brief) + legal.

Cada agente sigue el reglamento del Anexo A y usa `useGSAP` con scope. Entrega su componente, su contenido ES/EN y su variante de reduced-motion.

### Fase 2: verificación adversarial (Workflow)
Revisores con lentes distintas, y bucle de corrección hasta que no quede nada:
1. QA visual con capturas Playwright (Chromium preinstalado) a 375, 768, 1024 y 1440, en ES y EN.
2. Accesibilidad con axe-core, foco, reduced-motion y prueba sin JS.
3. Rendimiento: tamaño de bundle y media, LCP/CLS con Lighthouse sobre `vite preview`.
4. Cumplimiento del reglamento anti-"AI slop" y del copy.

### Fase 3: entrega
- `npm run build` limpio, lint y typecheck.
- Push y PR en borrador.
- Instrucciones para importar `studio/` en Vercel (las webs de Pablo ya están en Vercel).
- Capturas finales a Pablo.

## Verificación
- `cd studio && npm ci && npm run lint && npm run typecheck && npm run build`: el prerender genera HTML por cada ruta ES/EN.
- `npm run preview` + script Playwright (`studio/scripts/qa.mjs`): recorre todas las rutas, hace capturas por breakpoint y falla si hay errores de consola, scroll horizontal o violaciones axe.
- Lighthouse móvil sobre `/` y una subpágina: LCP <2,5 s, CLS <0,1.
- Comprobación manual de reduced-motion (emulado en Playwright) y del scrub en viewport móvil.

## Pendiente del cliente (no bloquea; se usan huecos sin datos inventados)
- Logo NEO en SVG/PNG (por Drive vale si pesa menos de 2 MB).
- Nombre de marca: "NEO" o "NEO Studio".
- Email, WhatsApp y enlace de reserva.
- Grabaciones de pantalla o capturas de las 6 webs.
- Foto de Pablo / estudio.
- Par Log/gradado.
- Vídeos explicativos.
- Spot Nike: aclarar autoría.
- Datos legales (aviso legal LSSI).

## Anexo A: reglamento de diseño (de las skills)
- **Un único momento firma.** Primera pantalla = tesis + prueba. Nada de fade-up genérico. Máximo 1–2 pins por página.
- **Tipografía:**
  - Evitar Inter, Playfair, Cormorant, Instrument Serif, DM Sans y Space Grotesk.
  - Hero de ≤2 líneas, subtítulo de ≤20 palabras, CTA visible sin scroll, texto a 65ch.
  - Tracking de display entre -0,02 y -0,04 em.
- **Motion:**
  - expo.out o cubic-bezier(0.16,1,0.3,1). Entradas de 500–800 ms; salidas al 60–70 % de esa duración.
  - Stagger de 30–50 ms con ≤8 elementos. Sin bounce, sin cursor custom, magnético solo en 2 CTAs.
- **GSAP:**
  - `useGSAP` con scope y `contextSafe`; registerPlugin a nivel de módulo; `matchMedia` para reduced-motion.
  - ScrollTrigger en timeline top-level; scrub o toggleActions, nunca los dos; no animar el elemento pineado.
  - SplitText con `autoSplit` + `onSplit`. Reveals con `ScrollTrigger.batch`. `refresh()` tras fuentes e imágenes. Sin markers.
  - No mezclar framer-motion con GSAP en el mismo árbol.
- **Copy:** sin eyebrows en mayúsculas, sin numeración 01/02 decorativa, sin 3 tarjetas iguales, sin gradientes en texto, sin glass decorativo, sin métricas inventadas, sin "Elevate/Seamless", sin em-dashes y sin "→" pegado. CTAs de ≤3 palabras.
- **Accesibilidad:** contraste ≥4,5:1, foco visible, targets de 44 px, vídeo con pausa y póster, contenido visible sin JS.
- **Rendimiento:** LCP <2,5 s, CLS <0,1, AVIF/WebP, Three solo en lazy (en la home no hace falta).

## Anexo B: referencias (lo que se toma)
- **Oryzo:** paleta mínima, una familia tipográfica, capítulo = afirmación + interacción + dato, hairlines discontinuas, metadatos `[ ]`, revelación final + partículas. Se descarta su sátira.
- **The Watch:** un protagonista generado con IA llevado por el scroll.
- **Igloo:** pocas secciones y footer de partículas.
- **Orano:** hub → historia → mini-interacción.
- **anime.js:** la web es la demo y el scroll es nativo.
- **Likova:** cada efecto cuenta una historia.

## Anexo C: Codrops / GitHub (MIT) por pieza
| Pieza | Fuente |
|---|---|
| Scroll-scrub | caso OPTIKKA + gsap imageSequenceScrub |
| Menú | codrops/EaseReverseClipMenu |
| Tipografía | codrops/ScrollTextMotion |
| Carril | davidfaure/horizontal-parallax-gallery-codrops (versión DOM) |
| Reveals | Hiro-kiii/Scroll-Transition, codrops/FullscreenClipEffect |
| Magnético | codrops/MagneticButtons → `useMagnetic` |
| Partículas | `ParticleField` del repo |

Mantener el aviso MIT. No incluir las fuentes Typekit ni las imágenes de los demos.
