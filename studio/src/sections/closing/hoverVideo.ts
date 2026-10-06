/**
 * Reproducción al pasar el ratón para piezas con <Video play="manual">.
 * <Video> no expone su elemento, así que se localiza dentro del contenedor.
 * Un solo vídeo activo a la vez entre todas las piezas que usen este helper
 * (el resto de vídeos "exclusive" de la página ya están pausados fuera de pantalla).
 */
let active: HTMLVideoElement | null = null

export function playIn(el: HTMLElement | null) {
  const v = el?.querySelector('video')
  if (!v) return
  if (active && active !== v) active.pause()
  active = v
  v.play().catch(() => undefined)
}

export function pauseIn(el: HTMLElement | null) {
  const v = el?.querySelector('video')
  if (!v) return
  v.pause()
  if (active === v) active = null
}
