import { fileURLToPath } from 'node:url';
import { defineEcConfig } from '@astrojs/starlight/expressive-code';
import ecTwoSlash from 'expressive-code-twoslash';

export default defineEcConfig({
  plugins: [
    ecTwoSlash({
      twoslashOptions: {
        compilerOptions: {
          // Check snippets against this branch's source rather than a possibly stale dist build.
          paths: { arocapi: [fileURLToPath(new URL('../src/app.ts', import.meta.url))] },
        },
      },
    }),
  ],
});
