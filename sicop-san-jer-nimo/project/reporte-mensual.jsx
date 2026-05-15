// reporte-mensual.jsx — Vista de ejecución mensual

function ReporteMensual({ data, filters, setFilters }) {
  const rows = applyFilters(data.registros, filters);

  // Aggregate monthly across all filtered rows
  const series = React.useMemo(() => {
    const comp = Array(12).fill(0);
    const dev = Array(12).fill(0);
    const gir = Array(12).fill(0);
    const pag = Array(12).fill(0);
    rows.forEach(r => {
      r.monthlyComp.forEach((v, i) => comp[i] += v);
      r.monthlyDev.forEach((v, i) => dev[i] += v);
      r.monthlyGir.forEach((v, i) => gir[i] += v);
      r.monthlyPag.forEach((v, i) => pag[i] += v);
    });
    return { comp, dev, gir, pag };
  }, [rows]);

  const totals = {
    comp: series.comp.reduce((a, b) => a + b, 0),
    dev: series.dev.reduce((a, b) => a + b, 0),
    gir: series.gir.reduce((a, b) => a + b, 0),
    pag: series.pag.reduce((a, b) => a + b, 0),
  };

  const agg = aggregate(rows);

  return (
    <Section
      title="Ejecución mensual"
      sub="Distribución por mes — compromiso, devengado, girado y pagado">
      <FilterBar data={data} filters={filters} setFilters={setFilters} />

      <div className="kpi-grid" style={{marginBottom: 14}}>
        <KpiCard label="Compromiso acumulado" value={totals.comp} pct={safePct(totals.comp, agg.pim)} />
        <KpiCard label="Devengado acumulado" value={totals.dev} pct={safePct(totals.dev, agg.pim)} big />
        <KpiCard label="Girado acumulado" value={totals.gir} pct={safePct(totals.gir, agg.pim)} />
        <KpiCard label="Pagado acumulado" value={totals.pag} pct={safePct(totals.pag, agg.pim)} />
      </div>

      <Panel title="Ejecución mensual — acumulada"
             tools={<span className="muted tiny" style={{textTransform:'none'}}>Ejecutado al cierre de mayo · Junio en curso</span>}>
        <LineChart
          labels={MES_NOM}
          series={[
            { name: 'Compromiso', color: 'var(--accent)', values: series.comp },
            { name: 'Devengado', color: 'var(--ok)', values: series.dev },
            { name: 'Girado', color: 'var(--warn)', values: series.gir },
            { name: 'Pagado', color: '#8c5fd1', values: series.pag },
          ]} />
      </Panel>

      <div style={{marginTop: 14}}>
        <Panel title="Detalle por mes" bodyStyle={{padding: 0}}>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th className="num">Compromiso</th>
                  <th className="num">Devengado</th>
                  <th className="num">Girado</th>
                  <th className="num">Pagado</th>
                  <th className="num">Dev. acumulado</th>
                  <th className="num" style={{minWidth: 160}}>% Avance PIM</th>
                </tr>
              </thead>
              <tbody>
                {MES_LARGO.map((m, i) => {
                  const accDev = series.dev.slice(0, i+1).reduce((a, b) => a + b, 0);
                  const avPct = safePct(accDev, agg.pim);
                  const isCurrent = i === 4;
                  const empty = series.comp[i] === 0 && series.dev[i] === 0;
                  return (
                    <tr key={i} style={empty ? {opacity: 0.4} : isCurrent ? {background: 'var(--accent-soft)'} : {}}>
                      <td style={{fontWeight: isCurrent ? 600 : 400}}>
                        <span className="mono dim" style={{fontSize: 10.5, marginRight: 8}}>{String(i+1).padStart(2,'0')}</span>
                        {m} 2026
                        {isCurrent && <span className="badge neutral" style={{marginLeft: 8}}>Actual</span>}
                      </td>
                      <td className="num">{empty ? '—' : fmtMoney(series.comp[i])}</td>
                      <td className="num">{empty ? '—' : fmtMoney(series.dev[i])}</td>
                      <td className="num">{empty ? '—' : fmtMoney(series.gir[i])}</td>
                      <td className="num">{empty ? '—' : fmtMoney(series.pag[i])}</td>
                      <td className="num">{empty ? '—' : fmtMoney(accDev)}</td>
                      <td className="num">{empty ? '—' : <Pct value={avPct} />}</td>
                    </tr>
                  );
                })}
                <tr style={{background:'var(--bg-elev-2)', borderTop:'2px solid var(--border-strong)', fontWeight: 600}}>
                  <td style={{textTransform:'uppercase', letterSpacing:'0.05em', fontSize: 11}}>Acumulado anual</td>
                  <td className="num">{fmtMoney(totals.comp)}</td>
                  <td className="num">{fmtMoney(totals.dev)}</td>
                  <td className="num">{fmtMoney(totals.gir)}</td>
                  <td className="num">{fmtMoney(totals.pag)}</td>
                  <td className="num">{fmtMoney(totals.dev)}</td>
                  <td className="num"><Pct value={safePct(totals.dev, agg.pim)} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </Section>
  );
}

Object.assign(window, { ReporteMensual });
