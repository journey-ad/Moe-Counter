'use strict'

const fs = require('fs')
const path = require('path')
const express = require('express')

const root = path.resolve(__dirname, '..')

async function setupFrontend(app, router, server) {
  if (process.env.NODE_ENV === 'development') {
    const { createServer } = await import('vite')
    const vite = await createServer({
      configFile: path.join(root, 'vite.config.mjs'),
      appType: 'custom',
      server: { middlewareMode: true, hmr: { server } }
    })

    app.locals.frontend = {
      dev: true,
      script: '/assets/app/main.tsx',
      styles: [],
      preloads: []
    }
    router.use(vite.middlewares)
    return vite
  }

  const manifestPath = path.join(root, 'dist/.vite/manifest.json')
  if (!fs.existsSync(manifestPath)) throw new Error('Frontend assets are missing. Run "pnpm build" first.')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const entry = manifest['assets/app/main.tsx']
  const imports = new Set()

  function collectImports(chunk) {
    for (const name of chunk.imports || []) {
      if (imports.has(name)) continue
      imports.add(name)
      collectImports(manifest[name])
    }
  }

  collectImports(entry)
  const chunks = [entry, ...Array.from(imports, name => manifest[name])]
  app.locals.frontend = {
    dev: false,
    script: `/${entry.file}`,
    styles: Array.from(new Set(chunks.flatMap(chunk => chunk.css || [])), file => `/${file}`),
    preloads: Array.from(imports, name => `/${manifest[name].file}`)
  }
  router.use('/assets', express.static(path.join(root, 'dist/assets'), {
    maxAge: '1y',
    immutable: true,
    index: false
  }))
  return null
}

module.exports = { setupFrontend }
