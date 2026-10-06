import { defineConfig, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { ViteReactSSGOptions } from 'vite-react-ssg'
import { fileURLToPath, URL } from 'node:url'

const config: UserConfig & { ssgOptions: Partial<ViteReactSSGOptions> } = {
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5174 },
  ssgOptions: {
    dirStyle: 'nested',
    formatting: 'none',
    beastiesOptions: { preload: 'media', pruneSource: false, preloadFonts: false },
    // Antes del CSS crítico: el <html> se marca como en el navegador (clases js / intro-seen que pone el
    // script inline) para que beasties conserve esas reglas. scripts/postbuild.mjs retira la marca.
    onPageRendered: (_route: string, html: string) => html.replace(/<html([^>]*)>/i, '<html$1 class="js intro-seen">'),
  },
}

export default defineConfig(config)
