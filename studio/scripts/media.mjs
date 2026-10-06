#!/usr/bin/env node
// Pipeline de media de NEO Studio.
// Convierte los vídeos fuente (media-src/, fuera de git) en versiones web ligeras:
//   - H.264 (compatibilidad total) + AV1 (más ligero), faststart, sin audio salvo los clips con `audio: true`
//   - pósters AVIF + JPG
//   - secuencias WebP para los scroll-scrub (escritorio y móvil)
//   - reels del hero (16:9 y 9:16) montados a partir de varios clips
// y escribe src/content/media.json con rutas, tamaños y pesos.
//
// Uso: node scripts/media.mjs [id ...]   (sin ids procesa todo; NO_SEQ=1 conserva las secuencias ya hechas)
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const ROOT = resolve(import.meta.dirname, '..')
const SRC = resolve(ROOT, process.env.MEDIA_SRC ?? 'media-src')
const OUT = resolve(ROOT, 'public/media')
const MANIFEST = resolve(ROOT, 'src/content/media.json')
const TMP = join(tmpdir(), 'neo-media')
mkdirSync(TMP, { recursive: true })

const LAND = { w: 1920, h: 1080 }
const PORT = { w: 720, h: 1280 }

/**
 * Catálogo de clips.
 * orient: 'land' | 'port'
 * cuts: segmentos [inicio, fin] en segundos que se conservan (se concatenan)
 * poster: segundo del póster (relativo al clip ya recortado)
 * seq: secuencias de frames para scroll-scrub
 */
const CLIPS = [
  { id: 'gastro', src: 'gastro.mp4', orient: 'land', poster: 4.3, audio: true,
    seq: { desktop: { w: 1280, h: 720, frames: 150, fit: 'contain' }, mobile: { w: 960, h: 540, frames: 75, fit: 'contain' } } },
  { id: 'wine', src: 'wine.mp4', orient: 'land', poster: 2.4, audio: true, upscale: true },
  { id: 'fpv-kitchen', src: 'fpv-kitchen.mov', orient: 'land', poster: 7.4, audio: true },
  { id: 'tacos-spot', src: 'tacos-spot.mov', orient: 'land', poster: 7.6, audio: true },
  { id: 'tacos-drop', src: 'tacos-drop.mp4', orient: 'land', poster: 2.0, audio: true,
    seq: { desktop: { w: 1280, h: 720, frames: 120, fit: 'cover', q: 50 }, mobile: { w: 640, h: 800, frames: 80, fit: 'cover', q: 50 } } },
  { id: 'flambe', src: 'flambe.mov', orient: 'land', poster: 6.5, audio: true },
  { id: 'golden-key', src: 'golden-key.mov', orient: 'land', poster: 5.6, audio: true,
    seq: { desktop: { w: 1280, h: 720, frames: 150, fit: 'cover' }, mobile: { w: 640, h: 800, frames: 75, fit: 'cover' } } },
  { id: 'empire-teaser', src: 'empire-teaser.mov', orient: 'port', poster: 3.6, audio: true },
  // Montaje limpio: se saltan los textos generados con faltas
  // ("CONSTRUCIÓN DE A MIPEDIA" 8.1 s, "SIMULADOR DE HIPOTEA" 10.1 s y el claim final 13 s).
  { id: 'empire-film', src: 'empire-film.mov', orient: 'port', poster: 4.2, cuts: [[0, 8.1], [8.83, 10.05], [10.93, 12.95]], audio: true },
  { id: 'fashion', src: 'fashion.mp4', orient: 'port', poster: 3.5, audio: true },
  { id: 'ugc-move', src: 'ugc-move.mov', orient: 'port', poster: 13.5, audio: true },
  { id: 'running', src: 'running.mov', orient: 'port', poster: 10.5, audio: true },
  { id: 'logo', src: 'logo.mp4', orient: 'land', poster: 2.5, hq: true },
  // Grabaciones de pantalla de las webs de clientes (ya recortadas, sin la barra del navegador)
  { id: 'web-navarro', src: 'web-navarro.mp4', orient: 'land', poster: 9.0 },
  { id: 'web-nexodea', src: 'web-nexodea.mp4', orient: 'land', poster: 2.9 },
  { id: 'web-waka-wow', src: 'web-waka-wow.mp4', orient: 'land', poster: 0.6 },
  { id: 'web-pedacito', src: 'web-pedacito.mp4', orient: 'land', poster: 0.6 },
]

/** Reels del hero: [clip, inicio, fin, crop?] */
const REELS = [
  { id: 'reel-land', orient: 'land', poster: 0, segments: [
    ['wine.mp4', 0.4, 2.9],
    ['gastro.mp4', 0.0, 2.3],
    ['golden-key.mov', 3.4, 5.9],
    ['fpv-kitchen.mov', 5.4, 8.0],
  ] },
  { id: 'reel-port', orient: 'port', poster: 0, segments: [
    ['fashion.mp4', 0.3, 2.6],
    ['gastro.mp4', 0.2, 2.4, 'center'],
    ['empire-teaser.mov', 3.2, 5.4],
    ['golden-key.mov', 4.4, 6.0, 'center'],
  ] },
]

const only = new Set(process.argv.slice(2))
const want = (id) => only.size === 0 || only.has(id)

function run(args, label) {
  const t = Date.now()
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] })
  if (label) console.log(`  ✓ ${label} (${((Date.now() - t) / 1000).toFixed(1)} s)`)
}

function probe(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries',
    'stream=width,height,r_frame_rate:format=duration', '-of', 'json', file]).toString()
  const j = JSON.parse(out)
  const s = j.streams[0]
  const [n, d] = s.r_frame_rate.split('/').map(Number)
  return { w: s.width, h: s.height, fps: n / d, duration: Number(j.format.duration) }
}

const size = (f) => statSync(f).size
const rel = (f) => '/' + f.slice(resolve(ROOT, 'public').length + 1).split('\\').join('/')

/** Escalado + recorte para llenar el formato destino (cover). */
function coverFilter(target, cropMode) {
  const { w, h } = target
  const pre = cropMode === 'center' ? '' : ''
  return `${pre}scale=${w}:${h}:force_original_aspect_ratio=increase:flags=lanczos,crop=${w}:${h},setsar=1`
}

/** Normaliza un clip (con recortes opcionales) a un intermedio de alta calidad. */
function intermediate(clip) {
  const src = join(SRC, clip.src)
  const out = join(TMP, `${clip.id}.mezz.mp4`)
  const fps = clip.orient === 'land' ? 30 : (probe(src).fps > 30 ? 30 : 24)
  // Sonido: volumen igualado entre clips (EBU R128, -16 LUFS) para que ninguno suene más que otro
  const loud = 'loudnorm=I=-16:TP=-1.5:LRA=11'
  if (clip.cuts) {
    const n = clip.cuts.length
    const v = clip.cuts.map(([a, b], i) => `[0:v]trim=${a}:${b},setpts=PTS-STARTPTS[v${i}]`)
    // Microfundidos en cada corte para que el audio no "chasquee"
    const a = clip.audio ? clip.cuts.map(([s0, e], i) => `[0:a]atrim=${s0}:${e},asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st=${(e - s0 - 0.03).toFixed(2)}:d=0.03[a${i}]`) : []
    const ins = clip.cuts.map((_, i) => (clip.audio ? `[v${i}][a${i}]` : `[v${i}]`)).join('')
    const cat = `${ins}concat=n=${n}:v=1:a=${clip.audio ? 1 : 0}${clip.audio ? '[c][ca]' : '[c]'}`
    const graph = [...v, ...a, cat, `[c]fps=${fps},format=yuv420p[o]`, ...(clip.audio ? [`[ca]${loud}[oa]`] : [])].join(';')
    run(['-i', src, '-filter_complex', graph, '-map', '[o]', ...(clip.audio ? ['-map', '[oa]', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000'] : ['-an']),
      '-c:v', 'libx264', '-crf', '12', '-preset', 'veryfast', out], `${clip.id}: montaje limpio`)
  } else {
    const audio = clip.audio ? ['-af', loud, '-c:a', 'aac', '-b:a', '256k', '-ar', '48000'] : ['-an']
    run(['-i', src, '-vf', `fps=${fps},format=yuv420p`, '-c:v', 'libx264', '-crf', '12', '-preset', 'veryfast', ...audio, out], `${clip.id}: intermedio`)
  }
  return out
}

function encodeVideo(id, mezz, orient, outDir, extra = {}) {
  const sources = []
  // Sin audio salvo los clips marcados con audio (AAC, compatible con H.264 y AV1 en MP4)
  const audio = extra.audio ? ['-c:a', 'aac', '-b:a', '128k'] : ['-an']
  const targets = orient === 'land'
    ? [{ tag: '1080', ...LAND, crf: 23, max: '5M' }, { tag: '720', w: 1280, h: 720, crf: 24, max: '2200k' }]
    : [{ tag: '720', ...PORT, crf: 24, max: '2600k' }]
  const sharpen = extra.upscale ? ',unsharp=5:5:0.6:5:5:0.0' : ''
  for (const t of targets) {
    const f = join(outDir, `${id}-${t.tag}.mp4`)
    run(['-i', mezz, '-vf', `${coverFilter(t)}${t.tag === '1080' ? sharpen : ''}`, '-c:v', 'libx264', '-profile:v', 'high',
      '-crf', String(extra.hq ? 17 : t.crf), '-maxrate', t.max, '-bufsize', String(parseInt(t.max) * 2) + (t.max.endsWith('M') ? 'M' : 'k'),
      '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', ...audio, f], `${id}: H.264 ${t.tag}`)
    sources.push({ src: rel(f), type: 'video/mp4', codec: 'h264', w: t.w, h: t.h, bytes: size(f) })
  }
  const big = targets[0]
  const av1 = join(outDir, `${id}-${big.tag}.av1.mp4`)
  run(['-i', mezz, '-vf', `${coverFilter(big)}${big.tag === '1080' ? sharpen : ''}`, '-c:v', 'libsvtav1', '-crf', extra.hq ? '22' : orient === 'land' ? '36' : '35',
    '-preset', '6', '-g', '60', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', ...audio, av1], `${id}: AV1 ${big.tag}`)
  sources.unshift({ src: rel(av1), type: 'video/mp4; codecs="av01.0.08M.08"', codec: 'av1', w: big.w, h: big.h, bytes: size(av1) })
  return sources
}

function posters(id, mezz, orient, at, outDir) {
  const t = orient === 'land' ? LAND : PORT
  const jpg = join(outDir, `${id}-poster.jpg`)
  const avif = join(outDir, `${id}-poster.avif`)
  run(['-ss', String(at), '-i', mezz, '-frames:v', '1', '-vf', coverFilter(t), '-q:v', '4', jpg])
  run(['-ss', String(at), '-i', mezz, '-frames:v', '1', '-vf', `${coverFilter(t)},format=yuv420p`, '-c:v', 'libaom-av1',
    '-still-picture', '1', '-crf', '32', '-cpu-used', '6', avif], `${id}: pósters`)
  return { avif: rel(avif), jpg: rel(jpg), w: t.w, h: t.h, bytesAvif: size(avif), bytesJpg: size(jpg) }
}

function sequence(id, mezz, variant, spec, outDir) {
  const dir = join(outDir, 'seq', variant)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  const { duration } = probe(mezz)
  const fps = spec.frames / duration
  const fit = spec.fit === 'contain'
    ? `scale=${spec.w}:${spec.h}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${spec.w}:${spec.h}:(ow-iw)/2:(oh-ih)/2:black`
    : `scale=${spec.w}:${spec.h}:force_original_aspect_ratio=increase:flags=lanczos,crop=${spec.w}:${spec.h}`
  run(['-i', mezz, '-vf', `fps=${fps},${fit}`, '-frames:v', String(spec.frames), '-c:v', 'libwebp',
    '-quality', String(spec.q ?? (variant === 'desktop' ? 58 : 55)), '-compression_level', '6', join(dir, '%04d.webp')], `${id}: secuencia ${variant}`)
  const files = readdirSync(dir).filter((f) => f.endsWith('.webp')).sort()
  const bytes = files.reduce((a, f) => a + size(join(dir, f)), 0)
  return { base: rel(dir), count: files.length, pattern: '{n4}.webp', w: spec.w, h: spec.h, fit: spec.fit, bytes }
}

function buildReel(reel) {
  const t = reel.orient === 'land' ? LAND : PORT
  const inputs = []
  const chains = []
  reel.segments.forEach(([file, a, b], i) => {
    inputs.push('-ss', String(a), '-t', String(b - a), '-i', join(SRC, file))
    const d = b - a
    const fadeIn = i === 0 ? '' : `,fade=t=in:st=0:d=0.18`
    chains.push(`[${i}:v]fps=30,${coverFilter(t)},format=yuv420p${fadeIn},fade=t=out:st=${(d - 0.28).toFixed(2)}:d=0.28[s${i}]`)
  })
  const cat = reel.segments.map((_, i) => `[s${i}]`).join('') + `concat=n=${reel.segments.length}:v=1:a=0[o]`
  const out = join(TMP, `${reel.id}.mezz.mp4`)
  run([...inputs, '-filter_complex', `${chains.join(';')};${cat}`, '-map', '[o]', '-c:v', 'libx264', '-crf', '12', '-preset', 'veryfast', '-an', out], `${reel.id}: montaje`)
  return out
}

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {}

for (const reel of REELS) {
  if (!want(reel.id)) continue
  console.log(`\n▸ ${reel.id}`)
  const outDir = join(OUT, 'reel'); mkdirSync(outDir, { recursive: true })
  const mezz = buildReel(reel)
  const info = probe(mezz)
  manifest[reel.id] = {
    id: reel.id, orient: reel.orient, duration: +info.duration.toFixed(2),
    sources: encodeVideo(reel.id, mezz, reel.orient, outDir),
    poster: posters(reel.id, mezz, reel.orient, reel.poster, outDir),
  }
}

for (const clip of CLIPS) {
  if (!want(clip.id)) continue
  console.log(`\n▸ ${clip.id}`)
  const outDir = join(OUT, clip.id); mkdirSync(outDir, { recursive: true })
  const mezz = intermediate(clip)
  const info = probe(mezz)
  const entry = {
    id: clip.id, orient: clip.orient, duration: +info.duration.toFixed(2),
    ...(clip.audio ? { audio: true } : {}),
    sources: encodeVideo(clip.id, mezz, clip.orient, outDir, clip),
    poster: posters(clip.id, mezz, clip.orient, clip.poster, outDir),
  }
  if (clip.seq && process.env.NO_SEQ && manifest[clip.id]?.seq) {
    // Reutiliza las secuencias ya generadas (solo cambia el vídeo o el audio)
    entry.seq = manifest[clip.id].seq
  } else if (clip.seq) {
    entry.seq = {}
    for (const [variant, spec] of Object.entries(clip.seq)) entry.seq[variant] = sequence(clip.id, mezz, variant, spec, outDir)
  }
  manifest[clip.id] = entry
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
const total = execFileSync('du', ['-sh', OUT]).toString().trim()
console.log(`\nManifiesto: ${MANIFEST}\nTotal media: ${total}`)
