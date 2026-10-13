// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DOC_PAGES, headingId, resolveDocLink } from './docs.ts';

const read = (file: string) => readFileSync(new URL(`../../docs/${file}.md`, import.meta.url), 'utf8');
const withoutCode = (md: string) => md.replace(/```[\s\S]*?```/g, '');
const headingIds = (md: string) => new Set([...withoutCode(md).matchAll(/^#+ (.+)$/gm)].map(m => headingId(m[1].replace(/`/g, ''))));

test('heading ids match GitHub anchors', () => {
  assert.equal(headingId('Why the URLs have a `#`'.replace(/`/g, '')), 'why-the-urls-have-a-');
  assert.equal(headingId('Tips (`suggestions`)'.replace(/`/g, '')), 'tips-suggestions');
  assert.equal(headingId('Rules for changing the model'), 'rules-for-changing-the-model');
});

test('links go to the right place in the app', () => {
  assert.deepEqual(resolveDocLink('calibration.md'), { kind: 'doc', slug: 'calibration', section: undefined });
  assert.deepEqual(resolveDocLink('README.md'), { kind: 'doc', slug: '', section: undefined });
  assert.deepEqual(resolveDocLink('fermentation-model.md#sugar'), { kind: 'doc', slug: 'fermentation-model', section: 'sugar' });
  assert.deepEqual(resolveDocLink('#flour'), { kind: 'section', section: 'flour' });
  assert.deepEqual(resolveDocLink('../src/App.tsx'), { kind: 'external', href: 'https://github.com/bendfeldt/sourdoughpeakplanner-ff7502f5/blob/main/src/App.tsx' });
  assert.deepEqual(resolveDocLink('https://mermaid.js.org/'), { kind: 'external', href: 'https://mermaid.js.org/' });
});

test('every docs file is in the menu and every link inside the docs works', () => {
  const onDisk = readdirSync(new URL('../../docs/', import.meta.url)).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3)).sort();
  const files = DOC_PAGES.map(p => p.file);
  assert.deepEqual([...files].sort(), onDisk, 'add new docs files to DOC_PAGES in src/lib/docs.ts');

  for (const file of files) {
    const md = read(file);
    for (const [, href] of withoutCode(md).matchAll(/\]\(([^)\s]+)\)/g)) {
      const link = resolveDocLink(href);
      if (link.kind === 'external') continue;
      const target = link.kind === 'section' ? file : DOC_PAGES.find(p => p.slug === link.slug)!.file;
      const section = link.section;
      if (section) assert.ok(headingIds(read(target)).has(section), `${file}.md: "${href}" has no heading "${section}"`);
    }
  }
});
