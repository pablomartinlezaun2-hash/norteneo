# 01 · Análisis de marca: @raquelcaturlaoficial

> **Aviso de método.** Desde el entorno de producción **no se pudo abrir Instagram ni la carpeta de Google Drive** (la política de red los bloquea). Este análisis se basa en fuentes públicas indexadas (webs de RCJumps, RC-RISE y SiempreOnFit, prensa sobre la Carrera de la Mujer, LinkedIn y canales de YouTube) y en los dos PDFs de referencia. Así que **la paleta y las tipografías son una propuesta provisional**, no salen del perfil real. Todo cuelga de un solo archivo (`brand/tokens.css`): en cuanto haya acceso a Drive o al perfil se cambia ahí y se vuelve a renderizar.

## 1. Quién es (datos verificables)

| Dato | Fuente pública |
|---|---|
| Trainer Oficial Internacional de Kangoo Jumps desde 2008, con más de 15 años liderando el sector del rebote | rc-rise.com, siempreonfit.com |
| Fundadora y propietaria de RCJumps Fitness Fun S.L., distribuidora exclusiva de Kangoo Jumps en España (desde 2013) | rcjumps.com/quienes-somos |
| Técnico Superior en Actividades Físicas y Deportivas y en Nutrición Humana y Dietética (2006); Máster en Psicología Positiva | rcjumps.com, LinkedIn |
| Creadora de SiempreOnFit (fitness, nutrición y salud; cursos y talleres para instructores) | siempreonfit.com |
| Academia **RC-RISE®**: programa «De cero a Instructor Oficial» (doble certificación, estructura para montar tu grupo en 4 semanas) y «RC Lidera 360» (Aeróbica de Base + Kangoo Jumps + mentoría 1:1) | rc-rise.com |
| Formadora en Sector Fitness European Academy; formación en España y Latinoamérica | siempreonfit.com |
| Charla en la Carrera de la Mujer de Valencia: «claves para alinear cuerpo y mente, y construir hábitos saludables **desde la conciencia, no desde la exigencia**» | valenciaciudaddelrunning.com |
| Eventos de comunidad: fiestas Kangoo, «ATRÉVETE Fest», calentamientos en playa (Valencia) | eventos.rcjumps.com |

**Frase que vertebra la marca:** *«desde la conciencia, no desde la exigencia»*. Es suya, es diferencial frente al fitness de castigo y conecta sus tres patas: movimiento (Kangoo), mente (psicología positiva) y nutrición.

## 2. Posicionamiento propuesto

**Raquel Caturla = moverse con alegría, sin dolor y sin culpa, con más de 15 años de autoridad detrás.**

- **Promesa:** volver a moverte (o hacerlo mejor) cuidando tus articulaciones y tu cabeza.
- **Prueba:** Trainer Oficial Internacional desde 2008, distribuidora oficial en España, formación en nutrición y Máster en Psicología Positiva.
- **Enemigo narrativo:** la *exigencia*: entrenar para castigarte, el todo o nada, compensar lo que comiste o aguantar el dolor.

## 3. Audiencias

| Segmento | Qué quiere | Qué le ofrecemos | Conversión |
|---|---|---|---|
| **A. Mujeres de 30 a 55 años** que quieren moverse sin machacarse (sedentarias, ex-runners con molestias, madres con poco tiempo) | Energía, divertirse, no lesionarse, constancia | Rebote de bajo impacto, hábitos pequeños, nutrición sin dieta | Clase o evento cercano, comunidad |
| **B. Instructoras/es y amantes del fitness** que quieren profesionalizarse | Un oficio rentable y reconocido | RC-RISE: certificación oficial, método, mentoría | Link en bio → academia |
| **C. Comunidad Kangoo actual** | Pertenencia, retos, eventos | Fiestas, retos, contenido de técnica | Asistir y compartir |

## 4. Tono de voz

- **Cercano y con energía**: tuteo, frases cortas, verbos de acción («salta», «suda», «elige»).
- **Sin culpa**: nunca «quemar», «castigo», «compensar», «no hay excusas». Sí «escucha», «suma», «a tu ritmo».
- **Con autoridad tranquila**: datos con fuente, sin exagerar. Si un dato es del fabricante, se dice.
- **Humor ligero**: el rebote es divertido; se nota.

| Sí | No |
|---|---|
| «Algo siempre suma. Hoy, 10 minutos.» | «Sin excusas, a darlo todo.» |
| «Salta. Suda. Sin machacarte.» | «Quema 1.000 calorías en una clase.» |
| «Hasta un 80 % menos de impacto, según el fabricante.» | «Cero impacto, cero lesiones.» |

## 5. Pilares de contenido

1. **Rebote sin dolor** (Kangoo y salud articular): técnica, mitos, primeras clases, comparativas.
2. **Mente y hábitos** (psicología positiva): sistema en lugar de fuerza de voluntad, autocompasión, celebrar.
3. **Nutrición sin dieta**: energía antes y después de entrenar, comer sin culpa, ideas reales.
4. **Profesión y academia** (RC-RISE): de alumna a instructora, día a día, casos.
5. **Comunidad**: eventos, retos, testimonios, «detrás de cámaras».

Reparto mensual orientativo: 30 % · 25 % · 15 % · 15 % · 15 %.

## 6. Sistema visual «Rebote consciente» (provisional)

**Paleta** (`brand/tokens.css`)

| Token | Hex | Uso |
|---|---|---|
| `--ink` | `#1A1423` | Texto, fondos del «mundo exigencia» |
| `--plum` | `#2B1640` | Fondos de datos y de academia |
| `--paper` | `#FFF4E8` | Fondo claro cálido, el «mundo conciencia» |
| `--blush` | `#FFD8D0` | Tarjetas suaves |
| `--coral` | `#FF4F6D` | Acento de marca: energía, la bola de rebote, CTA |
| `--lime` | `#D9FF45` | Pop: datos clave, subrayados, chips de acción |
| `--violet` | `#6B4DFF` | Mente y psicología positiva, palabra emocional |

**Tipografía:** Archivo Variable condensada y gruesa para titulares cinéticos en mayúsculas; Fraunces Italic para la palabra emocional (*conciencia*, *oficial*, *sin machacarte*); Inter para etiquetas, notas y handle. Las tres son libres (OFL) y llegan por npm (`@fontsource-variable/*`).

**Motivos propios** (vienen del producto, no son decoración genérica):
- **La bola que rebota**: es la firma. Cae en el silencio previo al pico, rebota con *squash & stretch* y aterriza como punto final de una frase o sobre una barra de datos.
- **Trayectorias punteadas** de salto en el fondo, siempre en movimiento lento.
- **Tachar la exigencia**: tarjetas de «Más castigo / Más culpa» con una X que cae de golpe, o el trazo de rotulador sobre «fuerza de voluntad».
- **Tarjetas opacas en abanico o en baraja** (nunca translúcidas: si se solapan, la de detrás se transparenta como un fantasma).
- **Dos mundos de color**: oscuro (exigencia) frente a claro o violeta (conciencia), con transición en círculo desde la bola.

**Reglas de movimiento** (adaptadas del documento *Motion Graphics In Minutes*):
- Entrada principal `expo.out` de unos 0,67 s; deriva ambiental `sine.inOut`.
- `back.out(1.7)` solo en posición y escala, nunca en opacidad ni color.
- La opacidad aparece en 2 fotogramas: nada de fundidos lentos.
- Texto letra a letra con unos 32 ms entre letras; *stagger* de 40 a 60 ms entre elementos.
- Las salidas duran entre el 60 y el 70 % de la entrada.
- Golpe de cámara (*scale-punch*) más *whoosh* en cada corte, y algo siempre en movimiento (balanceo de cámara, grano).
- *Motion blur* real: 4 subfotogramas por fotograma (obturador de 180°).

**Sonido:**
- Base propia a 120 BPM: los cortes caen en el pulso.
- SFX en el fotograma exacto de cada cambio visual: *pop* al entrar, *slam* con la X, *bounce* con la bola, *ding* en la recompensa.
- Estructura de cada pieza: sonido desde el fotograma 0, luego *build*, luego silencio breve y por último el *drop*, que coincide con la revelación.
- Todo sintetizado: no hay licencias de terceros.

## 7. Qué falta para cerrar la identidad

1. Acceso a la carpeta de Drive (logotipos, fuentes, vídeos en bruto) y a capturas del feed o highlights.
2. Confirmar si RCJumps, RC-RISE y la marca personal comparten paleta o van por separado.
3. Validar con Raquel: claims (el «hasta 80 %» es del fabricante), género del copy («instructora» o «instructor/a») y tono.
