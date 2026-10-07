# 04 · Flujo de edición pro (material a cámara de Raquel)

Cómo convertir el material en bruto de Drive en Reels con la misma identidad que las piezas de motion graphics. Combina NLE clásico (Premiere, DaVinci Resolve, After Effects) y las herramientas evaluadas en los PDFs. Las herramientas marcadas como *por probar* en el PDF se usan **siempre sobre una copia del proyecto**.

## 1. Ingesta
- Copia el material a `crudo/` y genera proxies (ProRes Proxy o DNxHR LB) si es 4K.
- Nombre de los clips: `AAAAMMDD_tema_toma.mov`. Un proyecto por semana del calendario.

## 2. Corte (silencios y muletillas)
- `auto-editor clip.mov --margin 0.15s --export premiere` (o `--export resolve`) para el primer corte por silencio. Después, repaso a mano: se quitan muletillas y retomas, y se conservan las risas.
- Alternativa en Claude Code: el *Kit de edición de vídeo* (`/video-cortar` → `/video-editar`) del PDF *Motion Graphics In Minutes*.
- Ritmo: cada corte aporta algo (información, ángulo o énfasis). Mide tus referencias con PySceneDetect (cortes por minuto) en lugar de imponer «un corte cada X segundos».

## 3. Subtítulos
- `whisperx clip.wav --language es --output_format srt --highlight_words True` para tener tiempos palabra a palabra.
- Estilo: Archivo condensada 860, crema `#FFF4E8` con sombra suave, palabra clave en lima `#D9FF45`, 1–2 líneas, dentro de y 250–1480 px y lejos de la columna derecha de botones (150 px).
- En Premiere: *Captions* → importar SRT → aplicar el estilo guardado. En Resolve: *Subtitle track* → *Import* → estilo en el inspector.

## 4. Color (DaVinci Resolve)
Árbol de nodos sencillo y repetible:
1. **Balance/exposición** (Primaries): neutros limpios y piel en la línea de tono de piel del vectorscopio.
2. **Contraste** suave con curva en S y negros sin aplastar.
3. **Look de marca**: altas luces algo cálidas (hacia el crema de la paleta), saturación −5 % general y +5 % en coral y magentas (las botas lucen).
4. **Piel** (cualificador HSL): suavizado mínimo; nada de piel de plástico.
- Exporta el look como LUT `.cube` para reutilizarlo en Premiere (Lumetri → *Creative* → *Look*). La skill `color-grade-ai` del PDF genera LUTs a partir de una descripción: está *por probar*.

## 5. Audio (Fairlight o Premiere)
- Voz: paso alto 80 Hz → de-esser → compresor 3:1 (ataque 10 ms, *release* 80 ms) → EQ de presencia +2 dB a 3–4 kHz → limitador −1 dBTP.
- Música a unos 20 LU por debajo de la voz, con *ducking* automático mientras habla. Es una norma de mezcla para que se entienda, no una regla de «dopamina».
- SFX en el fotograma exacto del cambio visual (rótulo, zoom, dato). Un solo pico sonoro planificado por pieza.
- Loudness final: **−14 LUFS integrados, pico real ≤ −1 dBTP**.

## 6. Motion y overlays
- Rótulo de nombre: `renders/06-overlay-lower-third.mov` (QuickTime PNG con alfa) en la pista V2, con `06-overlay-lower-third-sfx.wav` en A3, alineado al fotograma 0 del clip.
- Insertos de datos: corta 2–4 s de los Reels MG (por ejemplo la barra «−80 %*» de `02-impacto-articular.mp4`) y úsalos como B-roll.
- Nuevas piezas: duplica una composición de `motion/compositions/`, cambia textos y tiempos, y renderiza. Para gráficos con keyframes nativos de After Effects, el PDF recoge MCPs de AE (*por probar*). La vía principal sigue siendo HTML + GSAP.

## 7. Montaje asistido en Premiere (opcional, Premiere MCP)
Según el PDF (`hetpatel-11/Adobe_Premiere_Pro_MCP`, MIT, *prometedor*):
1. `verify_premiere_connection` → `get_project_info` / `list_sequences` (primero solo lectura).
2. **Crear una secuencia nueva** con nombre claro (por ejemplo «Reel S1 · Manifiesto · borrador»). **Nunca tocar la secuencia activa del editor.**
3. `import_media` del render y los overlays → colocarlos → guardar.
4. Si una herramienta devuelve `success:false`, se lee el error y se lanza el diagnóstico antes de reintentar.

## 8. Exportación para Instagram
| Parámetro | Valor |
|---|---|
| Contenedor / códec | MP4 · H.264 High 4.2 |
| Resolución / fps | 1080×1920 · 30 fps (o los nativos de la cámara: 25 o 30) |
| Bitrate | VBR 2 pasadas, 10–16 Mbps |
| Color | Rec.709, rango limitado |
| Audio | AAC 48 kHz estéreo, 320 kbps, −14 LUFS, −1 dBTP |
| Portada | JPEG 1080×1920 con el texto dentro del recorte 3:4 central (y 240–1680 px) |

## 9. Control de calidad antes de publicar
- [ ] Revisado en el móvil, con y sin sonido.
- [ ] Ningún texto bajo la UI de Instagram (activa `--guides` en las piezas MG o superpón la plantilla de zona segura).
- [ ] Ni parpadeos ni destellos de más de 3 por segundo.
- [ ] Claims con fuente y puntos **[RAQUEL]** validados.
- [ ] Hook cumplido, CTA única y copy y texto alternativo listos (ver `02-estrategia-y-calendario.md`).
