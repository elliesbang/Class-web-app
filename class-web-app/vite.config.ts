import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../dist', // ✅ dist를 루트로 이동
    emptyOutDir: true, // ✅ 기존 빌드 폴더 정리
  },
})
