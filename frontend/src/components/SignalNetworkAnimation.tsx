import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import '../styles/signal-network-animation.css';

type Point = readonly [number, number];
type NetworkNode = {
  id: string;
  label: string;
  detail: string;
  activity: string;
  mark: readonly string[];
};

const NODES: readonly NetworkNode[] = [
  { id: 'source', label: 'SOURCE', detail: 'GitHub / Repositories', activity: 'SYNC', mark: ['+---+', '  | /', '  +  '] },
  { id: 'pipeline', label: 'PIPELINE', detail: 'CI/CD / Deployments', activity: 'BUILD', mark: ['     ', '+-=->', '     '] },
  { id: 'infrastructure', label: 'INFRASTRUCTURE', detail: 'Docker / Kubernetes', activity: 'RUN', mark: ['+ + +', '| | |', '+-+-+'] },
  { id: 'observability', label: 'OBSERVABILITY', detail: 'Logs / Metrics / Alerts', activity: 'TRACE', mark: ['. : .', ': | :', '. : .'] },
];

// Both topologies are deterministic. CSS selects the compact one without a
// window-dependent render, keeping the initial markup and layout stable.
const TOPOLOGIES = {
  desktop: {
    width: 600, height: 500, center: [300, 250] as Point,
    anchors: [[116, 125], [484, 125], [116, 375], [484, 375]] as readonly Point[],
    routes: [
      [[116, 143], [116, 174], [216, 232]],
      [[484, 143], [484, 174], [384, 232]],
      [[116, 357], [116, 326], [216, 268]],
      [[484, 357], [484, 326], [384, 268]],
    ] as readonly (readonly Point[])[],
  },
  compact: {
    width: 400, height: 410, center: [200, 205] as Point,
    anchors: [[84, 103], [316, 103], [84, 307], [316, 307]] as readonly Point[],
    routes: [
      [[84, 121], [142, 187]],
      [[316, 121], [258, 187]],
      [[84, 289], [142, 223]],
      [[316, 289], [258, 223]],
    ] as readonly (readonly Point[])[],
  },
};

/** Sample a fixed route into actual text characters, rather than solid wires. */
function routeGlyphs(points: readonly Point[]) {
  return points.slice(1).flatMap((end, segment) => {
    const start = points[segment];
    const count = Math.max(1, Math.round(Math.hypot(end[0] - start[0], end[1] - start[1]) / 9));
    return Array.from({ length: count }, (_, step) => ({
      x: start[0] + (end[0] - start[0]) * step / count,
      y: start[1] + (end[1] - start[1]) * step / count,
      glyph: step === 0 ? '+' : step % 4 === 0 ? ':' : '·',
    }));
  });
}

function haloGlyphs([cx, cy]: Point, compact: boolean) {
  return Array.from({ length: compact ? 28 : 44 }, (_, index) => {
    const angle = index / (compact ? 28 : 44) * Math.PI * 2;
    const perimeter = Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle));
    return {
      x: cx + Math.cos(angle) / perimeter * (compact ? 108 : 140),
      y: cy + Math.sin(angle) / perimeter * (compact ? 66 : 82),
      glyph: index % 11 === 0 ? '+' : index % 3 === 0 ? ':' : '·',
    };
  });
}

function controlPlane([cx, cy]: Point, compact: boolean) {
  const rx = compact ? 88 : 116;
  const ry = compact ? 48 : 58;
  return {
    outline: `${cx},${cy - ry} ${cx + rx},${cy} ${cx},${cy + ry} ${cx - rx},${cy}`,
    edge: `M ${cx - rx} ${cy} v 24 M ${cx} ${cy + ry} v 24 M ${cx + rx} ${cy} v 24`,
    texture: [-38, -28, 32, 42].flatMap((dy, row) => {
      const halfWidth = rx * (1 - Math.abs(dy) / ry) - 10;
      return Array.from({ length: Math.max(0, Math.floor(halfWidth / 9) * 2 + 1) }, (_, index) => ({
        x: cx + (index - Math.floor(halfWidth / 9)) * 9,
        y: cy + dy,
        glyph: (index + row) % 4 === 0 ? ':' : '·',
      })).filter(point => Math.abs(point.x - cx) > 24 || row > 1);
    }),
  };
}

// Geometry is built once at module load. Animation never recalculates glyphs.
const NETWORKS = Object.entries(TOPOLOGIES).map(([name, topology]) => ({
  ...topology,
  name,
  halo: haloGlyphs(topology.center, name === 'compact'),
  plane: controlPlane(topology.center, name === 'compact'),
  connections: topology.routes.map(route => ({
    glyphs: routeGlyphs(route),
    path: `path("M ${route.map(point => point.join(' ')).join(' L ')}")`,
  })),
}));

export function SignalNetworkAnimation() {
  const descriptionId = useId();
  const figureRef = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const figure = figureRef.current;
    if (!figure) return;
    let inView = true;
    const syncVisibility = () => {
      figure.dataset.suspended = String(!inView || document.hidden);
    };
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncVisibility();
    });
    observer?.observe(figure);
    document.addEventListener('visibilitychange', syncVisibility);
    syncVisibility();
    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, []);

  return (
    <figure
      ref={figureRef}
      className="op-network"
      data-paused={paused}
      aria-label="OpsPilot signal network"
      aria-describedby={descriptionId}
    >
      <div className="op-network-layout">
        <div className="op-network-heading" aria-hidden="true">
          <span>OPSPILOT / SIGNAL NETWORK</span>
          <span>04 → 01</span>
        </div>

        <div className="op-network-stage" aria-hidden="true">
          {NETWORKS.map(network => (
            <svg key={network.name} className={`op-network-svg op-network-${network.name}`} viewBox={`0 0 ${network.width} ${network.height}`} focusable="false">
              {network.name === 'desktop' && (
                <g className="op-network-orbit">
                  <ellipse cx="300" cy="250" rx="260" ry="177" />
                  <path d="M 288 73 h 24 M 288 427 h 24 M 40 238 v 24 M 560 238 v 24" />
                  <text x="300" y="57">REPOSITORY → RUNTIME</text>
                </g>
              )}
              <g className="op-network-connections">
                {network.connections.map((connection, index) => (
                  <g key={NODES[index].id}>
                    {connection.glyphs.map((point, step) => <text key={step} className={point.glyph === '+' ? 'op-network-junction' : undefined} x={point.x} y={point.y}>{point.glyph}</text>)}
                  </g>
                ))}
              </g>

              {network.name === 'desktop' && (
                <g className="op-network-ambient">
                  {[[48, 250], [552, 250], [270, 66], [330, 434], [62, 194], [538, 306]].map(([x, y], index) => (
                    <g key={index} style={{ animationDelay: `${index * -3}s` }}>
                      <text x={x} y={y}>+</text>
                      <text x={x + 15} y={y}>·</text>
                    </g>
                  ))}
                  {[110, 390].map(y => <g key={y}><text className="op-network-ambient-dot" x="300" y={y}>·</text><text className="op-network-ambient-colon" x="300" y={y}>:</text></g>)}
                </g>
              )}

              {network.connections.map((connection, index) => (
                <g key={NODES[index].id} className={`op-network-route op-network-route-${index}`} style={{ '--signal-path': connection.path } as CSSProperties}>
                  <g className="op-network-packet op-network-packet-in"><text>+</text><text x="-9" className="op-network-packet-tail">·</text></g>
                  <g className="op-network-packet op-network-packet-out"><text>·</text></g>
                </g>
              ))}

              <g className="op-network-core">
                <g className="op-network-halo">
                  {network.halo.map((point, index) => <text key={index} x={point.x} y={point.y}>{point.glyph}</text>)}
                </g>
                <g className="op-network-structure">
                  <polygon points={network.plane.outline} transform="translate(0 24)" />
                  <polygon points={network.plane.outline} transform="translate(0 12)" />
                  <path d={network.plane.edge} />
                  <polygon className="op-network-surface" points={network.plane.outline} />
                </g>
                <g className="op-network-plane-texture">
                  {network.plane.texture.map((point, index) => <text key={index} x={point.x} y={point.y}>{point.glyph}</text>)}
                </g>
                <text className="op-network-core-title" x={network.center[0]} y={network.center[1] - 4}>[ OPSPILOT ]</text>
                <text className="op-network-core-label" x={network.center[0]} y={network.center[1] + 18}>CONTROL PLANE</text>
                <text className="op-network-core-signal" x={network.center[0]} y={network.center[1] - 34}>· + ·</text>
              </g>

              {NODES.map((node, index) => {
                const [x, y] = network.anchors[index];
                const top = index < 2;
                return (
                  <g key={node.id} className={`op-network-node op-network-node-${index}`}>
                    <path className="op-network-node-bracket" d={`M ${x - 28} ${y - 8} v -12 h 12 M ${x + 28} ${y + 8} v 12 h -12`} />
                    <text className="op-network-node-label" x={x} y={y + (top ? -56 : 42)}>{node.label}</text>
                    <text className="op-network-node-detail" x={x} y={y + (top ? -36 : 62)}>{node.detail}</text>
                    <g className="op-network-node-mark">
                      {node.mark.map((row, line) => <text key={line} x={x} y={y + (line - 1) * 10} xmlSpace="preserve">{row}</text>)}
                    </g>
                    <g className="op-network-node-status">
                      <text className="op-network-status-idle" x={x} y={y + (top ? -79 : 83)}>[ · ] READY</text>
                      <text className="op-network-status-active" x={x} y={y + (top ? -79 : 83)}>[ * ] {node.activity}</text>
                    </g>
                  </g>
                );
              })}
            </svg>
          ))}
        </div>

        <figcaption className="op-network-caption">
          <div><span className="op-network-caption-mark" aria-hidden="true">+ — +</span><p>Every signal. One clear view.</p></div>
          <button type="button" className="op-network-motion" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Resume signal network animation' : 'Pause signal network animation'} aria-pressed={paused}>
            {paused ? 'Resume' : 'Pause'} <span aria-hidden="true">{paused ? '>' : 'Ⅱ'}</span>
          </button>
        </figcaption>
      </div>
      <span id={descriptionId} className="op-network-description">Source: GitHub and repositories. Pipeline: CI/CD and deployments. Infrastructure: Docker and Kubernetes. Observability: logs, metrics, and alerts. All four connect to the central OpsPilot control plane, with signals flowing inward and acknowledgements flowing back.</span>
    </figure>
  );
}
