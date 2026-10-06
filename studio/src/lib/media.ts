import manifest from '@/content/media.json'

export type VideoSource = { src: string; type: string; codec: 'av1' | 'h264'; w: number; h: number; bytes: number }
export type Poster = { avif: string; jpg: string; w: number; h: number; bytesAvif: number; bytesJpg: number }
export type Sequence = { base: string; count: number; pattern: string; w: number; h: number; fit: 'cover' | 'contain'; bytes: number }
export type MediaEntry = {
  id: string
  orient: 'land' | 'port'
  duration: number
  sources: VideoSource[]
  poster: Poster
  seq?: { desktop: Sequence; mobile: Sequence }
}

/**
 * IDs disponibles (ver scripts/media.mjs):
 * reel-land, reel-port, gastro, wine, fpv-kitchen, tacos-spot, tacos-drop, flambe, golden-key,
 * empire-teaser, empire-film, fashion, ugc-move, running, logo
 */
export type MediaId = keyof typeof manifest | (string & {})

const all = manifest as unknown as Record<string, MediaEntry>

export function getMedia(id: MediaId): MediaEntry | undefined {
  return all[id]
}

export function mustMedia(id: MediaId): MediaEntry {
  const m = all[id]
  if (!m) throw new Error(`Media no encontrada: ${id}`)
  return m
}

/** URL del frame n (0-based) de una secuencia. */
export function frameUrl(seq: Sequence, n: number): string {
  const i = Math.max(0, Math.min(seq.count - 1, n)) + 1
  return `${seq.base}/${String(i).padStart(4, '0')}.webp`
}

export const aspect = (m: MediaEntry) => `${m.poster.w} / ${m.poster.h}`
