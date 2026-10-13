import { useEffect, useId, useRef, useState } from 'react';

/** Draws a Mermaid diagram. Mermaid is large, so it is only loaded on pages that have one. */
export function MermaidDiagram({ chart }: { chart: string }) {
  const id = 'mermaid-' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    import('mermaid')
      .then(async ({ default: mermaid }) => {
        const dark = document.documentElement.classList.contains('dark');
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: dark ? 'dark' : 'default' });
        const result = await mermaid.render(id, chart);
        if (!cancelled) setSvg(result.svg);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => { cancelled = true; };
  }, [chart, id]);

  // Wide diagrams would shrink to unreadable text on a phone; scroll them sideways instead.
  useEffect(() => {
    const svgEl = box.current?.querySelector('svg');
    const width = svgEl?.viewBox.baseVal?.width;
    if (svgEl && width) svgEl.style.minWidth = `${Math.min(width, 640)}px`;
  }, [svg]);

  // If drawing fails, show the diagram's text, which is still readable.
  if (failed) return <pre className="text-xs">{chart}</pre>;
  if (!svg) return <div className="h-24 animate-pulse rounded-md bg-muted" aria-label="Loading diagram" />;
  return <div ref={box} className="not-prose my-6 overflow-x-auto [&_svg]:mx-auto" dangerouslySetInnerHTML={{ __html: svg }} />;
}
