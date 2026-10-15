// Starlight renders Mermaid in the browser, so parse every diagram here to fail the build on a syntax error.
import { glob, readFile } from 'node:fs/promises';
import { Window } from 'happy-dom';

// Mermaid sanitises labels with DOMPurify, which needs a DOM.
Object.assign(globalThis, { window: new Window() });
const { default: mermaid } = await import('mermaid');

const docs = new URL('../src/content/docs/', import.meta.url);
const fence = /^```mermaid[^\n]*\n([\s\S]*?)^```/gm;
let failed = 0;

for await (const file of glob('**/*.{md,mdx}', { cwd: docs })) {
  const text = await readFile(new URL(file, docs), 'utf8');
  for (const match of text.matchAll(fence)) {
    try {
      await mermaid.parse(match[1]);
    } catch (error) {
      failed++;
      const line = text.slice(0, match.index).split('\n').length;
      console.error(`src/content/docs/${file}:${line}: ${(error as Error).message.split('\n')[0]}`);
    }
  }
}

if (failed) {
  process.exit(1);
}
