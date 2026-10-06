import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  publicDir: false,
  plugins: [preact()],
  build: {
    manifest: true,
    rolldownOptions: {
      input: fileURLToPath(new URL('./assets/app/main.tsx', import.meta.url))
    }
  }
})
