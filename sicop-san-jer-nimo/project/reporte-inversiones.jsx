// reporte-inversiones.jsx — Vista de inversiones por CUI

function ReporteInversiones({ data, filters, setFilters }) {
  // Force soloInversion=true
  const baseFilters = { ...filters, soloInversion: true };
  const rows = applyFilters(data.registros, baseFilters);

  // Group by CUI
  const cuiData = React.useMemo(() => {
    const m = new Map();
    rows.forEach(r => {
      if (!r.cui) return;
      if (!m.has(r.cui)) m.set(r.cui, {
        cui: r.cui, inversion: r.inversion, uei: r.uei,
        unidadNom: r.unidadNom, organoNom: r.organoNom,
        meta: r.meta, fuenteNom: r.fuenteNom, rubroNom: r.rubroNom,
        agg: { pim: 0, cert: 0, comp: 0, dev: 0, gir: 0, pia: 0 },
      });
      const x = m.get(r.cui);
      x.agg.pim += r.pim; x.agg.cert += r.cert;
      x.agg.comp += r.comp; x.agg.dev += r.dev; x.agg.gir += r.gir;
      x.agg.pia += r.pia;
    });
    return [...m.values()].sort((a, b) => b.agg.pim - a.agg.pim);
  }, [rows]);

  const [selected, setSelected] = React.useState(cuiData[0]?.cui || null);
  const sel = cuiData.find(c => c.cui === selected) || cuiData[0];

  const totalAgg = React.useMemo(() => ({
    pim: cuiData.reduce((a, c) => a + c.agg.pim, 0),
    cert: cuiData.reduce((a, c) => a + c.agg.cert, 0),
    dev: cuiData.reduce((a, c) => a + c.agg.dev, 0),
    gir: cuiData.reduce((a, c) => a + c.agg.gir, 0),
  }), [cuiData]);

  return (
    <Section title="Inversiones por CUI"
             sub={`${cuiData.length} proyectos de inversión activos · Ejercicio fiscal ${data.anio}`}>
      <FilterBar data={data} filters={filters} setFilters={setFilters} />

      <div className="kpi-grid" style={{marginBottom: 14}}>
        <KpiCard label="Proyectos activos" value={null} foot={cuiData.length + ' CUI'} />
        <KpiCard label="PIM total inversiones" value={totalAgg.pim} big />
        <KpiCard label="Devengado" value={totalAgg.dev} pct={safePct(totalAgg.dev, totalAgg.pim)} />
        <KpiCard label="Girado" value={totalAgg.gir} pct={safePct(totalAgg.gir, totalAgg.pim)} />
      </div>

      <Panel title="Avance por inversión (CUI)" bodyStyle={{padding: 0}}>
        <div style={{display: 'grid', gridTemplateColumns: '1.6fr 1fr', minHeight: 360}}>
          <div className="table-wrap" style={{borderRight: '1px solid var(--border)', maxHeight: 560, overflow:'auto'}}>
            <table className="data">
              <thead>
                <tr>
                  <th>CUI</th>
                  <th>Inversión</th>
                  <th className="num">PIM</th>
                  <th className="num">Devengado</th>
                  <th className="num" style={{minWidth: 140}}>Avance</th>
                </tr>
              </thead>
              <tbody>
                {cuiData.map(c => {
                  const avance = safePct(c.agg.dev, c.agg.pim);
                  return (
                    <tr key={c.cui}
                        onClick={() => setSelected(c.cui)}
                        style={{cursor:'pointer', background: selected === c.cui ? 'var(--accent-soft)' : undefined}}>
                      <td>
                        <span className="mono" style={{color: 'var(--accent)', fontSize: 11.5}}>{c.cui}</span>
                      </td>
                      <td style={{maxWidth: 260, whiteSpace: 'normal', lineHeight: 1.3, paddingTop: 8, paddingBottom: 8}}>
                        {c.inversion}
                      </td>
                      <td className="num">{fmtMoney(c.agg.pim)}</td>
                      <td className="num">{fmtMoney(c.agg.dev)}</td>
                      <td className="num"><Pct value={avance} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sel ? (
            <div style={{padding: 20, display:'flex', flexDirection:'column', gap: 14}}>
              <div>
                <div className="upper">Detalle de inversión</div>
                <div style={{fontSize: 15, fontWeight: 600, lineHeight: 1.35, marginTop: 6}}>
                  {sel.inversion}
                </div>
                <div className="mono" style={{fontSize: 11.5, color:'var(--accent)', marginTop: 4}}>{sel.cui}</div>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', rowGap: 8, columnGap: 12, fontSize: 11.5}}>
                <div className="upper">Unidad Ejecutora</div>
                <div className="upper">Órgano responsable</div>
                <div>{sel.uei || '—'}</div>
                <div>{sel.organoNom}</div>

                <div className="upper">Unidad responsable</div>
                <div className="upper">Meta</div>
                <div>{sel.unidadNom}</div>
                <div className="mono">{sel.meta}</div>

                <div className="upper">Fuente</div>
                <div className="upper">Rubro</div>
                <div>{sel.fuenteNom}</div>
                <div>{sel.rubroNom}</div>
              </div>

              <div className="divider"></div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10}}>
                <MiniStat label="PIA" value={sel.agg.pia} />
                <MiniStat label="PIM" value={sel.agg.pim} highlight />
                <MiniStat label="Certificación" value={sel.agg.cert} pct={safePct(sel.agg.cert, sel.agg.pim)} />
                <MiniStat label="Compromiso" value={sel.agg.comp} pct={safePct(sel.agg.comp, sel.agg.pim)} />
                <MiniStat label="Devengado" value={sel.agg.dev} pct={safePct(sel.agg.dev, sel.agg.pim)} />
                <MiniStat label="Girado" value={sel.agg.gir} pct={safePct(sel.agg.gir, sel.agg.pim)} />
              </div>

              <div>
                <div className="upper" style={{marginBottom: 8}}>Avance de devengado</div>
                <div style={{height: 28, background: 'var(--bg-elev-2)', borderRadius: 4, overflow:'hidden', position:'relative', border: '1px solid var(--border)'}}>
                  <div style={{
                    width: Math.min(100, safePct(sel.agg.dev, sel.agg.pim) || 0) + '%',
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--accent), ' + (safePct(sel.agg.dev, sel.agg.pim) > 70 ? 'var(--ok)' : 'var(--accent)') + ')',
                    borderRadius: 3,
                  }}></div>
                  <span style={{position:'absolute', top: 6, left: 10, fontSize: 12, fontFamily:'var(--font-mono)', color: 'var(--fg)', fontWeight: 600}}>
                    {fmtPct(safePct(sel.agg.dev, sel.agg.pim))}
                  </span>
                  <span style={{position:'absolute', top: 6, right: 10, fontSize: 11, color: 'var(--fg-muted)'}}>
                    Saldo por ejecutar: S/ {fmtMoney(sel.agg.pim - sel.agg.dev)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{padding: 40, textAlign:'center', color:'var(--fg-muted)'}}>
              Seleccione una inversión para ver el detalle
            </div>
          )}
        </div>
      </Panel>
    </Section>
  );
}

function MiniStat({ label, value, pct, highlight }) {
  return (
    <div style={{
      background: highlight ? 'var(--bg-elev-2)' : 'transparent',
      border: '1px solid var(--border)',
      borderRadius: 4,
      padding: '8px 10px',
    }}>
      <div className="upper" style={{marginBottom: 3}}>{label}</div>
      <div className="num" style={{fontSize: 14, color: 'var(--fg)'}}>
        <span style={{color:'var(--fg-muted)', fontSize:11, marginRight:3}}>S/</span>
        {fmtMoney(value)}
      </div>
      {pct !== undefined && pct !== null && (
        <div style={{fontSize: 10.5, color: 'var(--fg-muted)', marginTop: 2}} className="num">
          {fmtPct(pct)} del PIM
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ReporteInversiones });
