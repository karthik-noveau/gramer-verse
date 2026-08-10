import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/* Absolute imports are resolved from `src` in three places and they must agree:
   `baseUrl` in tsconfig.json, `moduleDirectories` in jest.config.cjs, and here.
   Two of the three agreeing is the failure that surfaces months later, so the
   top-level folders of src/ are listed once and matched as a group. */
const SRC = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^(assets|common|content|pages|store|theme)\//, replacement: `${SRC}/$1/` },
      { find: /^App$/, replacement: `${SRC}/App.tsx` },
    ],
  },
});
