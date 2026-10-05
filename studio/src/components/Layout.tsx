import { useEffect } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { ScrollTrigger } from '@/lib/motion'
import { Nav } from './Nav'
import { Footer } from './Footer'
import { Intro } from './Intro'
import '@/styles/global.css'

export function Layout() {
  const { pathname } = useLocation()
  // Al cargar la fuente (y al cambiar de página) la maqueta se recoloca: recalcula los ScrollTriggers
  useEffect(() => {
    let alive = true
    document.fonts?.ready.then(() => alive && ScrollTrigger.refresh())
    return () => {
      alive = false
    }
  }, [pathname])
  return (
    <>
      <Intro />
      <Nav />
      <main id="main" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </>
  )
}
