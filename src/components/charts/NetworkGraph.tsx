import { useMemo, useState } from 'react';

interface Node { id: string; label: string; weight: number }
interface Link { source: string; target: string; lift: number }

/**
 * Product-relationship network (Steps 17–18).
 * Deterministic radial layout — no physics engine needed at this scale.
 */
export function NetworkGraph({ nodes, links, height = 330 }: { nodes: Node[]; links: Link[]; height?: number }) {
  const [active, setActive] = useState<string | null>(null);
  const R = 120;
  const cx = 175;
  const cy = height / 2;

  const positions = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    const n = Math.max(1, nodes.length);
    nodes.forEach((node, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      m.set(node.id, { x: cx + Math.cos(angle) * R, y: cy + Math.sin(angle) * R });
    });
    return m;
  }, [nodes, height]);

  const maxLift = Math.max(1, ...links.map((l) => l.lift));
  const nodeR = (w: number) => 7 + Math.min(9, w * 40);

  return (
    <svg viewBox={`0 0 350 ${height}`} width="100%" height={height} role="img" aria-label="Frequently purchased together network">
      {links.map((l, i) => {
        const a = positions.get(l.source);
        const b = positions.get(l.target);
        if (!a || !b) return null;
        const isActive = active === l.source || active === l.target;
        const mx = (a.x + b.x) / 2 + (cy - (a.y + b.y) / 2) * 0.18;
        const my = (a.y + b.y) / 2 + (cx - (a.x + b.x) / 2) * 0.18;
        return (
          <path
            key={i}
            d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
            fill="none"
            stroke={isActive ? 'var(--accent)' : 'var(--border-strong)'}
            strokeWidth={isActive ? 2.4 : 0.6 + (l.lift / maxLift) * 1.8}
            strokeOpacity={active ? (isActive ? 1 : 0.18) : 0.75}
          />
        );
      })}
      {nodes.map((n) => {
        const p = positions.get(n.id)!;
        const isActive = active === n.id;
        return (
          <g key={n.id} transform={`translate(${p.x} ${p.y})`} onMouseEnter={() => setActive(n.id)} onMouseLeave={() => setActive(null)} style={{ cursor: 'pointer' }}>
            <circle r={nodeR(n.weight)} fill="var(--surface-3)" stroke={isActive ? 'var(--accent)' : 'var(--border-strong)'} strokeWidth={isActive ? 2 : 1} />
            <circle r={nodeR(n.weight) * 0.45} fill="var(--accent)" opacity={isActive ? 1 : 0.7} />
            <text
              y={-nodeR(n.weight) - 7} textAnchor="middle"
              fontSize={10.5} fontWeight={600} fill="var(--text-2)"
              style={{ pointerEvents: 'none' }}
            >
              {n.label.length > 17 ? `${n.label.slice(0, 16)}…` : n.label}
            </text>
          </g>
        );
      })}
      <text x={cx} y={cy} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text-3)">BASKETS</text>
      <text x={cx} y={cy + 15} textAnchor="middle" fontSize={9} fill="var(--text-3)">hover a node</text>
    </svg>
  );
}
