import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// Minimum runtime: iOS 12 / Safari 12 / Chrome 64 / Firefox 67 / Edge 79
const targets = ['chrome64', 'edge79', 'firefox67', 'safari12', 'ios12']

// Lightning CSS takes the same browsers as a major/minor bitfield
const cssTargets = Object.fromEntries(
  targets.map((target) => {
    const [, browser, version] = target.match(/^([a-z]+)([\d.]+)$/)
    const [major, minor = 0] = version.split('.').map(Number)
    return [browser, (major << 16) | (minor << 8)]
  })
)

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  publicDir: false,
  plugins: [preact()],
  css: {
    transformer: 'lightningcss',
    lightningcss: { targets: cssTargets }
  },
  build: {
    target: targets,
    cssTarget: targets,
    manifest: true,
    rolldownOptions: {
      input: fileURLToPath(new URL('./assets/app/main.tsx', import.meta.url))
    }
  }
})
