// The Markdown files in /docs, shown inside the app at /#/docs/<slug>.

/** Menu order and titles. Add a row here when you add a file to /docs. */
export const DOC_PAGES = [
  { slug: '', file: 'README', title: 'Overview' },
  { slug: 'architecture', file: 'architecture', title: 'Architecture' },
  { slug: 'fermentation-model', file: 'fermentation-model', title: 'Fermentation model' },
  { slug: 'calculation-modes', file: 'calculation-modes', title: 'Calculation modes' },
  { slug: 'calibration', file: 'calibration', title: 'Calibration' },
  { slug: 'data-storage', file: 'data-storage', title: 'Data and storage' },
  { slug: 'development', file: 'development', title: 'Development' },
  { slug: 'deployment', file: 'deployment', title: 'Deployment' },
  { slug: 'glossary', file: 'glossary', title: 'Glossary' },
] as const;

/** Markdown for a docs page, or null if there is no such page. */
export async function loadDoc(slug: string): Promise<string | null> {
  // Vite turns this into one small chunk per file, loaded when the page opens.
  // (Inside the function so plain Node can import this module in tests.)
  const loaders = import.meta.glob('../../docs/*.md', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;
  const page = DOC_PAGES.find(p => p.slug === slug);
  const load = page && loaders[`../../docs/${page.file}.md`];
  return load ? load() : null;
}

const REPO_FILES = 'https://github.com/bendfeldt/sourdoughpeakplanner-ff7502f5/blob/main/docs/';

export type DocLink =
  | { kind: 'external'; href: string }
  | { kind: 'doc'; slug: string; section?: string }
  | { kind: 'section'; section: string };

/**
 * Where a link written in the Markdown should go inside the app.
 * - `calibration.md#why` → another docs page (and section)
 * - `#why`               → a section on this page
 * - `../src/App.tsx`     → the file on GitHub
 */
export function resolveDocLink(href: string): DocLink {
  if (/^[a-z]+:/i.test(href)) return { kind: 'external', href };
  if (href.startsWith('#')) return { kind: 'section', section: href.slice(1) };

  const [path, section] = href.split('#');
  const doc = /^([\w-]+)\.md$/.exec(path);
  if (doc) {
    const slug = doc[1] === 'README' ? '' : doc[1];
    if (DOC_PAGES.some(p => p.slug === slug)) return { kind: 'doc', slug, section };
  }
  return { kind: 'external', href: new URL(href, REPO_FILES).href };
}

/** Heading id, matching GitHub's anchors so links like `#sugar` keep working. */
export function headingId(text: string): string {
  return text.trim().toLowerCase().replace(/[^\p{L}\p{N}_\- ]/gu, '').replace(/ /g, '-');
}
