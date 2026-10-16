// @ts-check
import { fileURLToPath } from 'node:url';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import mermaid from 'astro-mermaid';
import starlightLinksValidator from 'starlight-links-validator';

export default defineConfig({
  site: 'https://arocapi.crate-works.org',
  integrations: [
    // Must precede starlight, otherwise Expressive Code claims the mermaid fences.
    mermaid({ autoTheme: true }),
    starlight({
      title: 'arocapi',
      description: 'An RO-Crate API for Fastify, part of CrateWorks.',
      logo: { light: './src/assets/logo-light.svg', dark: './src/assets/logo-dark.svg' },
      favicon: '/favicon.svg',
      head: [{ tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } }],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/crate-works/arocapi' }],
      editLink: { baseUrl: 'https://github.com/crate-works/arocapi/edit/main/website/' },
      customCss: ['./src/styles/global.css'],
      components: {
        Banner: './src/components/Banner.astro',
        Footer: './src/components/Footer.astro',
        SocialIcons: './src/components/SocialIcons.astro',
      },
      plugins: [starlightLinksValidator()],
      sidebar: [
        { label: 'Introduction', items: [{ autogenerate: { directory: 'introduction' } }] },
        { label: 'Concepts', items: [{ autogenerate: { directory: 'concepts' } }] },
        { label: 'Getting started', items: [{ autogenerate: { directory: 'getting-started' } }] },
        { label: 'Strategies', items: [{ autogenerate: { directory: 'strategies' } }] },
        { label: 'Configuration', items: [{ autogenerate: { directory: 'configuration' } }] },
        { label: 'Reference', items: [{ autogenerate: { directory: 'reference' } }] },
      ],
    }),
  ],
  vite: { resolve: { alias: { '@examples': fileURLToPath(new URL('./examples', import.meta.url)) } } },
});
