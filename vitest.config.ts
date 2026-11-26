import { defineConfig, mergeConfig } from 'vitest/config'
import path from 'path'
import viteConfig from './vite.config'

// Vite's root is examples/ (the dev app); tests live beside the code they test across the whole repo.
export default mergeConfig(viteConfig, defineConfig({
  // The R3F packages ship CommonJS as `main` and ESM as `module`, with no `exports` map. Resolved by `main` (the SSR
  // default the tests run under), they load three's CommonJS build beside the tests' ESM build: two copies of three,
  // and `instanceof` across them fails.
  ssr: { resolve: { mainFields: ['module', 'main'] } },
  test: {
    root: path.resolve(__dirname),
    include: ['src/**/*.test.{ts,tsx}', 'examples/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
}))
