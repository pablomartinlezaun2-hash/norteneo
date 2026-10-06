#!/usr/bin/env node
// Captura de pantalla con Playwright contra el servidor de desarrollo compartido.
// Uso: node scripts/shot.mjs <ruta> <salida.png> [ancho=1440] [alto=900] [--full] [--scroll=PX] [--reduced] [--wait=MS]
// Ejemplo: node scripts/shot.mjs / qa-output/home.png 1440 900 --scroll=1800
import { chromium } from 'playwright'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const [, , route = '/', out = 'qa-output/shot.png', w = '1440', h = '900', ...flags] = process.argv
const base = process.env.BASE_URL ?? 'http://localhost:5174'
const full = flags.includes('--full')
const reduced = flags.includes('--reduced')
const scroll = Number(flags.find((f) => f.startsWith('--scroll='))?.split('=')[1] ?? 0)
const wait = Number(flags.find((f) => f.startsWith('--wait='))?.split('=')[1] ?? 1500)
const exe = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium'].find((p) => existsSync(p))

mkdirSync(dirname(out), { recursive: true })
const browser = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] })
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, reducedMotion: reduced ? 'reduce' : 'no-preference' })
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`))
await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(wait)
if (scroll) {
  // scroll progresivo para disparar ScrollTriggers
  for (let y = 0; y <= scroll; y += 200) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y)
    await page.waitForTimeout(40)
  }
  await page.waitForTimeout(900)
}
await page.screenshot({ path: out, fullPage: full })
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
console.log(JSON.stringify({ out, errors, horizontalOverflow: overflow }))
await browser.close()
