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
  },
}

export default defineConfig(config)
