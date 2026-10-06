#!/usr/bin/env node
// Tras el prerender:
//  - mueve la 404 a dist/404.html y la marca para renderizarse en cliente (sin hidratar),
//    porque Vercel la sirve en cualquier ruta (también /en/...) y el idioma depende de la URL
//  - pone <meta charset> lo primero del <head> y precarga la fuente latina y el runtime de React
//  - genera sitemap.xml con alternativas hreflang y robots.txt
//  - avisa si los textos legales siguen con datos [PENDIENTE]
import { existsSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const DIST = join(ROOT, 'dist')
// Misma regla que vite.config.ts: VITE_SITE_URL, o el dominio de producción del proyecto en Vercel
const SITE = (
  process.env.VITE_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:4173')
).replace(/\/$/, '')

// 404
const nf = join(DIST, '404/index.html')
if (existsSync(nf)) {
  renameSync(nf, join(DIST, '404.html'))
  rmSync(join(DIST, '404'), { recursive: true, force: true })
}

// Recursos a precargar
const assets = readdirSync(join(DIST, 'assets'))
const font = assets.find((f) => /^archivo-latin-wdth-normal-.*\.woff2$/.test(f))
const client = assets.find((f) => /^client-.*\.js$/.test(f))

const htmlFiles = []
const walk = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) {
      if (f !== 'assets' && f !== 'media') walk(p)
    } else if (f.endsWith('.html')) htmlFiles.push(p)
  }
}
walk(DIST)

const pages = []
for (const file of htmlFiles) {
  let html = readFileSync(file, 'utf8')
  // Quita la marca temporal usada para el CSS crítico (ver vite.config.ts → onPageRendered)
  html = html.replace(/(<html[^>]*?)\s+class="js intro-seen"/i, '$1')
  // charset al principio del <head>
  html = html.replace(/<meta charset="UTF-8"\s*\/?>/i, '')
  const preloads = [
    font ? `<link rel="preload" href="/assets/${font}" as="font" type="font/woff2" crossorigin>` : '',
    client ? `<link rel="modulepreload" crossorigin href="/assets/${client}">` : '',
  ].join('')
  html = html.replace(/<head([^>]*)>/i, `<head$1><meta charset="UTF-8">${preloads}`)
  if (file.endsWith('404.html')) html = html.replace(/\sdata-server-rendered="true"/g, '')
  writeFileSync(file, html)

  if (file.endsWith('index.html')) {
    const path = '/' + file.slice(DIST.length + 1).replace(/index\.html$/, '').replace(/\/$/, '')
    const noindex = /<meta[^>]+name="robots"[^>]+noindex/i.test(html)
    const alts = [...html.matchAll(/<link[^>]+rel="alternate"[^>]+hreflang="([^"]+)"[^>]+href="([^"]+)"/gi)].map((m) => ({ lang: m[1], href: m[2] }))
    if (!noindex) pages.push({ path: path === '/' ? '/' : path, alts })
  }
}

const today = new Date().toISOString().slice(0, 10)
const urls = pages
  .sort((a, b) => a.path.localeCompare(b.path))
  .map(
    (p) =>
      `  <url>\n    <loc>${SITE}${p.path}</loc>\n    <lastmod>${today}</lastmod>\n${p.alts
        .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${a.href}"/>`)
        .join('\n')}\n  </url>`,
  )
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`,
)
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`)

// Aviso de datos legales pendientes
const legalDir = join(ROOT, 'src/content/legal')
if (existsSync(legalDir)) {
  const pending = readdirSync(legalDir).some((f) => /PENDIENTE/.test(readFileSync(join(legalDir, f), 'utf8')))
  if (pending) console.warn('⚠ postbuild: los textos legales aún tienen datos [PENDIENTE]. Complétalos en src/content/legal antes de publicar.')
}

console.log(`postbuild: ${htmlFiles.length} HTML, ${pages.length} URL en sitemap.xml, 404.html sin hidratación`)
