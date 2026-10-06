# NEO Studio · web

Web de marca de **NEO Studio**: vídeo con IA, 3D con IA, webs de autor, postproducción, contenido para redes y cine con tu móvil.

- Proyecto independiente dentro del repo `norteneo`. No toca la app de fitness NEO.
- Stack: Vite + React 19 + TypeScript + Tailwind v4 + GSAP.
- Las 60 páginas (ES en la raíz, EN bajo `/en`) se generan como HTML estático con `vite-react-ssg`. Así cargan rápido y Google las lee completas.

## Publicar en Vercel (5 minutos)
1. Entra en [vercel.com](https://vercel.com) → **Add New… → Project** → importa el repositorio `norteneo`.
2. En **Root Directory** elige **`studio`**. Vercel detecta `vercel.json`: build `npm run build`, salida `dist`.
3. (Opcional) En **Environment Variables**:

| Variable | Para qué | Valor por defecto |
|---|---|---|
| `VITE_SITE_URL` | Dominio final (canonical, hreflang, sitemap) | `https://neo-studio.vercel.app` |
| `VITE_WHATSAPP` | WhatsApp en formato internacional | `34629946893` |
| `VITE_CONTACT_EMAIL` | Email comercial | `neo.method.lab@gmail.com` |
| `VITE_LEAD_ENDPOINT` | Dónde se envía el brief | `https://formsubmit.co/ajax/neo.method.lab@gmail.com` |
| `VITE_INSTAGRAM` | URL de Instagram (si se deja vacío, no se muestra) | vacío |

4. **Deploy**. Para tu dominio: **Settings → Domains**. Después actualiza `VITE_SITE_URL` y vuelve a desplegar.

### Activar el formulario (una sola vez)
El brief de `/contacto` se envía por **FormSubmit** (gratuito, sin servidor).

1. La primera vez que alguien lo envía, FormSubmit manda a `neo.method.lab@gmail.com` un email de **activación**. Mira también la carpeta de spam.
2. Pulsa el enlace.
3. Desde ese momento cada propuesta llega a tu correo como una tabla.

Mientras no esté activado, la web ofrece WhatsApp y email como alternativa.

## Trabajar en local
```bash
cd studio
npm ci
npm run dev          # http://localhost:5174
npm run build        # genera dist/ (60 páginas + 404.html + sitemap.xml)
npm run preview      # sirve dist/ en http://localhost:4173
npm run lint && npm run typecheck
```

## Añadir o cambiar vídeos
1. Copia el original (MP4/MOV, cualquier peso) en `studio/media-src/`. Esa carpeta no se sube a git.
2. Añádelo al catálogo `CLIPS` de `scripts/media.mjs` con un `id`, su orientación (`land` / `port`) y el segundo del póster.
3. Ejecuta `node scripts/media.mjs <id>`. El script genera:
   - versiones AV1 + H.264 ligeras
   - pósters AVIF/JPG
   - secuencias para scroll si las pides

   Y actualiza `src/content/media.json`.
4. Úsalo en un caso (`src/content/cases.ts`, campo `media`) o en un servicio (`src/content/services.ts`).

Por ejemplo, la grabación de pantalla de una de tus webs: añade `media: '<id>'` a su caso y la tarjeta mostrará el vídeo en lugar de la versión tipográfica.

## Dónde se edita cada cosa
| Qué | Archivo |
|---|---|
| Contacto, dominio y Instagram | `src/content/site.ts` (o variables de entorno) |
| Servicios: nombre, frase, vídeo | `src/content/services.ts` y detalle en `src/content/services/<id>.ts` |
| Casos y webs del portfolio | `src/content/cases.ts` |
| Textos de la home | `src/sections/home/*.tsx` y `src/sections/house/copy.ts` |
| Brief de contacto (pasos, rangos de inversión) | `src/sections/contact/` (`config.ts` → `INVESTMENT`) |
| Textos legales | `src/content/legal/` (completa los `[PENDIENTE: …]`) |
| Colores, tipografía y utilidades | `src/styles/global.css` |
| Reglas de diseño del proyecto | `AGENTS.md` |

## Pendiente de Pablo
- **Datos legales** del titular: razón social, NIF y domicilio, en `src/content/legal/`.
- **Dominio final** (`VITE_SITE_URL`) e **Instagram**.
- **Grabaciones de pantalla** de Urbalia y Masventa. Las de Navarro, Nexodea, Waka Wow y Pedacito de Cielo ya están puestas.
- **Foto de Pablo** o del estudio. `/estudio` y la home funcionan sin ella.
- **Material de vídeo:**
  - par real **Log / etalonado** grabado con móvil, para Cine con tu móvil
  - **vídeos explicativos** de 60 s por servicio
  - **testimonios** reales (se muestran a partir de 2)
- **Validar textos:** guion de «Trono», formato de la sesión de Cine con tu móvil, rangos de inversión del brief y las preguntas frecuentes.
