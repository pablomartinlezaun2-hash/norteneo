# Edición · «¿Qué sé realmente?» (vídeo a cámara)

Resultado: `renders/07-edicion-que-se-realmente.mp4`, 1080×1920, 30 fps, ~30 s.

## Flujo
1. **Transcripción** palabra a palabra con ElevenLabs Scribe → `transcript.json`.
2. **Primer corte** (`python3 build_base.py`):
   - silencios fuera (jump cuts que dejan ~0,18 s de respiración);
   - cierre de CapCut eliminado;
   - reescalado 720p → 1080p con nitidez y un grade suave.

   Sale de 32,7 s de voz a **27,5 s**: 15 tramos, recogidos en `edl.json`.
3. **Motion graphics y montaje** (`motion/compositions/07-edicion-que-se-realmente.html`): el metraje se anima dentro de la composición (zooms, pantalla partida, congelado), con subtítulos sincronizados por palabra.
4. **Sonido** (`motion/audio/synth.py`):
   - voz original con cadena ligera (paso alto, compresor, presencia);
   - base musical con *ducking* bajo la voz;
   - SFX en el fotograma exacto de cada cambio visual;
   - mezcla a −14 LUFS.

## Mapa de gráficos y efectos de sonido

| Momento (palabra) | Gráfico | SFX |
|---|---|---|
| Inicio | Etiqueta «Psicología positiva» | whoosh + pop |
| «distorsionado» | Glitch RGB y *skew* sobre el vídeo; palabra en coral | **error** |
| «realidad» | Palabra en lima | pop |
| «situación» | Chip «Una situación…» | **UI** |
| «cuestión de segundos» | Cronómetro circular 0 → 3 s | **click** + ticks |
| «se monta una película» | **Modo cine**: bandas negras, «TU MENTE PRESENTA», look desaturado; claqueta «TOMA 1» que se cierra | whoosh, **click** + **impact** |
| Los 4 pensamientos | Notificaciones que se apilan con ✕ y contador «PENSAMIENTOS ×1…×4» | **UI** + **error** |
| «lo más curioso» | Sale el modo cine; empieza la subida | whoosh + **riser** (música) |
| «no estamos reaccionando…» | **Pantalla partida**: vídeo arriba y diagrama abajo. REACCIÓN y HECHO; el salto directo se tacha | whoosh, pop, **error** |
| «interpretando» | **INTERPRETACIÓN** entra en grande entre ambos, con flechas Hecho → Interpretación → Reacción. Golpe de cámara | **impact** + **bass drop** (drop musical) |
| «emoción intensa» | Termómetro lateral que sube hasta «INTENSA»; *push-in* del vídeo | **UI** + **riser** |
| «pausa» | **Foto congelada**: destello y marco polaroid inclinado, icono ⏸ y «pausa.» | **shutter** (foto) + pop |
| «¿Qué sé realmente?» | Vídeo desenfocado; pregunta letra a letra; ✓ Los hechos / ✕ Mis suposiciones; CTA y handle | pop, **acierto**, **error**, pop + click |

**Criterios aplicados** (PDF *Vídeo corto: neurociencia…*, Parte C):
- **Hook:** el primer fotograma ya tiene movimiento y sonido.
- **Cortes con propósito:** se quitan pausas y cada gráfico refuerza lo que se dice en ese instante.
- **SFX:** breves y sincronizados con el cambio visual, con un solo pico planificado (el bass drop en «interpretando»).
- **Subtítulos:** 1–3 palabras, con la palabra clave resaltada.
- **Zona segura:** los gráficos van en el espacio libre (pared y pecho) y nunca tapan la cara.
- **Sin parpadeos:** un único destello (el de la foto), muy por debajo de 3 por segundo.
- **Final nítido:** termina con la pregunta y la CTA.

## Rehacer
```bash
python3 edit/build_base.py                                   # corte + fotogramas (edit/.tmp)
cd motion && node scripts/render.mjs 07-edicion-que-se-realmente
scripts/entrega.sh 07-edicion-que-se-realmente               # compresión de entrega
```
El vídeo original (`edit/src/`) y los fotogramas (`edit/.tmp/`) no se suben al repo.
