import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type PluginOption } from 'vite'

/*
  Two targets from one config:
  - Local dev and `bun run build` run the Hono Worker in workerd through the
    Cloudflare plugin (wrangler.jsonc + deploy.json).
  - A Vercel build (`VERCEL=1`) skips the plugin, so Vercel gets a plain static
    `dist/` plus the Node functions in `api/`.
*/
export default defineConfig(async () => {
  const onVercel = Boolean(process.env.VERCEL)
  const plugins: PluginOption[] = [react(), tailwindcss()]

  if (!onVercel) {
    const { cloudflare } = await import('@cloudflare/vite-plugin')
    plugins.push(cloudflare())
  }

  return {
    plugins,
    server: { port: 5173, strictPort: false },
    ...(onVercel ? { build: { outDir: 'dist', sourcemap: false } } : {}),
  }
})
