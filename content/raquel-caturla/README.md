# Contenido para @raquelcaturlaoficial

Paquete de contenido para Instagram: análisis de marca, estrategia y calendario de 4 semanas, guiones a cámara y **piezas de motion graphics ya renderizadas** (Reels 9:16 con locución, música y SFX sincronizados, carrusel, portadas y rótulo con canal alfa). Todo sale de código: cambiar la identidad o un texto y volver a renderizar es un comando.

> ⚠️ **Identidad visual provisional.** Instagram y la carpeta de Drive no eran accesibles desde el entorno de producción. La paleta y las tipografías son una propuesta coherente con la marca (ver `docs/01-analisis-marca.md`), no una extracción del perfil. Se cambian en un solo archivo: `brand/tokens.css`.

## Entregables

| Archivo | Qué es | Specs |
|---|---|---|
| `renders/01-manifiesto.mp4` | Reel · «Deja de entrenar para castigarte» → «Más conciencia» | 15,4 s · 1080×1920 · 30 fps · H.264 + AAC 48 kHz · −14 LUFS · locución NEO JBQ 2 |
| `renders/02-impacto-articular.mp4` | Reel · infografía «¿Te duelen las rodillas al correr?» (−80 %*, dato del fabricante) | 19,1 s · ídem |
| `renders/03-academia-rc-rise.mp4` | Reel · «De cero a instructora oficial en 4 semanas» | 19,5 s · ídem |
| `renders/04-habitos-sistema.mp4` | Reel · «No te falta fuerza de voluntad. Te falta un sistema.» | 22,6 s · ídem |
| `renders/0X-*-portada.jpg` · `renders/00-vista-grid-portadas.jpg` | Portada de cada Reel (texto dentro del recorte 3:4 del grid) + simulación del grid | 1080×1920 · JPEG 95 |
| `renders/05-carrusel-01…06.jpg` | Carrusel «¿Entrenas desde la exigencia o desde la conciencia?» | 6 × 1080×1350 · JPEG 95 |
| `renders/06-overlay-lower-third.mov` / `.webm` / `-sfx.wav` | Rótulo de nombre con alfa para vídeos a cámara | 5 s · QuickTime PNG con alfa (Premiere, After Effects, DaVinci) · WebM VP9 con alfa (CapCut, web) |
| `motion/vo/*.mp3` · `*.json` | Locuciones originales de ElevenLabs (voz «NEO JBQ 2», español peninsular) y tiempos de cada frase | MP3 44,1 kHz |
| `docs/01-analisis-marca.md` | Quién es, posicionamiento, audiencias, tono, pilares, sistema visual y sonoro | |
| `docs/02-estrategia-y-calendario.md` | KPIs, calendario de 4 semanas, copys con hashtags y texto alternativo, checklist | |
| `docs/03-guiones-talking-head.md` | 6 guiones a cámara con tiempos, planos, SFX y notas de edición | |
| `docs/04-flujo-edicion-pro.md` | Flujo pro para su material a cámara: corte, subtítulos, color en DaVinci, audio, overlays, Premiere MCP, exportación y QC | |

## Cómo está hecho

- **Composición:** cada pieza es un HTML con CSS y GSAP (`motion/compositions/*.html`). El texto es DOM real, no imágenes generadas por IA, así que cada palabra o letra se anima por separado.
- **Render determinista:** `motion/scripts/render.mjs` abre la composición en Chromium (Playwright), avanza el timeline fotograma a fotograma y captura 4 subfotogramas por fotograma, que ffmpeg promedia (`tmix`) para dar *motion blur* real de obturador 180°. Renderiza en paralelo por tramos.
- **Sonido:** cada animación registra sus *cues* (`S.cue('pop', t)`) y `motion/audio/synth.py` sintetiza la base musical (120 BPM, intro → groove → build → silencio → drop → outro) y los SFX en el instante exacto del cambio visual. No hay samples ni licencias de terceros. Al final se normaliza a −14 LUFS.
- **Locución:** voz clonada «NEO JBQ 2» de ElevenLabs (`eleven_multilingual_v2`). `scripts/prep_vo.py` corta cada MP3 por frases y la composición ancla cada frase a su animación con `S.voSync()`. Si una frase no ha terminado cuando toca la siguiente, el montaje espera a la voz (desplaza el resto del timeline, la música y los SFX). Bajo la voz, la música baja unos 11 dB (*ducking*).
- **Reglas de casa:** easing y tiempos medidos, opacidad en 2 fotogramas, tarjetas opacas, salidas al 60–70 % de la entrada, golpe de cámara en los cortes, deriva ambiental y grano. Detalle en `docs/01-analisis-marca.md` §6.

## Descargar todo

- **ZIP completo:** `raquel-caturla-contenido.zip` (te lo paso en la conversación; no se sube al repo para no duplicar binarios) con vídeos, portadas, carrusel, overlay, locuciones y documentos.
- **Desde GitHub:** en la rama `claude/festive-sagan-yzx2y0` del repo `norteneo`, abre la carpeta `content/raquel-caturla/renders/` y descarga cada archivo («Download raw file»), o descarga el repo entero con **Code → Download ZIP** desde esa rama.
- **Por terminal:** `git clone -b claude/festive-sagan-yzx2y0 https://github.com/pablomartinlezaun2-hash/norteneo.git` y entra en `content/raquel-caturla/`.

## Re-renderizar o cambiar algo

```bash
cd content/raquel-caturla/motion
npm install                                   # gsap, fuentes (@fontsource-variable), playwright
pip install numpy scipy                       # sintetizador de audio

python3 scripts/prep_vo.py 01-manifiesto 7                   # (solo si cambias la locución) frases → vo/*.json
node scripts/render.mjs 01-manifiesto                         # MP4 final en ../renders/
node scripts/render.mjs 01-manifiesto --snap=0.5,3,7.6 --guides  # capturas de verificación con la zona segura
node scripts/render.mjs 01-manifiesto --still=2.2 --name=01-manifiesto-portada   # portada
node scripts/render.mjs 05-carrusel-exigencia-conciencia --still=0.5,1.5,2.5,3.5,4.5,5.5 --name=05-carrusel
node scripts/render.mjs 06-overlay-lower-third               # .mov + .webm con alfa y -sfx.wav
```

- **Identidad real:** edita `brand/tokens.css` (colores y familias tipográficas; si son de Google Fonts, `npm i @fontsource-variable/<fuente>` y cambia los `@import`) y vuelve a renderizar todo.
- **Textos:** están en el HTML de cada composición. Si un texto crece, `S.fit()` reduce el cuerpo para que no se salga.
- **Verificar antes de dar por bueno:** captura en el segundo tocado, mira el PNG y solo entonces renderiza el clip completo. Que no haya errores en consola no significa que se vea bien.

## Siguientes pasos

1. **Acceso a Drive o Instagram** para sustituir la identidad provisional por la real y editar su material en bruto.
2. Validar con Raquel los claims (el −80 % es del fabricante), el género del copy y los puntos **[RAQUEL]** de los guiones.
3. Editar los talking heads con el flujo del PDF *Motion Graphics In Minutes*: corte → subtítulos whisperX → overlays de este sistema → Premiere/DaVinci (o Premiere MCP para montar la secuencia sin tocar la del editor).
