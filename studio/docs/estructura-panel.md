# NEO Studio: estructura definitiva de la web

**Cómo se ha construido.** El esqueleto y el embudo vienen de la propuesta C, que ganó con los tres jueces. De B se toman la voz y el hilo narrativo. De A, la disciplina técnica y las subpáginas. Se ha quitado todo lo que los jueces cortaron con razón.

---

## 1. Idea rectora y momento firma

**Idea rectora.** NEO no se presenta como una agencia sino como una casa de imagen. **La web es la prueba de lo que vende:** casi todo lo que se ve lo ha dirigido NEO, y se dice con discreción.

El recorrido sigue el protocolo de una boutique de alta relojería:
1. Primero se ve una sola pieza.
2. Después se entra en la colección.
3. Luego llega la explicación del oficio.
4. La venta se hace en privado, con propuesta y sin precios.

Se cuenta poco al principio y más a medida que el visitante avanza, como en Apple. La home funciona como un tráiler. La explicación completa está en las subpáginas.

**El hilo: un asterisco azul.**
- El titular del hero termina en un asterisco: **"Imagen de lujo, sin plató\*"**.
- Ese asterisco es el uso más visible del azul NEO.
- No se explica hasta el footer, donde se resuelve como una firma de oficio y no como un truco.
- Se usa "sin plató" en lugar de "sin rodaje" para no contradecir el servicio Cine con tu móvil, que sí implica rodar.

**Momento firma (el único gran gasto de audacia): "La Mesa".**
- Es la única sección fijada (pinned) de contenido.
- Al hacer scroll, el visitante controla el tiempo del spot de gastronomía negro/oro, fotograma a fotograma: el cuchillo corta, la sal, la pimienta y el limón quedan suspendidos en un bokeh dorado, y al final aparecen el plato con humo y la copa.
- Un timecode en mono y un punto "REC" azul avanzan con el dedo. El visitante no mira un anuncio: lo dirige.
- La pieza termina en una copa, la misma que abrió el hero, así que el recorrido se cierra en círculo (Corn Revolution).
- Referencias: The Watch (pipeline de IA con producto fiel) y OPTIKKA (Codrops).
- **La Mesa no incluye la revelación.** Solo lleva la etiqueta `[ Generado con IA, dirigido por NEO ]`. La revelación se guarda entera para el final.

**Sistema base (bloqueado):**

| Token | Valor | Uso |
|---|---|---|
| Fondo | `#000` | Se funde con los fondos de los clips de Higgsfield |
| Texto | `#F2F2EE` | Titulares y cuerpo |
| Texto secundario | `#8C8C8C` (≈6:1 sobre negro) | Subtítulos y fichas |
| Hairlines | `rgba(255,255,255,.14)`, 1 px, discontinuas en tablas | Separadores |
| Acento | `#3D9BFF` (≈7,3:1 sobre negro) | **Solo** el asterisco, el foco visible, los estados activos (idioma, paso del brief, modo de La Casa) y el punto REC. En la única sección clara no se usa: allí el foco va en `#0A0A0A` |
| Sección clara | fondo `#F2F2EE`, texto `#0A0A0A` | Solo "Cliente privado" |

- **Tipografía:** una familia, **PP Neue Montreal** (400/500), más **PP Neue Montreal Mono** para el timecode y los metadatos `[ entre corchetes ]`. Alternativa libre: Host Grotesk + JetBrains Mono.
- **Estilo de texto:** titulares en minúscula con mayúscula inicial y escala de póster ligada al viewport, con `clamp()`. La medida de lectura es de 65ch. El único texto en mayúsculas es el wordmark NEO.
- **Postproceso:** grano estático sutil y viñeta en CSS, solo sobre las zonas con vídeo.
- **Nombre público:** "NEO Studio" en `<title>`, en JSON-LD y en el dominio, para no confundir el estudio con la app de fitness.

---

## 2. Mapa del sitio (ES en la raíz, EN bajo `/en`)

Reglas comunes a todas las rutas: prerender estático por ruta, `hreflang` por pares, `x-default` apuntando a ES y slugs traducidos.

| ES | EN | Función en el embudo |
|---|---|---|
| `/` | `/en` | Captación y retención: el tráiler de la casa |
| `/coleccion` | `/en/collection` | Retención: portfolio con dos bloques honestos, **Clientes** y **Estudios propios** |
| `/coleccion/[slug]` | `/en/collection/[slug]` | Caso. Slugs: `navarro-real-estate`, `masventa-inmobiliaria`, `urbalia-inmobiliaria`, `nexodea`, `waka-wow`, `pedacito-de-cielo`, `reserva` (vino), `mesa-negra` (gastronomía), `trono` (moda), `fuego` (tacos) y `neo-app` (caso propio) |
| `/servicios` | `/en/services` | Hub: índice de los 6 oficios, "¿Cuál es para ti?" y ficha comparativa sin precios |
| `/servicios/video-ia` | `/en/services/ai-video` | Vídeo premium con IA |
| `/servicios/3d-ia` | `/en/services/ai-3d` | Generación 3D con IA |
| `/servicios/webs-de-autor` | `/en/services/signature-websites` | Webs de autor |
| `/servicios/postproduccion` | `/en/services/post-production` | Edición con IA, After Effects y DaVinci |
| `/servicios/contenido-redes` | `/en/services/social-content` | Contenido y guiones para redes |
| `/servicios/cine-con-movil` | `/en/services/mobile-cinema` | Cine con tu móvil. También funciona como landing para la bio de Instagram y TikTok, con UTM propio |
| `/atelier` | `/en/atelier` | Confianza: Pablo, el método y el oficio humano visible |
| `/contacto` | `/en/contact` | Brief guiado. Acepta `?servicio=video-ia` para llegar con el servicio marcado |
| `/contacto/gracias` | `/en/contact/thank-you` | Confirmación con ID del brief, reserva de llamada y WhatsApp. `noindex` |
| `/legal/aviso-legal`, `/legal/privacidad`, `/legal/cookies` | `/en/legal/...` | Obligatorias por LSSI y RGPD |
| 404 | 404 | El vino en pausa con el texto "Esta pieza no existe. Aún." y un enlace a Colección |

**Criterios:**
- **Las URL son descriptivas, porque son las que posicionan.** La metáfora de lujo va en los rótulos ("Colección", "Atelier") y no en las rutas.
- **Datos estructurados (JSON-LD):** `Organization` (NEO Studio), `Service` en cada subpágina, `FAQPage` y `VideoObject` en los vídeos explicativos.
- **No hay blog ni página de precios en la v1.**

---

## 3. Home sección por sección

**Ritmo de la home:**
1. Apertura con fuerza (hero).
2. Silencio (manifiesto).
3. Pico (La Mesa).
4. Prueba real (webs).
5. Amplitud (colección).
6. Orientación (La Casa).
7. Calma (Atelier).
8. Sala iluminada (venta).
9. Cierre memorable (footer).

**Secciones fijadas:**
- **PIN 1:** La Mesa, en todos los dispositivos.
- **PIN 2:** el revelado del footer, solo en escritorio.

El scroll es nativo 1:1, sin Lenis y sin secuestro de scroll.

| # | Sección | Etapa | Qué ve el usuario | Titular ES propuesto | Asset | Animación / técnica + referencia | Móvil / reduced-motion |
|---|---|---|---|---|---|---|---|
| 0 | Intro (sin preloader) | Marca | El póster del hero pintado desde el primer frame. El wordmark NEO y el titular entran en máscara | (el del hero) | Póster AVIF del vino, ~60–80 KB, precargado con `fetchpriority="high"` (es el LCP) | ≤900 ms en total, sin tapar nada. Igual en la primera visita que en las siguientes | Móvil: igual. Reduced: todo aparece ya en su sitio |
| 1 | Hero "Reserva" | Captación | **Escritorio:** titular a la izquierda sobre negro puro y el loop del vino en ~70vw a la derecha. Debajo, CTA "Solicitar propuesta" (píldora blanca, **magnético 1/2**) y "Ver colección" en texto. Abajo a la izquierda `[ Reserva · Generado con IA, dirigido por NEO ]`; abajo a la derecha, botón "Pausar" | **Imagen de lujo, sin plató\*** (asterisco azul). Subtítulo: "Vídeo, 3D y webs de autor con IA, dirigidos con oficio de cine." | Clip del vino (6 s, loop natural). AV1 + H.264 a 30 fps, ~1,2 MB en escritorio y ~700 KB en móvil. Se carga después del primer pintado | SplitText en máscara de líneas (700 ms, `expo.out`, stagger de 40 ms) y vídeo que funde desde el póster en 400 ms. Ningún efecto de scroll. Ref.: Apple, y la tesis "Powered by AI\*" de Oryzo | **Móvil:** `100svh`. Vídeo arriba en 4:5 y texto y CTAs debajo, dentro del primer viewport. Cuando llegue la variante 9:16, vídeo a pantalla completa con el texto en el tercio inferior. Si `play()` falla (webview de Instagram o modo ahorro de iOS), póster con botón de reproducir. **Reduced:** póster fijo, titular visible y botón "Reproducir" |
| 2 | Manifiesto | Captación → retención | Negro puro, una frase grande y una línea en gris. Es la sección más vacía de la web | **Las marcas de lujo no compiten por atención. Compiten por memoria.** Línea secundaria: "Restaurantes, inmobiliarias, moda, bebidas y creadores. Trabajamos pocas marcas a la vez." | Ninguno, a propósito | Máscara de líneas en el titular, una sola vez. "memoria" en `#F2F2EE` y el resto en gris | Móvil: dos bloques. Reduced: estático |
| 3 | **La Mesa · PIN 1** (momento firma) | Retención | El spot de gastronomía controlado con el scroll. Timecode `00:00:00:00` y punto REC azul. Tres frases que entran y salen. Al soltar el pin, ficha técnica y enlace | **Un spot de cocina. Sin cocina.** Subtítulo: "Desliza. Tú controlas el tiempo." Frases: `[ 00:00:00 ]` "Cada gesto, dirigido." · `[ 00:00:02 ]` "Cada partícula, en su sitio." · `[ 00:00:04 ]` "Tu marca, a este nivel." Ficha: `[ Mesa negra · 2048 × 1152 · 60 fps · 5 s · Generado con IA, dirigido por NEO ]`. Enlace "Ver Vídeo IA" | Clip de gastronomía convertido en secuencia WebP: **escritorio** 120 frames a 1440–1600 px, q65–70, ≤6 MB; **móvil** 60–75 frames en recorte 4:5, ≤2,5 MB | Canvas + helper `imageSequenceScrub` (OPTIKKA) con ScrollTrigger: `pin: true`, `scrub: 0.5`, recorrido +250% en escritorio y +180% en móvil, `ignoreMobileResize`. El último frame se queda quieto el 15% final del recorrido. Timecode y REC en `onUpdate`. **Nunca** se usa `video.currentTime` (falla en iOS). Ref.: The Watch y OPTIKKA | **Móvil:** recorte 4:5 con punto focal animado por tramos (cuchillo → ingredientes → copa). Nada de letterbox. **Reduced, sin JS, Save-Data, 2G/3G o `deviceMemory < 4`:** sin pin. Tres fotogramas clave apilados con su frase y botón "Reproducir" para ver el clip normal |
| 4 | Webs de autor (Clientes) | Retención → explicación | Carril horizontal con las 6 webs reales. Cada pieza muestra su grabación, la ficha `[ Inmobiliaria · Año · Web de autor ]` y el enlace a la web en directo | **Webs que se visitan dos veces.** Subtítulo: "Inmobiliarias y restaurantes, en producción. Esta también es nuestra." | Grabaciones de las 6 webs (las aporta el cliente). Mientras no existan, se usa la **variante tipográfica**: los 6 nombres en grande, con sector y enlace en vivo. Nunca pósters vacíos | `overflow-x` nativo con `scroll-snap`, **sin pin**, arrastrable en escritorio. Parallax interno de la imagen de ±6% como máximo. En escritorio el vídeo arranca al pasar el ratón. Ref.: galería horizontal de Codrops (versión DOM) y Hobro | **Móvil:** swipe nativo con piezas al 85% del ancho. Solo se reproduce la pieza centrada. **Reduced:** sin parallax, solo pósters, y vídeo solo si el usuario lo pulsa |
| 5 | La colección (Estudios propios) | Retención | Rejilla editorial asimétrica que mezcla 16:9 y 9:16, con nombres propios. Aquí se sale de la comida: **Trono** (moda) va primero | **La colección.** Fichas `[ Moda · 9:16 · 14 s ]`. Enlace "Ver colección" | **Trono** (moda 9:16), **Fuego** (tacos 16:9) y **NEO app** (póster del robot, `[ Producto propio · 3D interactivo ]`). Los 7 clips pendientes entran **solo si pasan la curación**. Nunca hay huecos visibles | Vídeo al pasar el ratón en escritorio y al entrar en pantalla en móvil, con **un solo vídeo activo** a la vez. Al hacer clic, View Transition con elemento compartido de la pieza al hero del caso. Sin shaders | **Móvil:** una columna. Trono a ancho completo (formato nativo de Instagram). **Reduced:** pósters, y vídeo solo si se pulsa |
| 6 | La Casa (índice + orientación) | Explicación | Índice tipográfico de 6 filas separadas por hairlines discontinuas. Un conmutador de texto permite elegir **"Por oficio" / "Por situación"** | **Seis oficios, una sola casa.** (filas y situaciones en las notas de abajo) | Pósters o fragmentos de 2–3 s de cada servicio. Si un servicio no tiene clip, su fila se queda en texto | **Por oficio:** en escritorio, al pasar el ratón aparece una vista previa en una ventana fija de la columna derecha (`clip-path: inset()`, 500 ms) y la fila activa sube a blanco. **Por situación:** 5 radios. El resultado (1–2 servicios) se recoloca con Flip (500 ms, `expo.out`). Ref.: índice de Hobro y hub de Orano | **Móvil:** acordeón con póster, frase, "Descubrir" y "Solicitar propuesta", sin autoplay. **Reduced:** sin Flip ni vista previa animada, cambio instantáneo. **Sin JS:** lista de enlaces a cada servicio |
| 7 | Atelier | Confianza | La sección más quieta: cuatro verbos del proceso en texto y una foto con luz baja | **La IA genera. Nosotros dirigimos.** Verbos: Escuchar · Dirigir · Generar · Pulir (2 líneas cada uno). Enlace "Conocer el atelier" | Foto de Pablo en DaVinci o grabando con el móvil. **Si no hay foto, el bloque va solo con texto** | Ninguna, a propósito | Móvil: foto a sangre arriba y texto debajo. Reduced: igual |
| 8 | Cliente privado (**única sección clara**) | Venta | Corte limpio de negro a `#F2F2EE`: la sala privada se ilumina. Tres datos de cómo se trabaja. Testimonios y logos solo si existen | **Cada encargo empieza con una conversación.** Subtítulo: "Sin catálogo de precios. Estudiamos tu marca y te enviamos una propuesta a medida." CTA "Solicitar propuesta" (**magnético 2/2**). Secundarios: "Reservar llamada" y "WhatsApp" en texto | Tabla de testimonios tipo ficha (Cliente · Sector · Servicio · Cita de 25 palabras como máximo) **solo con 2 o más reales**. Tira de logos solo con permiso | Solo el magnetismo del CTA. Ref.: la sección de sostenibilidad de Oryzo, la única clara de su web | Móvil: CTA a ancho completo. Reduced: sin magnetismo. *Si en el prototipo el corte a claro rompe la continuidad, la sección se queda en negro* |
| 9 | **Footer revelación · PIN 2 (solo escritorio)** | Venta y recuerdo (peak-end) | El contenido sube y descubre el footer fijo. Aparece la frase que resuelve el asterisco. Detrás, el wordmark NEO hecho de partículas que se dispersan con el cursor y se vuelven a formar | **\*Ningún plato, copa ni abrigo de esta página pasó por un plató. Todo lo dirigió NEO.** Segunda línea: **Imagina tu marca.** CTA "Solicitar propuesta". Debajo, enlaces, redes, ES/EN y legales | `ParticleField` existente (Canvas 2D, `src/components/CinematicOnboarding.tsx`) adaptado para muestrear el wordmark en un canvas oculto. Sin Three.js | Revelado con sticky. Máscara de líneas en las dos frases. Partículas pausadas fuera de pantalla: ~1.200 en escritorio y ~500 en móvil. Ref.: footers de Oryzo e Igloo | **Móvil:** footer en flujo normal, sin revelado. Partículas con el dedo y sin giroscopio. Con `deviceMemory ≤ 4`, wordmark estático. **Reduced:** wordmark quieto |

**Notas de implementación de la home**

- **Carga de La Mesa (especificación de A):**
  - Empieza con `requestIdleCallback` cuando el hero ha pintado y la sección está a 1 viewport.
  - Orden: primer frame, último, 1 de cada 8 y después relleno por subdivisión.
  - `createImageBitmap` y canvas con DPR máximo de 2.
  - Se implementa como componente `SceneScrub` reutilizable; también se usa para la gota de los tacos en `/servicios/video-ia`.
- **Filas de La Casa "Por oficio"** (copy revisado, sin "parecen" ni "convierten"):

  | Oficio | Frase | Formato |
  |---|---|---|
  | Vídeo con IA | "Spots de producto, comida, bebida y moda." | `[ 16:9 · 9:16 ]` |
  | 3D con IA | "Tu producto en volumen, fiel al original." | `[ Modelo · Escena ]` |
  | Webs de autor | "Sitios a medida, rápidos y difíciles de olvidar." | `[ Web ]` |
  | Postproducción | "Montaje y color con IA, After Effects y DaVinci." | `[ Edición ]` |
  | Contenido para redes | "Guiones y piezas listas para publicar cada semana." | `[ Mensual ]` |
  | Cine con tu móvil | "Rueda en Log. Termina como un estudio." | `[ Sesión ]` |

- **Situaciones de La Casa "Por situación"** (de A):

  | Situación | Servicios recomendados |
  |---|---|
  | "Lanzo un producto" | 3D con IA + Vídeo con IA |
  | "Mi web no está a la altura" | Webs de autor |
  | "Tengo que publicar cada semana" | Contenido + Postproducción |
  | "Quiero grabarme yo" | Cine con tu móvil |
  | "Tengo material y no sé montarlo" | Postproducción |

  El resultado ofrece "Descubrir" y "Solicitar propuesta", que lleva a `?servicio=` con el servicio ya marcado.
- **Diversidad de sectores:** la home no debe leerse como una web solo para restaurantes. Por eso las webs inmobiliarias van justo después de La Mesa y la moda abre la colección. Cuando lleguen los 7 clips, el mejor que no sea de comida tiene prioridad en la Colección.
- **Transparencia (art. 50 del AI Act):** cada clip lleva su etiqueta discreta en mono. Como el visitante ya lo sabe, el footer no es una sorpresa sino una **firma**. **Condición de veracidad:** si entra en la home material rodado de verdad (por ejemplo, de Cine con móvil), hay que reescribir la frase final.

---

## 4. Plantilla de subpágina de servicio

**Patrón:** cada bloque hace una afirmación, ofrece una interacción y aporta una prueba. Como máximo hay un pin por página. Los bloques que dependen de assets son condicionales y no se renderizan vacíos.

1. **Navegación local fija** (como la de producto de Apple): nombre del servicio · Resumen · Proceso · Ejemplos · Preguntas · píldora "Solicitar propuesta".
2. **Hero del servicio:** titular de 6 palabras como máximo, subtítulo de 20 como máximo, la pieza firma en loop con póster y ficha en corchetes.
3. **La interacción del servicio:** una sola, distinta en cada servicio. Si hay pin en la página, es este.
4. **Subapartados explicativos (3 o 4):** cada uno con **un vídeo de 20 a 40 s** y un texto de 65ch como máximo. Los vídeos llevan póster, se reproducen solo al pulsar, tienen sonido, subtítulos VTT en ES y EN y una transcripción plegable para SEO. Es la respuesta literal al brief: "vídeos explicando cada parte en un subapartado". En escritorio se alternan a izquierda y derecha; en móvil se apilan.
5. **Para quién:** 3 sectores en texto editorial a dos columnas, sin tarjetas.
6. **Proceso:** los 4 verbos (Escuchar · Dirigir · Generar · Pulir) adaptados al servicio. Plazos solo si los confirma Pablo.
7. **Entregables:** ficha técnica con hairlines discontinuas (formatos, resoluciones, duraciones, revisiones y derechos de uso).
8. **Ejemplos:** 2 o 3 piezas de la Colección filtradas por el servicio.
9. **Preguntas** (`<details>` + `FAQPage`). Siempre incluyen "¿Cuánto cuesta?" (respuesta: depende del alcance y te enviamos una propuesta), derechos de uso del contenido y etiquetado del contenido generado con IA.
10. **Cierre:** "Solicitar propuesta", que abre `/contacto?servicio=…`.
11. **Siguiente oficio:** enlace grande al servicio siguiente, con View Transition.

**Particularidades de cada servicio**

| Servicio | Hero | Interacción única (bloque 3) | Vídeos explicativos (bloque 4) | Prueba / asset hoy | Fase |
|---|---|---|---|---|---|
| **Vídeo con IA** | Fuego (tacos macro, la gota de salsa) | **"Del fotograma al spot" (pin):** scrub de la gota con `SceneScrub`, que empieza con la etiqueta `[ Start-frame ]` y acaba en `[ End-frame ]`. Enseña el método real de Higgsfield. Dato real: 8 s × 60 fps = 480 fotogramas | 1) Dirección y guion. 2) Fidelidad al producto (cómo se mantiene fiel la marca). 3) Cámara y movimiento. 4) Postproducción y sonido | Reserva, Mesa negra, Trono y Fuego, más la curación de los 7 clips | **V1** |
| **Webs de autor** | Montaje de las 6 grabaciones | **"Ver la rejilla":** un interruptor superpone a la propia página la rejilla de 16 columnas, la escala tipográfica y las curvas de motion. La web se demuestra a sí misma (Anime.js) | 1) Dirección de arte. 2) Movimiento. 3) Rendimiento. 4) SEO y puesta en marcha | Enlaces en vivo a las 6 webs y Lighthouse **medido** de cada una (sin cifras inventadas) | **V1** |
| **Contenido para redes** | Trono (moda 9:16) | **"Del guion al feed":** el vídeo vertical junto al guion real con timecodes. La línea activa se ilumina en sincronía, y al tocar una línea el vídeo salta a ese momento (`timeupdate` + VTT). En móvil, el guion pasa a ser un subtítulo con "Ver guion completo" | 1) Estrategia mensual. 2) Guiones. 3) Producción con IA. 4) Publicación por plataforma | El guion real de Trono (lo escribe NEO) y un calendario editorial de ejemplo | **V1** |
| **3D con IA** | Objeto generado por NEO (pendiente). **El robot no va como hero** | **Orbitar y cambiar acabado:** un producto GLB que se gira arrastrando, con 3 o 4 acabados en tiempo real (The Watch). Three.js en lazy, pausado fuera de pantalla y con "Tocar para mover" en móvil | 1) De la foto al modelo. 2) Materiales y luz. 3) Escenas. 4) Exportación (web, anuncio, catálogo). Ref. de método: Voxelo | Modelo GLB pendiente. El robot solo como caso propio en `/coleccion/neo-app` | V1 editorial, V2 completa |
| **Postproducción** | Reel de montaje (pendiente) | **Antes/después** con el truco de B: un solo vídeo apilado (final arriba, bruto abajo) pintado en canvas 2D con `requestVideoFrameCallback`, que da una decodificación y sincronía perfecta. Línea arrastrable `role="slider"`, también con teclado. **Solo con un bruto real; nunca simulado** | 1) Montaje. 2) Etalonado en DaVinci. 3) Motion graphics en After Effects. 4) Entregas por plataforma | Par bruto/final real (pendiente). Captura de la línea de tiempo de DaVinci | V1 editorial, V2 completa |
| **Cine con tu móvil** | Plano vertical **rodado de verdad con móvil** (pendiente), rotulado "Rodado con iPhone" | **Log contra etalonado** a pantalla completa (barrido) y después la **ficha de cámara** con los ajustes reales de Blackmagic Camera: Log, P3, 24 fps, obturación a 180° | 1) Ajustes de cámara. 2) Luz con lo que tienes. 3) Perfiles Log y LUT. 4) Edición con IA | **Nunca se usa material IA como si fuera de móvil.** Lista de apps recomendadas. Conversión propia: "Reservar sesión". Tono más cercano | V1 editorial, V2 completa |

- **"V1 editorial":** la página sale el primer día con hero tipográfico sobre negro, texto de los subapartados, ficha técnica, FAQ y CTA. La interacción y los vídeos aparecen cuando existan sus assets. Así no hay enlaces muertos desde La Casa ni huecos visibles.
- **Hub `/servicios`:**
  - Titular: **"Seis oficios, una sola casa."**
  - Contenido: el índice con los dos modos de La Casa y una **ficha comparativa estática** (qué recibes · formato · para quién · plazo orientativo), sin precios.
  - En escritorio, una tabla de 6 columnas. En móvil, una ficha por servicio, apiladas.
  - Se descarta el selector de columnas tipo "Comparar modelos", porque cuesta mucho mantenerlo y aporta poco en servicios intangibles.

---

## 5. Colección, casos y contacto

### `/coleccion`
- Titular: **"La colección."**
- Dos bloques rotulados con honestidad:
  - **Clientes:** las 6 webs.
  - **Estudios propios:** Reserva, Mesa negra, Trono, Fuego, los clips curados y NEO app.
- Filtros en una línea de texto, no en píldoras de colores:
  - **Sector:** Hostelería · Inmobiliaria · Moda · Bebidas · Marca personal.
  - **Oficio:** los 6 servicios.
  - El reordenado al filtrar se anima con Flip (500 ms).
- Rejilla asimétrica de anchos alternos (8/12, 5/12, 7/12) que respeta el formato real de cada pieza.

### `/coleccion/[slug]`
1. La pieza a pantalla completa, continuando la View Transition desde la colección.
2. Ficha `[ Cliente · Sector · Oficio · Año · Formato · Ver web ]`.
3. El reto, en una frase.
4. La pieza o piezas: vídeo, grabación o modelo.
5. **Proceso:** start-frame, end-frame e iteraciones descartadas. Es la artesanía visible que distingue a NEO de "se lo pedí a una IA".
6. Resultado: **solo con datos reales y autorizados.** Si no los hay, el bloque no existe.
7. Testimonio, solo si existe.
8. Siguiente caso: enlace grande con transición de elemento compartido.

**Caso propio `neo-app`:**
- El robot de Spline (mejor exportado a GLB + Three.js) se carga **al hacer clic** y sigue al cursor.
- El seguimiento de cara solo se activa con un botón "Activar cámara" y permiso explícito.
- Una línea aclara la relación entre el estudio y la app.

### `/contacto`: brief guiado en 5 pasos
- Un paso por pantalla, con el texto "Paso 2 de 5" y una hairline azul de progreso.
- Se puede volver atrás. El borrador se guarda en `localStorage` (con try/catch).
- La validación aparece al salir de cada campo, no mientras se escribe.
- **Sin JS**, es un formulario único con 5 `<fieldset>` y POST a una función serverless.

| Paso | Campos (* = obligatorio) |
|---|---|
| 1. ¿Qué necesitas? | Selección múltiple de los 6 oficios más **"Ayúdame a elegir"**, que despliega las 5 situaciones de La Casa. Viene marcado si llega `?servicio=` |
| 2. Tu marca | Nombre de la marca\*, web o Instagram, sector\* (Hostelería · Inmobiliaria · Moda · Bebidas · Marca personal · Otro), ciudad |
| 3. El encargo | Objetivo\* (Lanzamiento · Más reservas o clientes · Renovar la imagen · Contenido continuo · Aprender a grabar), plazo (menos de 1 mes · 1 a 3 meses · Flexible), referencias (URL o archivo, opcional) con la pregunta "¿A qué marca te gustaría parecerte?", descripción (opcional, 500 caracteres) |
| 4. Inversión prevista | Rangos **que define Pablo**, distintos por servicio, más la opción **"Prefiero hablarlo"**. No se publica ninguna cifra que él no haya decidido |
| 5. Cómo hablamos | Nombre\*, email\*, teléfono (opcional), canal preferido (Email · Llamada · WhatsApp), idioma, consentimiento RGPD\*, honeypot antispam |

- **Campos ocultos:** UTM, página de origen, idioma, servicio de entrada y si el visitante completó La Mesa (`mesa_100`).
- **`/contacto/gracias`:**
  - Titular "Recibido." y resumen del brief con su ID `NEO-XXXX`.
  - Calendario de reserva (Cal.com, en lazy) **para todos**. El umbral de inversión solo sirve para priorizar internamente.
  - WhatsApp con el mensaje ya rellenado: "Hola, soy [nombre], brief NEO-XXXX".
  - El plazo de respuesta solo se muestra si Pablo se compromete a uno.
- **Vías alternativas siempre visibles en /contacto:** "Reservar llamada", "WhatsApp" (enlace de texto) y el email. **No hay burbuja flotante.**
- **Eventos de medición:**
  - Recorrido: `hero_cta`, `mesa_100`, `casa_situacion`, `coleccion_open`, `servicio_view`, `video_explicativo_50/100`.
  - Brief: `brief_paso_1…5`, `brief_envio`.
  - Cierre: `llamada_reservada`, `whatsapp_click`.
  - Analítica sin cookies (Plausible). Los píxeles de Meta y TikTok quedan para la v2, con su banner de consentimiento diseñado.

---

## 6. Navegación, preloader, transiciones y footer

- **Navegación de escritorio:**
  - Barra de 48 px: wordmark NEO a la izquierda; a la derecha Colección · Servicios · Atelier · ES/EN y la píldora "Solicitar propuesta".
  - Transparente sobre el hero y negra sólida con hairline al bajar (sin glass).
  - Se oculta al bajar y vuelve al subir.
  - "Letter flip" al pasar el ratón, **solo en la nav**.
- **Navegación móvil:**
  - Barra con NEO · "Propuesta" · "Menú" (texto, sin icono de hamburguesa).
  - El menú se abre a pantalla completa en **negro puro**, con un revelado `clip-path` de 600 ms (EaseReverseClipMenu, sin vídeo ni póster de fondo).
  - Enlaces grandes con máscara y stagger de 40 ms. Abajo, el CTA y el WhatsApp en texto.
  - Gestiona el foco y se cierra con Esc.
- **Preloader: ninguno.** La intro de la sección 0 (≤900 ms) lo sustituye. No se usa IntroGridMotionTransition, ni anillo, ni letterbox.
- **Transiciones de página:**
  - View Transitions API (`viewTransition` de React Router) con elemento compartido: pieza → hero del caso, fila de La Casa → hero del servicio y siguiente oficio.
  - En navegadores sin soporte, fundido por negro de 300 ms.
  - Con reduced motion, el cambio es instantáneo.
  - **No hay cortinas.**
- **Footer:**
  - En la home, la revelación de la sección 9.
  - En el resto de páginas, una versión sobria **sin la frase de revelación** para no gastarla: wordmark estático, CTA, columnas (Colección · Servicios · Atelier · Contacto), email, Instagram, TikTok, WhatsApp, ES/EN, legales y la línea `[ NEO Studio · España · 2026 ]`.

---

## 7. Presupuesto de motion

**Se anima (lista cerrada):**
1. La intro: wordmark y titular del hero en máscara, una sola vez.
2. El loop del vídeo del hero, con botón de pausa siempre visible.
3. El titular del manifiesto en máscara, una sola vez.
4. **El scrub de La Mesa**, con timecode y REC (PIN 1).
5. El parallax interno de ±6% del carril de webs y el vídeo de la pieza centrada.
6. Los vídeos de la Colección al pasar el ratón o entrar en pantalla (**uno a la vez**, mediante el componente `VideoSlot`).
7. La vista previa por `clip-path` de La Casa y el Flip del resultado "Por situación".
8. Los 2 CTA magnéticos: el del hero y el de Cliente privado.
9. El letter flip, solo en la nav.
10. La nav (ocultar y mostrar) y el `clip-path` del menú móvil.
11. Las View Transitions entre páginas.
12. El revelado del footer en escritorio (PIN 2), con máscara en las dos frases y partículas en Canvas 2D.
13. En subpáginas: una interacción por servicio, siempre iniciada por el usuario o con su único pin.
14. El progreso del brief.

**Quieto a propósito:**
- Párrafos, subtítulos, fichas, metadatos y titulares secundarios. **No hay fade-up en ninguna sección.**
- Atelier completo y la sección clara (salvo su CTA).
- Tablas, entregables, FAQ (solo la apertura nativa), testimonios y legales.
- El hero al hacer scroll: sin zoom ni parallax.
- Imágenes al pasar el ratón: sin zoom.
- Cursor: el del sistema. No hay barra de progreso de scroll.

**Parámetros:**
- Entradas de 500 a 800 ms con `expo.out`. Stagger de 30 a 50 ms con 8 elementos como máximo. Sin bounce ni elastic.
- Todo dentro de `gsap.matchMedia()`, con una rama `prefers-reduced-motion` diseñada (no solo desactivada).
- Los estados ocultos iniciales solo existen si la clase `html.js` está presente.

**Contrato de rendimiento (verificado en CI):**
- LCP por debajo de 2,5 s y CLS por debajo de 0,1 en un móvil de gama media.
- JS inicial de 120 KB gz como máximo (GSAP core, ScrollTrigger y SplitText; Flip, ScrambleText y Three.js bajo demanda).
- 60 fps en La Mesa en un iPhone de hace 3 años.
- Relaciones de aspecto fijadas en todos los medios.
- Vídeos pausados fuera de pantalla.

---

## 8. Assets que debe aportar el cliente (priorizados)

| Prioridad | Asset | Formato recomendado | Desbloquea |
|---|---|---|---|
| 1 | **Variantes del vino en Higgsfield** con el mismo start-frame y end-frame: 9:16 y 16:9 en alta resolución | 1080×1920 y 1920×1080 o más, fondo negro, loop de 6 s, máster sin comprimir de más (HEVC o ProRes) | Hero a sangre en escritorio y hero vertical a pantalla completa en móvil |
| 2 | **Máster original de gastronomía** y, si se puede, una variante 4:5 o vertical | El 2048×1152 a 60 fps original, sin recomprimir. Variante a 1080×1350 o 1080×1920 | Secuencia de frames de calidad y recorte móvil sin perder el cuchillo |
| 3 | **Grabaciones de las 6 webs**, con permiso de cada cliente | Escritorio 1440×900 a 60 fps y móvil 390×844, de 8 a 10 s, MP4 de alta calidad o ProRes, scroll natural y sin notificaciones. Más la URL autorizada y el año | Carril de webs, casos y hero de Webs de autor |
| 4 | **Foto del atelier** (2 o 3) | RAW o TIFF de 4000 px o más, luz baja sobre fondo negro: Pablo en DaVinci, grabando con el móvil, mesa con referencias | Atelier, `/atelier` y OG |
| 5 | **Vídeos explicativos de Vídeo IA, Webs y Contenido** (V1): 3 o 4 por servicio | Piezas de 20 a 40 s, máster 4K 16:9 con zona segura para recorte 9:16, audio limpio en ES, subtítulos `.srt` o `.vtt` en ES y EN | Bloque 4 de las subpáginas V1 |
| 6 | **Guion real de Trono** | Texto con timecodes por línea (`.vtt` o tabla) | Interacción "Del guion al feed" |
| 7 | **Los 7 clips pendientes** | Criterios de aceptación: fondo negro, 1080p o más, de 5 a 8 s, y además loop sin costura o un recorrido claro para scrub. Indicar si el sujeto está centrado y se puede recortar a 9:16. Solo entran los mejores | Colección, heroes de subpáginas y diversidad de sectores |
| 8 | **Testimonios** (2 o más) con permiso escrito | Nombre, cargo, empresa, cita de 25 palabras o menos y logo en SVG monocromo | Cliente privado y casos |
| 9 | **Par bruto/final real** de un trabajo de edición | ProRes o DNxHR, el mismo plano y la misma duración | Interacción de Postproducción |
| 10 | **Plano real rodado con móvil**, en Log y etalonado | Blackmagic Camera o Apple Log, HEVC de 10 bits o ProRes, vertical, más la versión etalonada y la LUT | Hero e interacción de Cine con tu móvil |
| 11 | **Producto 3D generado** con 3 o 4 acabados | GLB de 5 MB como máximo (Draco y texturas 2K) más USDZ | Interacción de 3D con IA |
| 12 | **Robot NEO exportado** | GLB más un render AVIF para póster | Caso `neo-app` |
| 13 | Logo NEO definitivo y licencias de fuentes | SVG; licencia web de PP Neue Montreal | Identidad final |
| 14 | Datos y decisiones de negocio | Razón social y NIF (aviso legal), rangos de inversión por servicio, plazo de respuesta comprometido | Legales, brief y /gracias |

---

## 9. Preguntas abiertas para el cliente (las que cambian el diseño)

1. **¿Qué rangos de inversión hay por servicio, y os comprometéis a un plazo de respuesta (por ejemplo, 48 h)?** Define el paso 4 del brief, los "tres datos" de Cliente privado y lo que promete `/gracias`.
2. **¿Cine con tu móvil se vende como el resto (propuesta a medida) o como producto (sesión reservable, precio orientativo, guía en PDF a cambio del email)?** Si es producto, esa página tendrá un embudo y un tono propios, aislados de la marca principal.
3. **¿Tenéis permiso de los 6 clientes para mostrar sus webs con nombre y pedirles una cita? ¿Llegarán las grabaciones antes del lanzamiento?** Decide si el carril de webs sale con vídeo o en su variante tipográfica, y si Cliente privado lleva testimonios.
4. **¿Podéis generar en Higgsfield las variantes verticales y en alta resolución del vino y de la gastronomía?** Si se puede, el hero va a sangre y en 9:16. Si no, se mantiene el encuadre contenido a ~70vw y el recorte 4:5.
5. **¿Quién da la cara: Pablo como autor o un equipo? ¿Confirmáis "NEO Studio" como nombre público y dominio?** Cambia el tono del Atelier, las fotos que hay que producir y la desambiguación con la app de fitness.

---

## 10. Resumen de jueces y qué se tomó de cada propuesta

| Propuesta | Marca | Embudo | Ingeniería | **Total** | Veredicto |
|---|---|---|---|---|---|
| A · Keynote de Apple | 44 | 47 | 46 | **137** | 2.ª: la más disciplinada y viable, pero su home depende de tiles sin assets y gasta la revelación a mitad de página |
| B · Película en actos (Oryzo) | 43 | 44 | 44 | **131** | 3.ª: la de más voz y memoria, pero la home lo cuenta todo, apoya pruebas en material simulado y añade latencia |
| **C · Maison de lujo** | 47 | 49 | 48 | **144** | **Ganadora unánime**: esqueleto, embudo medible y vocabulario de casa de lujo |

| Origen | Qué se tomó | Qué se descartó y por qué |
|---|---|---|
| **C (base)** | Idea de maison (Colección, Atelier). Hero de vino contenido a ~70vw por honestidad con el 720p. La Mesa cerrando en la copa. Silencio después del pico. Colección asimétrica con un vídeo a la vez. La Casa como índice con vista previa. Atelier "La IA genera. Nosotros dirigimos." Única sección clara para la venta. Footer con ParticleField en Canvas 2D formando NEO. Condición de veracidad. Brief con paso de inversión, campos ocultos y eventos. Cine con móvil con conversión propia. "Ver la rejilla". FAQ "¿Cuánto cuesta?". 404 "Esta pieza no existe. Aún." | El pin de 450vh de Webs (pasa a carril sin pin). La numeración "Pieza 001/004" (pasa a nombres propios). El preloader de anillo y la cortina de 2 capas. El giroscopio. Los pósters negros visibles. El calendario solo por encima del umbral. "Solicitar cita / Cita privada". Las cifras de ejemplo en los rangos. Los píxeles en la v1. El copy "parecen rodados", "se recuerdan y convierten" y "no se conforman". El póster en el menú móvil |
| **B** | El asterisco azul que se resuelve en el footer. Timecode y REC en La Mesa. "Un spot de cocina. Sin cocina." Manifiesto "Compiten por memoria". "Webs que se visitan dos veces". Nombres propios y separación Clientes / Estudios propios. Guion sincronizado (en la subpágina de Contenido). Subapartados con vídeos de 20 a 40 s. Truco del vídeo apilado (Postproducción, solo con bruto real). `/gracias` con ID y WhatsApp prerrellenado. "Prefiero hablarlo". Contrato de rendimiento en CI. Modelo de contenido con estado "pendiente". Nunca IA presentada como grabación con móvil | La home de 12 secciones con 4 o 5 demos. El robot NEO en la home. El "bruto" simulado. La Mesa en letterbox en móvil. El preloader Letterbox de 1,8 s. La cortina LayersAnimation. El tono de truco en "Si te los hemos hecho creer" (pasa a firma de oficio) |
| **A** | Sin preloader, con intro de 900 ms como máximo. Especificación de carga del scrub (orden de frames, `createImageBitmap`, DPR ≤ 2, fallback con Save-Data o 3G, nunca `currentTime`). View Transitions con elemento compartido. Navegación local en las subpáginas. "¿Cuál es para ti?" (integrado en La Casa y en el paso 1 del brief, no como test aparte). CTA "Solicitar propuesta". "NEO Studio" en title y JSON-LD. Criterios de aceptación de los 7 clips. Ficha técnica y FAQ de derechos de uso | Las 6 tiles estilo apple.com con 4 huecos y los enlaces azules "Descubrir ›". "Nada de esto se rodó." a mitad de página. Hero de 720p a sangre. "Cine de lujo. Sin rodaje." (choca con Cine con móvil, de ahí "sin plató"). Three.js para las partículas. Doble CTA en cada tile. Comparador de columnas desplegables. "Seis formas de verse mejor" y "Lo dicen ellos" |

**Fases de lanzamiento:**
- **V1:** home completa, `/coleccion` con casos, hub `/servicios`, Vídeo IA, Webs de autor y Contenido completas; 3D, Postproducción y Cine con móvil en versión editorial; contacto, `/gracias`, legales y EN.
- **V2:** interacciones y vídeos de 3D, Postproducción y Cine con móvil cuando existan sus assets reales, y píxeles con banner de consentimiento.