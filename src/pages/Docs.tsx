import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppMenu } from '@/components/AppMenu';
import { MermaidDiagram } from '@/components/MermaidDiagram';
import { DOC_PAGES, headingId, loadDoc, resolveDocLink } from '@/lib/docs';
import { useI18n } from '@/lib/i18n';
import NotFound from './NotFound';

// Plain text of a Markdown node, for heading ids.
type TextNode = { value?: string; children?: TextNode[] };
const textOf = (node?: TextNode): string => node?.value ?? (node?.children ?? []).map(textOf).join('');

function heading(Tag: 'h1' | 'h2' | 'h3' | 'h4'): Components['h1'] {
  return ({ node, children }) => <Tag id={headingId(textOf(node))} className="scroll-mt-20">{children}</Tag>;
}

function DocLinkTo({ href = '', children }: { href?: string; children: ReactNode }) {
  const [, setSearchParams] = useSearchParams();
  const target = resolveDocLink(href);
  if (target.kind === 'external') {
    return <a href={target.href} target="_blank" rel="noreferrer">{children}</a>;
  }
  if (target.kind === 'section') {
    // "#section" can't be a real link: with HashRouter the "#" holds the route.
    return (
      <a
        href={`#${target.section}`}
        onClick={e => { e.preventDefault(); setSearchParams({ section: target.section }); }}
      >
        {children}
      </a>
    );
  }
  const to = `/docs/${target.slug}` + (target.section ? `?section=${target.section}` : '');
  return <Link to={to}>{children}</Link>;
}

const components: Components = {
  h1: heading('h1'),
  h2: heading('h2'),
  h3: heading('h3'),
  h4: heading('h4'),
  a: ({ href, children }) => <DocLinkTo href={href}>{children}</DocLinkTo>,
  table: ({ children }) => <div className="overflow-x-auto"><table>{children}</table></div>,
  pre: ({ node, children }) => {
    const code = node?.children[0] as { properties?: { className?: string[] } } | undefined;
    // Mermaid blocks are drawn by MermaidDiagram (see `code`), not shown as code.
    return code?.properties?.className?.includes('language-mermaid') ? <>{children}</> : <pre>{children}</pre>;
  },
  code: ({ className, children }) =>
    className === 'language-mermaid'
      ? <MermaidDiagram chart={String(children).trim()} />
      : <code className={className}>{children}</code>,
};

export default function Docs() {
  const { t } = useI18n();
  const { page = '' } = useParams();
  const [searchParams] = useSearchParams();
  const section = searchParams.get('section');
  // Text of the last loaded page; while another page loads, `markdown` is undefined
  const [loaded, setLoaded] = useState<{ page: string; markdown: string | null } | null>(null);
  const markdown = loaded?.page === page ? loaded.markdown : undefined;

  useEffect(() => {
    let cancelled = false;
    loadDoc(page).then(md => !cancelled && setLoaded({ page, markdown: md }));
    return () => { cancelled = true; };
  }, [page]);

  useEffect(() => {
    if (!markdown) return;
    const el = section ? document.getElementById(section) : null;
    if (!el) {
      window.scrollTo(0, 0);
      return;
    }
    const scroll = () => el.scrollIntoView();
    scroll();
    // Diagrams draw after the text and push the section down: keep it in place while they
    // do, until the reader scrolls themselves.
    const observer = new ResizeObserver(scroll);
    const stop = () => observer.disconnect();
    observer.observe(el.closest('article') ?? document.body);
    const timer = setTimeout(stop, 4000);
    const events = ['wheel', 'touchstart', 'keydown'] as const;
    events.forEach(e => window.addEventListener(e, stop, { once: true }));
    return () => {
      stop();
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, stop));
    };
  }, [markdown, section]);

  if (markdown === null) return <NotFound />;

  const current = DOC_PAGES.find(p => p.slug === page);

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="container flex items-center gap-2 px-4 py-2">
          <AppMenu />
          <span className="text-sm text-muted-foreground truncate">Docs / {current?.title}</span>
          <Link to="/" className="ml-auto">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t('backToCalculator')}
            </Button>
          </Link>
        </div>
      </header>
      <article className="container px-4 py-8 prose prose-neutral dark:prose-invert max-w-3xl prose-headings:font-display prose-table:text-sm prose-th:text-left prose-code:before:content-none prose-code:after:content-none">
        {markdown === undefined
          ? <div className="h-40 animate-pulse rounded-md bg-muted" aria-label={t('loading')} />
          : <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{markdown}</ReactMarkdown>}
      </article>
    </main>
  );
}
