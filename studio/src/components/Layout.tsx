import { Outlet, ScrollRestoration } from 'react-router-dom'
import { Nav } from './Nav'
import { Footer } from './Footer'
import { Intro } from './Intro'
import '@/styles/global.css'

export function Layout() {
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
