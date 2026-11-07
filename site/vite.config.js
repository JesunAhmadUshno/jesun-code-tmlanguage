import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// The site imports ../grammars/jesun-code.tmLanguage.json at build time, so every number on the page is generated, never typed.
export default defineConfig({
  base: '/jesun-code-tmlanguage/',
  plugins: [react()],
  server: { fs: { allow: ['..'] } },
});
