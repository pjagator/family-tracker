import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// One id per build: timestamp plus the commit when Vercel provides it.
const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)
const sha = (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7)
const buildId = sha ? `${stamp}-${sha}` : stamp

// Stamps the build id into the service worker and writes version.json, which
// the running app polls to notice a new deploy.
function buildStamp() {
  return {
    name: 'build-stamp',
    apply: 'build',
    closeBundle() {
      const outDir = resolve(process.cwd(), 'dist')
      const swPath = resolve(outDir, 'sw.js')
      if (existsSync(swPath)) {
        writeFileSync(swPath, readFileSync(swPath, 'utf8').replaceAll('__BUILD_ID__', buildId))
      }
      writeFileSync(resolve(outDir, 'version.json'), JSON.stringify({ build: buildId }) + '\n')
    },
  }
}

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss(), buildStamp()],
  define: {
    __BUILD_ID__: JSON.stringify(command === 'build' ? buildId : 'dev'),
  },
}))
