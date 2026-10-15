// @ts-check
import { existsSync, readdirSync } from 'node:fs';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import mermaid from 'astro-mermaid';
import starlightLinksValidator from 'starlight-links-validator';

const groups = [
  ['Introduction', 'introduction'],
  ['Concepts', 'concepts'],
  ['Getting started', 'getting-started'],
  ['Strategies', 'strategies'],
  ['Configuration', 'configuration'],
  ['Reference', 'reference'],
];

// Starlight renders an empty heading for a group with no pages, so later pages only need adding as files.
/** @param {string} dir */
const hasPages = (dir) => {
  const path = new URL(`./src/content/docs/${dir}/`, import.meta.url);
  return existsSync(path) && readdirSync(path).some((f) => /\.mdx?$/.test(f));
};

const sidebar = groups
  .filter(([, dir]) => hasPages(dir))
  .map(([label, directory]) => ({ label, items: [{ autogenerate: { directory } }] }));

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
      sidebar,
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
