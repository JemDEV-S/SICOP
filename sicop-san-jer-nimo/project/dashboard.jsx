// dashboard.jsx — Dashboard público

function Dashboard({ data, filters, setFilters }) {
  const rows = applyFilters(data.registros, filters);
  const agg = aggregate(rows);

  // KPI list (RF-07)
  const kpis = [
    { label: 'PIA', value: agg.pia, foot: 'Presupuesto Apertura' },
    { label: 'Modificaciones', value: agg.modif, foot: 'PIM − PIA', accent: agg.modif >= 0 ? 'var(--ok)' : 'var(--danger)' },
    { label: 'PIM', value: agg.pim, foot: 'Presupuesto Modificado', big: true },
    { label: 'Certificación', value: agg.cert, pct: agg.avCert, foot: 'Saldo: S/ ' + fmtMoney(agg.saldoCert) },
    { label: 'Compromiso anual', value: agg.comp, pct: agg.avComp },
    { label: 'Devengado', value: agg.dev, pct: agg.avDev, foot: 'Saldo: S/ ' + fmtMoney(agg.saldoEjec), big: true },
    { label: 'Girado', value: agg.gir, pct: agg.avGir, foot: 'No girado: S/ ' + fmtMoney(agg.devNoGir) },
    { label: 'Pagado', value: agg.pag, pct: agg.avPag },
  ];

  // Chart data — by órgano
  const byOrgano = React.useMemo(() => {
    const m = {};
    rows.forEach(r => {
      if (!m[r.organoCod]) m[r.organoCod] = { label: r.organoNom, codigo: r.organoCod, pim: 0, dev: 0, cert: 0, gir: 0 };
      m[r.organoCod].pim += r.pim;
      m[r.organoCod].dev += r.dev;
      m[r.organoCod].cert += r.cert;
      m[r.organoCod].gir += r.gir;
    });
    return Object.values(m).sort((a, b) => b.pim - a.pim);
  }, [rows]);

  // by genérica
  const byGenerica = React.useMemo(() => {
    const m = {};
    rows.forEach(r => {
      const k = r.genericaCod;
      if (!m[k]) m[k] = { label: r.genericaNom, codigo: k, value: 0 };
      m[k].value += r.pim;
    });
    return Object.values(m).sort((a, b) => b.value - a.value);
  }, [rows]);

  // by rubro
  const byRubro = React.useMemo(() => {
    const m = {};
    rows.forEach(r => {
      const k = r.rubroCod;
      if (!m[k]) m[k] = { label: r.rubroNom, codigo: k, value: 0 };
      m[k].value += r.pim;
    });
    return Object.values(m).sort((a, b) => b.value - a.value);
  }, [rows]);

  return (
    <Section
      title="Dashboard de ejecución presupuestal"
      sub={`${rows.length.toLocaleString('es-PE')} registros · Datos al 13 de mayo de 2026 · Ejecución acumulada`}
      tools={
        <div style={{display:'flex', alignItems:'center', gap: 8}}>
          <span className="muted tiny" style={{textTransform: 'none'}}>
            <span className="live-dot" style={{display: 'inline-block', marginRight: 6, verticalAlign: 'middle'}}></span>
            Sincronizado
          </span>
        </div>
      }>

      <FilterBar data={data} filters={filters} setFilters={setFilters} />

      {/* KPIs */}
      <div className="kpi-grid">
        {kpis.map((k, i) => (
          <KpiCard key={i} {...k} />
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid two" style={{marginTop: 14}}>
        <Panel title="PIM vs Devengado por órgano"
               tools={<span className="muted tiny" style={{textTransform: 'none'}}>
                 <span style={{width:10,height:6,background:'var(--accent)',opacity:.45, display:'inline-block', marginRight:4, borderRadius:1}}></span>PIM
                 <span style={{width:10,height:6,background:'var(--accent)', display:'inline-block', margin:'0 4px 0 10px', borderRadius:1}}></span>Devengado
               </span>}>
          <BarPairChart data={byOrgano} h={byOrgano.length * 42 + 40}
                        onSelect={(d) => setFilters({...filters, organo: d.codigo})} />
        </Panel>
        <Panel title="Avance de ejecución por órgano">
          <AvanceChart data={byOrgano} h={byOrgano.length * 38 + 30}
                       onSelect={(d) => setFilters({...filters, organo: d.codigo})} />
        </Panel>
      </div>

      <div className="charts-grid two" style={{marginTop: 14}}>
        <Panel title="Flujo presupuestal" tools={<span className="muted tiny" style={{textTransform: 'none'}}>Acumulado a mayo</span>}>
          <FlowChart values={[agg.pim, agg.cert, agg.comp, agg.dev, agg.gir]}
                     labels={['PIM', 'Certificado', 'Comprometido', 'Devengado', 'Girado']} />
        </Panel>
        <div style={{display:'grid', gridTemplateRows:'1fr 1fr', gap: 14}}>
          <Panel title="Distribución del PIM por genérica">
            <DonutChart data={byGenerica.map(g => ({...g, label: g.label.length > 28 ? g.label.slice(0,28)+'…' : g.label }))}
                        w={180} h={180}
                        onSelect={(d) => setFilters({...filters, generica: d.codigo})} />
          </Panel>
          <Panel title="Distribución del PIM por rubro">
            <DonutChart data={byRubro.map(r => ({...r, label: r.label.length > 28 ? r.label.slice(0,28)+'…' : r.label }))}
                        w={180} h={180}
                        onSelect={(d) => setFilters({...filters, rubro: d.codigo})} />
          </Panel>
        </div>
      </div>

      {/* Reporte principal jerárquico */}
      <div style={{marginTop: 14}}>
        <ReportePrincipal data={data} rows={rows} filters={filters} setFilters={setFilters} />
      </div>
    </Section>
  );
}

function KpiCard({ label, value, pct, foot, accent, big }) {
  const isPctBased = pct !== undefined && pct !== null;
  return (
    <div className="kpi" style={big ? {background: 'var(--bg-elev-2)'} : {}}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={accent ? {color: accent} : {}}>
        <span style={{color:'var(--fg-muted)', fontSize: 12, marginRight: 4, fontWeight: 400}}>S/</span>
        {fmtMoney(value)}
      </div>
      {isPctBased && (
        <>
          <div className="kpi-bar"><i className={pctClass(pct)} style={{width: Math.min(100, Math.max(0, pct || 0)) + '%', background: pct > 100 ? '#8c5fd1' : (pct > 70 ? 'var(--ok)' : pct > 30 ? 'var(--warn)' : 'var(--danger)')}}></i></div>
          <div className="kpi-foot">
            <span style={{color: pctClass(pct) === 'high' ? 'var(--ok)' : pctClass(pct) === 'mid' ? 'var(--warn)' : pctClass(pct) === 'low' ? 'var(--danger)' : 'var(--fg-muted)', fontFamily:'var(--font-mono)'}}>
              {fmtPct(pct)}
            </span>
            <span className="muted">avance</span>
            {foot && <span className="muted" style={{marginLeft: 'auto', fontSize: 10.5}}>{foot}</span>}
          </div>
        </>
      )}
      {!isPctBased && foot && <div className="kpi-foot muted">{foot}</div>}
    </div>
  );
}

Object.assign(window, { Dashboard, KpiCard });
