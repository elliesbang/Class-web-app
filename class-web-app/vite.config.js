import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      recharts: path.resolve(__dirname, 'src/lib/recharts.tsx'),
    },
  },
  build: {
    outDir: 'dist', 
  },
});
