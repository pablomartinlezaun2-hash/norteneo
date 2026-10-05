#!/usr/bin/env node
// Tras el prerender: mueve la 404 a dist/404.html y genera sitemap.xml con hreflang.
import { existsSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const DIST = resolve(import.meta.dirname, '../dist')
const SITE = (process.env.VITE_SITE_URL ?? 'https://neo-studio.vercel.app').replace(/\/$/, '')

const nf = join(DIST, '404/index.html')
if (existsSync(nf)) {
  renameSync(nf, join(DIST, '404.html'))
  rmSync(join(DIST, '404'), { recursive: true, force: true })
}

const pages = []
const walk = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) walk(p)
    else if (f === 'index.html') pages.push('/' + p.slice(DIST.length + 1).replace(/index\.html$/, '').replace(/\/$/, ''))
  }
}
walk(DIST)
const urls = pages
  .filter((p) => !p.includes('gracias') && !p.includes('thank-you'))
  .sort()
  .map((p) => `  <url><loc>${SITE}${p === '/' ? '/' : p}</loc></url>`)
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
)
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`)
console.log(`postbuild: ${pages.length} páginas, sitemap.xml y 404.html listos`)
