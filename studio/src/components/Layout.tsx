import { useEffect, useRef, useState } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { ScrollTrigger } from '@/lib/motion'
import { Nav } from './Nav'
import { Footer } from './Footer'
import { Intro } from './Intro'
import '@/styles/global.css'

export function Layout() {
  const { pathname } = useLocation()
  const first = useRef(true)
  const [announce, setAnnounce] = useState('')

  // Al cargar la fuente (y al cambiar de página) la maqueta se recoloca: recalcula los ScrollTriggers
  useEffect(() => {
    let alive = true
    document.fonts?.ready.then(() => {
      if (!alive) return
      // En reposo: el refresco recalcula todas las posiciones y no debe competir con la carga
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback
      if (ric) ric(() => alive && ScrollTrigger.refresh(), { timeout: 1500 })
      else setTimeout(() => alive && ScrollTrigger.refresh(), 200)
    })
    return () => {
      alive = false
    }
  }, [pathname])

  // Navegación en cliente: el foco va al contenido principal y se anuncia el título de la página
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const id = window.setTimeout(() => {
      document.getElementById('main')?.focus({ preventScroll: true })
      setAnnounce(document.title)
    }, 60)
    return () => window.clearTimeout(id)
  }, [pathname])

  return (
    <>
      <Intro />
      <Nav />
      <main id="main" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <div id="site-footer">
        <Footer />
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </p>
      <ScrollRestoration />
    </>
  )
}
