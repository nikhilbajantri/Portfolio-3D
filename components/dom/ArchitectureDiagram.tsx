import type { ArchitectureEdge, ArchitectureNode, CaseStudy } from '@/content/data';

const NODE_W = 200;
const NODE_H = 52;
const GAP_MAIN = 96;   // between depth levels (room for edge labels)
const GAP_CROSS = 28;  // between siblings in one level
const PAD = 24;

interface Placed extends ArchitectureNode {
  x: number;
  y: number;
}

/** Depth = first-seen BFS distance from the sources (back edges don't move nodes). */
function levels(nodes: readonly ArchitectureNode[], edges: readonly ArchitectureEdge[]): Map<string, number> {
  const incoming = new Set(edges.map((e) => e.to));
  const sources = nodes.filter((n) => !incoming.has(n.id)).map((n) => n.id);
  const depth = new Map<string, number>();
  const queue = sources.length ? [...sources] : nodes[0] ? [nodes[0].id] : [];
  queue.forEach((id) => depth.set(id, 0));
  while (queue.length) {
    const id = queue.shift()!;
    for (const e of edges) {
      if (e.from === id && !depth.has(e.to)) {
        depth.set(e.to, depth.get(id)! + 1);
        queue.push(e.to);
      }
    }
  }
  nodes.forEach((n) => {
    if (!depth.has(n.id)) depth.set(n.id, 0);
  });
  return depth;
}

function layout(arch: CaseStudy['architecture'], vertical: boolean) {
  const depth = levels(arch.nodes, arch.edges);
  const columns: ArchitectureNode[][] = [];
  arch.nodes.forEach((n) => (columns[depth.get(n.id)!] ??= []).push(n));
  const maxRows = Math.max(...columns.map((c) => c.length));
  const crossSize = (n: number): number => n * (vertical ? NODE_W : NODE_H) + (n - 1) * GAP_CROSS;
  const crossTotal = crossSize(maxRows);

  const placed = new Map<string, Placed>();
  columns.forEach((col, d) => {
    const offset = (crossTotal - crossSize(col.length)) / 2;
    col.forEach((n, i) => {
      const main = PAD + d * ((vertical ? NODE_H : NODE_W) + GAP_MAIN);
      const cross = PAD + offset + i * ((vertical ? NODE_W : NODE_H) + GAP_CROSS);
      placed.set(n.id, { ...n, x: vertical ? cross : main, y: vertical ? main : cross });
    });
  });
  const mainTotal = columns.length * (vertical ? NODE_H : NODE_W) + (columns.length - 1) * GAP_MAIN;
  const width = PAD * 2 + (vertical ? crossTotal : mainTotal);
  const height = PAD * 2 + (vertical ? mainTotal : crossTotal);
  return { placed, depth, width, height };
}

function edgePath(a: Placed, b: Placed, vertical: boolean, back: boolean): { d: string; lx: number; ly: number } {
  if (vertical) {
    const x1 = a.x + NODE_W / 2;
    const x2 = b.x + NODE_W / 2;
    if (back) {
      // Return edges loop out to the right of both nodes.
      const r = Math.max(a.x, b.x) + NODE_W + 40;
      const y1 = a.y + NODE_H / 2;
      const y2 = b.y + NODE_H / 2;
      return { d: `M ${a.x + NODE_W} ${y1} C ${r} ${y1}, ${r} ${y2}, ${b.x + NODE_W} ${y2}`, lx: r - 6, ly: (y1 + y2) / 2 };
    }
    const y1 = a.y + NODE_H;
    const y2 = b.y;
    const my = (y1 + y2) / 2;
    return { d: `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`, lx: (x1 + x2) / 2 + 8, ly: my };
  }
  if (back) {
    // Return edges arc underneath both nodes.
    const bottom = Math.max(a.y, b.y) + NODE_H + 40;
    const x1 = a.x + NODE_W / 2;
    const x2 = b.x + NODE_W / 2;
    return { d: `M ${x1} ${a.y + NODE_H} C ${x1} ${bottom}, ${x2} ${bottom}, ${x2} ${b.y + NODE_H}`, lx: (x1 + x2) / 2, ly: bottom - 4 };
  }
  const x1 = a.x + NODE_W;
  const x2 = b.x;
  const y1 = a.y + NODE_H / 2;
  const y2 = b.y + NODE_H / 2;
  const mx = (x1 + x2) / 2;
  return { d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`, lx: mx, ly: Math.min(y1, y2) - 8 };
}

function Diagram({ arch, id, vertical, title }: { arch: CaseStudy['architecture']; id: string; vertical: boolean; title?: string }) {
  const { placed, depth, width, height } = layout(arch, vertical);
  const marker = `${id}-arrow`;
  const extra = arch.edges.some((e) => depth.get(e.to)! <= depth.get(e.from)!) ? 48 : 0;
  const label = (nodeId: string): string => placed.get(nodeId)?.label ?? nodeId;

  return (
    <svg
      viewBox={`0 0 ${width + (vertical ? extra : 0)} ${height + (vertical ? 0 : extra)}`}
      className="h-auto w-full"
      role={title ? 'img' : undefined}
      aria-labelledby={title ? `${id}-title ${id}-desc` : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? (
        <>
          <title id={`${id}-title`}>{title}</title>
          <desc id={`${id}-desc`}>
            {arch.edges.map((e) => `${label(e.from)} to ${label(e.to)}${e.label ? ` (${e.label})` : ''}`).join('; ')}
          </desc>
        </>
      ) : null}
      <defs>
        <marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" className="fill-signal" />
        </marker>
      </defs>
      {arch.edges.map((e) => {
        const a = placed.get(e.from);
        const b = placed.get(e.to);
        if (!a || !b) return null;
        const back = depth.get(e.to)! <= depth.get(e.from)!;
        const { d, lx, ly } = edgePath(a, b, vertical, back);
        return (
          <g key={`${e.from}-${e.to}`}>
            <path d={d} className="fill-none stroke-signal" strokeWidth={1.5} markerEnd={`url(#${marker})`} opacity={0.85} />
            {e.label ? (
              <text
                x={lx}
                y={ly}
                textAnchor={vertical && !back ? 'start' : 'middle'}
                className="fill-text-muted font-mono uppercase"
                fontSize={11}
                letterSpacing="0.12em"
              >
                {e.label}
              </text>
            ) : null}
          </g>
        );
      })}
      {[...placed.values()].map((n) => (
        <g key={n.id}>
          <rect x={n.x} y={n.y} width={NODE_W} height={NODE_H} rx={8} className="fill-surface-2 stroke-border" strokeWidth={1} />
          <text
            x={n.x + NODE_W / 2}
            y={n.y + NODE_H / 2}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-text font-sans"
            fontSize={14}
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/**
 * Architecture flow from data.ts, laid out by graph depth: left → right on wide
 * screens, top → bottom on phones. Only the visible variant is exposed to
 * assistive tech; its <desc> lists every connection.
 */
export function ArchitectureDiagram({ arch, id, title }: { arch: CaseStudy['architecture']; id: string; title: string }) {
  return (
    <figure className="rounded-card border border-border bg-bg/60 p-4 md:p-6">
      <div className="hidden md:block">
        <Diagram arch={arch} id={`${id}-h`} vertical={false} title={title} />
      </div>
      <div className="mx-auto max-w-sm md:hidden">
        <Diagram arch={arch} id={`${id}-v`} vertical title={title} />
      </div>
    </figure>
  );
}
