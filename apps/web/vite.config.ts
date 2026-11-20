import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

// ANALYZE=1 gera stats.json (análise do bundle); fora disso o build não muda.
const analyze = process.env.ANALYZE === '1';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/fiscotrack/' : '/',
  plugins: [
    react(),
    ...(analyze
      ? [visualizer({ filename: 'stats.json', template: 'raw-data', gzipSize: true })]
      : []),
  ],
}));
