// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { localRuntimePlugin } from "./scripts/local-runtime.mjs";

export default defineConfig({
  vite: {
    // Builds and test runners can clear Vite's default cache while npm start is
    // serving it. Keep local browser dependencies in their own cache directory.
    ...(process.env['LOCAL_RUNTIME'] === "true" ? { cacheDir: "node_modules/.vite-local-runtime" } : {}),
    plugins: process.env['LOCAL_RUNTIME'] === "true" ? [localRuntimePlugin()] : [],
    define: { "import.meta.env.VITE_LOCAL_RUNTIME": JSON.stringify(process.env['LOCAL_RUNTIME'] === "true" || process.env['MYSQL_RUNTIME'] === "true" ? "true" : "false") },
  },
  ...(process.env['MYSQL_RUNTIME'] === "true" ? { nitro: { preset: "node-middleware", output: { dir: ".output-hosting", serverDir: ".output-hosting/server", publicDir: ".output-hosting/public" } } } : {}),
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
