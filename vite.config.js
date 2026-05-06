import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ command }) => {
  const isBuild = command === 'build';
  
  return {
    server: {
      port: 3000,
      host: '0.0.0.0'
    },
    base: isBuild ? '/music/' : '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets'
    }
  };
});
