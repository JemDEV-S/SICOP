// charts.jsx — custom SVG charts (no library)

// Shared bits
const C = {
  fg: 'var(--fg)',
  muted: 'var(--fg-muted)',
  dim: 'var(--fg-dim)',
  grid: 'var(--border)',
  bg: 'var(--bg-elev-2)',
  accent: 'var(--accent)',
  ok: 'var(--ok)',
  warn: 'var(--warn)',
  danger: 'var(--danger)',
};

function ChartTooltip({ x, y, lines, visible }) {
  if (!visible) return null;
  return (
    <foreignObject x={x} y={y} width={220} height={90} style={{pointerEvents:'none', overflow:'visible'}}>
      <div style={{
        background: 'var(--bg-elev-2)', border: '1px solid var(--border-strong)',
        borderRadius: 6, padding: '7px 10px', fontSize: 11.5, color: 'var(--fg)',
        fontFamily: 'var(--font-sans)',
        boxShadow: 'var(--shadow-md)', whiteSpace: 'nowrap',
      }}>
        {lines.map((l, i) => (
          <div key={i} style={{display:'flex', justifyContent:'space-between', gap:14, lineHeight:1.5}}>
            <span style={{color: i === 0 ? 'var(--fg)' : 'var(--fg-muted)', fontWeight: i === 0 ? 600 : 400}}>{l[0]}</span>
            {l[1] !== undefined && <span className="num" style={{color:'var(--fg)'}}>{l[1]}</span>}
          </div>
        ))}
      </div>
    </foreignObject>
  );
}

// ============== BAR PAIR — PIM vs Devengado por categoría ==============
function BarPairChart({ data, w = 600, h = 320, onSelect }) {
  // data: [{label, pim, dev}]
  const pad = { l: 160, r: 60, t: 12, b: 22 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = Math.max(1, ...data.flatMap(d => [d.pim, d.dev]));
  const rowH = innerH / Math.max(1, data.length);
  const barH = Math.max(6, Math.min(16, rowH / 2 - 2));
  const [hover, setHover] = React.useState(null);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{display:'block', overflow:'visible'}}>
      {/* axis ticks */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const x = pad.l + t * innerW;
        const val = max * t;
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={pad.t} y2={pad.t + innerH} stroke={C.grid} strokeDasharray={i === 0 ? '0' : '2 3'} />
            <text x={x} y={h - 6} fontSize="9.5" fill={C.dim} textAnchor="middle" fontFamily="var(--font-mono)">
              {val >= 1e6 ? (val/1e6).toFixed(1)+'M' : val >= 1e3 ? (val/1e3).toFixed(0)+'K' : Math.round(val)}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const y = pad.t + i * rowH + (rowH - barH * 2 - 2) / 2;
        const wPim = (d.pim / max) * innerW;
        const wDev = (d.dev / max) * innerW;
        return (
          <g key={i}
             onMouseEnter={() => setHover(i)}
             onMouseLeave={() => setHover(null)}
             onClick={() => onSelect && onSelect(d)}
             style={{cursor: onSelect ? 'pointer' : 'default'}}>
            <rect x={0} y={y - 2} width={w} height={barH * 2 + 6} fill="transparent" />
            <text x={pad.l - 8} y={y + barH + 4} fontSize="10.5" fill={C.fg} textAnchor="end">
              {d.label.length > 24 ? d.label.slice(0, 24) + '…' : d.label}
            </text>
            <rect x={pad.l} y={y} width={wPim} height={barH} fill={C.accent} opacity="0.45" rx="1.5" />
            <rect x={pad.l} y={y + barH + 2} width={wDev} height={barH} fill={C.accent} rx="1.5" />
          </g>
        );
      })}

      {hover !== null && (
        <ChartTooltip x={Math.min(w - 220, pad.l + 20)} y={pad.t + hover * rowH - 10} visible={true} lines={[
          [data[hover].label],
          ['PIM', 'S/ ' + Math.round(data[hover].pim).toLocaleString('es-PE')],
          ['Devengado', 'S/ ' + Math.round(data[hover].dev).toLocaleString('es-PE')],
          ['Avance', ((data[hover].dev/data[hover].pim)*100).toFixed(1) + '%'],
        ]} />
      )}
    </svg>
  );
}

// ============== STACKED HORIZONTAL: avance % ==============
function AvanceChart({ data, w = 600, h = 320, onSelect }) {
  // data: [{label, pim, dev}]
  const sorted = [...data].sort((a, b) => (b.dev/b.pim) - (a.dev/a.pim));
  const pad = { l: 200, r: 60, t: 8, b: 8 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const rowH = innerH / Math.max(1, sorted.length);
  const barH = Math.max(8, Math.min(18, rowH - 6));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{display:'block'}}>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const x = pad.l + t * innerW;
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={pad.t} y2={pad.t + innerH} stroke={C.grid} strokeDasharray={i === 0 || i === 4 ? '0' : '2 3'} />
            <text x={x} y={pad.t + innerH + 14} fontSize="9.5" fill={C.dim} textAnchor="middle" fontFamily="var(--font-mono)">{(t*100).toFixed(0)}%</text>
          </g>
        );
      })}
      {sorted.map((d, i) => {
        const av = (d.dev / d.pim) * 100 || 0;
        const y = pad.t + i * rowH + (rowH - barH) / 2;
        const cls = av > 100 ? 'over' : av > 70 ? 'high' : av > 30 ? 'mid' : 'low';
        const color = { high: C.ok, mid: C.warn, low: C.danger, over: '#8c5fd1' }[cls];
        const barW = Math.min(1, av/100) * innerW;
        return (
          <g key={i} onClick={() => onSelect && onSelect(d)} style={{cursor: onSelect ? 'pointer' : 'default'}}>
            <text x={pad.l - 8} y={y + barH/2 + 3} fontSize="10.5" fill={C.fg} textAnchor="end">
              {d.label.length > 30 ? d.label.slice(0, 30) + '…' : d.label}
            </text>
            <rect x={pad.l} y={y} width={innerW} height={barH} fill={C.grid} opacity="0.6" rx="2" />
            <rect x={pad.l} y={y} width={barW} height={barH} fill={color} rx="2" />
            <text x={pad.l + barW + 6} y={y + barH/2 + 3} fontSize="10" fill={C.fg} fontFamily="var(--font-mono)">
              {av.toFixed(1)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============== DONUT — distribución por categoría ==============
function DonutChart({ data, w = 280, h = 280, onSelect }) {
  // data: [{label, value, color?}]
  const total = data.reduce((a, d) => a + d.value, 0);
  const cx = w / 2, cy = h / 2;
  const rOuter = Math.min(w, h) / 2 - 8;
  const rInner = rOuter * 0.62;
  const palette = [C.accent, '#52c2a8', '#e6a23c', '#e85b5b', '#8c5fd1', '#5d9fdf', '#52a673'];

  const [hover, setHover] = React.useState(null);

  let acc = 0;
  const arcs = data.map((d, i) => {
    const a0 = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += d.value;
    const a1 = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const large = (a1 - a0) > Math.PI ? 1 : 0;
    const p = (a, r) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    const [x0, y0] = p(a0, rOuter);
    const [x1, y1] = p(a1, rOuter);
    const [xi0, yi0] = p(a1, rInner);
    const [xi1, yi1] = p(a0, rInner);
    const path = `M${x0} ${y0} A ${rOuter} ${rOuter} 0 ${large} 1 ${x1} ${y1} L ${xi0} ${yi0} A ${rInner} ${rInner} 0 ${large} 0 ${xi1} ${yi1} Z`;
    return { path, color: d.color || palette[i % palette.length], d, pct: (d.value/total)*100 };
  });

  return (
    <div style={{display:'flex', alignItems:'center', gap: 12}}>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{flexShrink: 0}}>
        {arcs.map((a, i) => (
          <path key={i} d={a.path}
            fill={a.color}
            opacity={hover === null || hover === i ? 1 : 0.35}
            stroke="var(--panel)"
            strokeWidth="1.5"
            style={{cursor: onSelect ? 'pointer' : 'default', transition: 'opacity 0.15s'}}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onSelect && onSelect(a.d)} />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="10.5" fill={C.muted}
              fontFamily="var(--font-sans)" style={{textTransform:'uppercase', letterSpacing:'.06em'}}>
          {hover !== null ? arcs[hover].pct.toFixed(1) + '%' : 'TOTAL'}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="14" fill={C.fg}
              fontFamily="var(--font-mono)" fontWeight="500">
          {hover !== null
            ? 'S/ ' + (arcs[hover].d.value >= 1e6 ? (arcs[hover].d.value/1e6).toFixed(1)+'M' : (arcs[hover].d.value/1e3).toFixed(0)+'K')
            : 'S/ ' + (total >= 1e6 ? (total/1e6).toFixed(1)+'M' : (total/1e3).toFixed(0)+'K')}
        </text>
      </svg>
      <div style={{display:'flex', flexDirection:'column', gap: 5, fontSize: 11.5, flex: 1, minWidth: 0}}>
        {arcs.map((a, i) => (
          <div key={i}
               onMouseEnter={() => setHover(i)}
               onMouseLeave={() => setHover(null)}
               onClick={() => onSelect && onSelect(a.d)}
               style={{display:'flex', alignItems:'center', gap: 8, cursor: onSelect ? 'pointer' : 'default',
                       opacity: hover === null || hover === i ? 1 : 0.55, transition:'opacity 0.15s'}}>
            <span style={{width: 8, height: 8, borderRadius: 2, background: a.color, flexShrink: 0}}></span>
            <span style={{flex: 1, color: 'var(--fg)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{a.d.label}</span>
            <span className="num" style={{color: 'var(--fg-muted)'}}>{a.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============== FLOW BARS — PIM > Cert > Comp > Dev > Gir ==============
function FlowChart({ values, labels, w = 600, h = 280 }) {
  // values aligned with labels
  const pad = { l: 16, r: 16, t: 22, b: 36 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = Math.max(...values);
  const barW = innerW / values.length - 16;
  const palette = [C.accent, '#52a673', '#5d9fdf', C.warn, '#e85b5b'];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{display:'block'}}>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={pad.l} x2={pad.l + innerW} y1={pad.t + (1-t)*innerH} y2={pad.t + (1-t)*innerH} stroke={C.grid} strokeDasharray={i === 0 ? '0' : '2 3'} />
      ))}

      {values.map((v, i) => {
        const bh = (v / max) * innerH;
        const x = pad.l + i * (innerW / values.length) + 8;
        const y = pad.t + innerH - bh;
        const pct = (v / values[0]) * 100;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} fill={palette[i]} rx="2" />
            <text x={x + barW/2} y={y - 6} textAnchor="middle" fontSize="10.5" fill={C.fg} fontFamily="var(--font-mono)">
              {v >= 1e6 ? (v/1e6).toFixed(2)+'M' : (v/1e3).toFixed(0)+'K'}
            </text>
            <text x={x + barW/2} y={pad.t + innerH + 14} textAnchor="middle" fontSize="11" fill={C.fg}>
              {labels[i]}
            </text>
            {i > 0 && (
              <text x={x + barW/2} y={pad.t + innerH + 28} textAnchor="middle" fontSize="10" fill={C.muted} fontFamily="var(--font-mono)">
                {pct.toFixed(1)}%
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ============== LINE CHART — ejecución mensual ==============
function LineChart({ series, labels, w = 700, h = 280 }) {
  // series: [{name, color, values:[12]}]
  const pad = { l: 50, r: 16, t: 16, b: 28 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = Math.max(1, ...series.flatMap(s => s.values));
  const n = labels.length;
  const xAt = (i) => pad.l + (i / (n - 1)) * innerW;
  const yAt = (v) => pad.t + (1 - v/max) * innerH;
  const [hover, setHover] = React.useState(null);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{display:'block'}}
         onMouseLeave={() => setHover(null)}>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = pad.t + (1 - t) * innerH;
        return (
          <g key={i}>
            <line x1={pad.l} x2={pad.l + innerW} y1={y} y2={y} stroke={C.grid} strokeDasharray={i === 0 ? '0' : '2 3'} />
            <text x={pad.l - 6} y={y + 3} fontSize="9.5" fill={C.dim} textAnchor="end" fontFamily="var(--font-mono)">
              {max * t >= 1e6 ? ((max*t)/1e6).toFixed(1)+'M' : ((max*t)/1e3).toFixed(0)+'K'}
            </text>
          </g>
        );
      })}

      {labels.map((l, i) => (
        <text key={i} x={xAt(i)} y={pad.t + innerH + 14} textAnchor="middle" fontSize="10.5" fill={C.muted}>{l}</text>
      ))}

      {series.map((s, si) => {
        const path = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i)} ${yAt(v)}`).join(' ');
        const area = path + ` L${xAt(n-1)} ${pad.t + innerH} L${xAt(0)} ${pad.t + innerH} Z`;
        return (
          <g key={si}>
            <path d={area} fill={s.color} opacity="0.08" />
            <path d={path} stroke={s.color} strokeWidth="2" fill="none" />
            {s.values.map((v, i) => v > 0 && (
              <circle key={i} cx={xAt(i)} cy={yAt(v)} r="2.5" fill={s.color} />
            ))}
          </g>
        );
      })}

      {/* hover overlay */}
      {labels.map((l, i) => (
        <rect key={i}
              x={xAt(i) - (innerW/(n-1))/2}
              y={pad.t}
              width={innerW/(n-1)}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(i)} />
      ))}
      {hover !== null && (
        <g pointerEvents="none">
          <line x1={xAt(hover)} x2={xAt(hover)} y1={pad.t} y2={pad.t + innerH} stroke={C.fg} strokeDasharray="2 3" opacity="0.4" />
          {series.map((s, si) => (
            <circle key={si} cx={xAt(hover)} cy={yAt(s.values[hover])} r="3.5" fill={s.color} stroke="var(--panel)" strokeWidth="2" />
          ))}
          <ChartTooltip
            x={Math.min(w - 230, xAt(hover) + 10)}
            y={pad.t}
            visible={true}
            lines={[
              [labels[hover]],
              ...series.map(s => [s.name, 'S/ ' + Math.round(s.values[hover]).toLocaleString('es-PE')])
            ]} />
        </g>
      )}

      {/* legend */}
      <g transform={`translate(${pad.l}, 4)`}>
        {series.map((s, i) => (
          <g key={i} transform={`translate(${i * 110}, 0)`}>
            <rect width="8" height="8" y="2" fill={s.color} rx="1.5" />
            <text x="14" y="9" fontSize="10.5" fill={C.muted}>{s.name}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

Object.assign(window, { BarPairChart, AvanceChart, DonutChart, FlowChart, LineChart });
