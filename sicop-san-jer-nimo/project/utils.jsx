// utils.jsx — shared helpers and primitive components

const fmtMoney = (n, opts = {}) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const sign = n < 0 ? '−' : '';
  const abs = Math.abs(Math.round(n));
  const s = abs.toLocaleString('es-PE', { maximumFractionDigits: 0 });
  return (opts.symbol === false ? '' : '') + sign + s;
};
const fmtSoles = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const sign = n < 0 ? '−' : '';
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${sign}S/ ${(abs/1e6).toFixed(2)} M`;
  if (abs >= 1e3) return `${sign}S/ ${(abs/1e3).toFixed(1)} K`;
  return `${sign}S/ ${Math.round(abs).toLocaleString('es-PE')}`;
};
const fmtPct = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return n.toFixed(1).replace('.', ',') + '%';
};
const pctClass = (p) => {
  if (p === null || p === undefined || isNaN(p)) return 'na';
  if (p > 100) return 'over';
  if (p > 70) return 'high';
  if (p > 30) return 'mid';
  return 'low';
};
const pctLabel = (p) => {
  const c = pctClass(p);
  return { low: 'Bajo', mid: 'Medio', high: 'Alto', over: 'Revisar', na: 'N/A' }[c];
};

const safePct = (num, den) => {
  if (!den || den === 0) return null;
  return (num / den) * 100;
};

const sumBy = (rows, key) => rows.reduce((a, r) => a + (r[key] || 0), 0);

const MES_NOM = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MES_LARGO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// Filter application — returns a filtered registros array
function applyFilters(registros, filters) {
  const f = filters || {};
  return registros.filter((r) => {
    if (f.organo && r.organoCod !== f.organo) return false;
    if (f.unidad && r.unidadCod !== f.unidad) return false;
    if (f.rubro && r.rubroCod !== f.rubro) return false;
    if (f.generica && r.genericaCod !== f.generica) return false;
    if (f.fuente && r.fuenteCod !== f.fuente) return false;
    if (f.finalidad && r.finCod !== f.finalidad) return false;
    if (f.cui && r.cui !== f.cui) return false;
    if (f.soloInversion && !r.cui) return false;
    if (f.q) {
      const q = f.q.toLowerCase();
      const fields = [r.organoNom, r.unidadNom, r.finNom, r.clasifNom, r.rubroNom, r.genericaNom, r.fuenteNom, r.cui, r.inversion, r.meta, r.secFunc].filter(Boolean).join(' ').toLowerCase();
      if (!fields.includes(q)) return false;
    }
    return true;
  });
}

// Compute aggregate KPIs from registros
function aggregate(rows) {
  const pia = sumBy(rows, 'pia');
  const pim = sumBy(rows, 'pim');
  const cert = sumBy(rows, 'cert');
  const comp = sumBy(rows, 'comp');
  const dev = sumBy(rows, 'dev');
  const gir = sumBy(rows, 'gir');
  const pag = sumBy(rows, 'pag');
  return {
    pia, pim, cert, comp, dev, gir, pag,
    modif: pim - pia,
    saldoCert: pim - cert,
    saldoEjec: pim - dev,
    certNoDev: cert - dev,
    compNoDev: comp - dev,
    devNoGir: dev - gir,
    avCert: safePct(cert, pim),
    avComp: safePct(comp, pim),
    avDev: safePct(dev, pim),
    avGir: safePct(gir, pim),
    avPag: safePct(pag, pim),
  };
}

// --- Primitive UI bits ---
function Twirl({ open, onClick }) {
  return (
    <span className={'twirl' + (open ? ' open' : '')} onClick={onClick}>▶</span>
  );
}

function Pct({ value }) {
  if (value === null || value === undefined || isNaN(value)) {
    return <span className="badge na">N/A</span>;
  }
  return (
    <span className="num" style={{display:'inline-flex', alignItems:'center', justifyContent:'flex-end'}}>
      <span className="progress" aria-hidden="true">
        <i className={pctClass(value)} style={{ width: Math.min(100, Math.max(0, value)) + '%' }}></i>
      </span>
      <span style={{minWidth: 56, textAlign: 'right', color: 'var(--fg)'}}>{fmtPct(value)}</span>
    </span>
  );
}

function Badge({ value, children }) {
  if (children) return <span className={'badge ' + pctClass(value)}>{children}</span>;
  return <span className={'badge ' + pctClass(value)}><span className={'dot ' + pctClass(value)}></span>{pctLabel(value)}</span>;
}

function Section({ title, sub, tools, children }) {
  return (
    <div>
      <div className="section-head">
        <div>
          <div className="section-title">{title}</div>
          {sub && <div className="section-sub">{sub}</div>}
        </div>
        {tools && <div className="section-tools">{tools}</div>}
      </div>
      {children}
    </div>
  );
}

function Panel({ title, tools, children, style, bodyStyle }) {
  return (
    <div className="panel" style={style}>
      {title && (
        <div className="panel-head">
          <div className="panel-title">{title}</div>
          {tools}
        </div>
      )}
      <div className="panel-body" style={bodyStyle}>{children}</div>
    </div>
  );
}

Object.assign(window, {
  fmtMoney, fmtSoles, fmtPct, pctClass, pctLabel, safePct, sumBy,
  MES_NOM, MES_LARGO,
  applyFilters, aggregate,
  Twirl, Pct, Badge, Section, Panel,
});
