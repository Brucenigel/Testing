import esbuild from 'rollup-plugin-esbuild';
import { defineConfig } from 'rollup';

export default defineConfig([
  {
    input: 'src/bot.ts',
    output: {
      dir: 'dist/lib/',
      format: 'esm',
      inlineDynamicImports: false,
    },
    plugins: [esbuild({ include: 'src/*.ts' })],
  },
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist/',
      format: 'esm',
      inlineDynamicImports: false,
    },
    plugins: [esbuild()],
  },
  {
    input: ['api/github/webhooks/index.ts'],
    output: {
      dir: 'dist/api/github/webhooks',
      format: 'esm',
    },
    plugins: [esbuild()],
  },
]);
