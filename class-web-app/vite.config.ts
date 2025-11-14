build: {
  outDir: 'dist',   // ← ★ 이게 가장 중요함
  emptyOutDir: true,

  rollupOptions: {
    output: {
      entryFileNames: `assets/[name].[hash].js`,
      chunkFileNames: `assets/[name].[hash].js`,
      assetFileNames: `assets/[name].[hash].[ext]`,
    },
  },
},