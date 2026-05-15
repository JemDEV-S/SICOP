// reporte-principal.jsx — Tabla jerárquica Finalidad > Rubro > Clasificador

function buildHierarchy(rows) {
  // Group: finalidad -> rubro -> clasificador (aggregated by combination)
  const finMap = new Map();
  rows.forEach(r => {
    if (!finMap.has(r.finCod)) finMap.set(r.finCod, { cod: r.finCod, nom: r.finNom, rubros: new Map(), agg: emptyAgg() });
    const fin = finMap.get(r.finCod);
    addAgg(fin.agg, r);
    if (!fin.rubros.has(r.rubroCod)) fin.rubros.set(r.rubroCod, { cod: r.rubroCod, nom: r.rubroNom, clasifs: new Map(), agg: emptyAgg() });
    const rub = fin.rubros.get(r.rubroCod);
    addAgg(rub.agg, r);
    if (!rub.clasifs.has(r.clasifCod)) rub.clasifs.set(r.clasifCod, { cod: r.clasifCod, nom: r.clasifNom, agg: emptyAgg(), origRows: [] });
    const cl = rub.clasifs.get(r.clasifCod);
    addAgg(cl.agg, r);
    cl.origRows.push(r);
  });
  return finMap;
}
function emptyAgg() {
  return { pia: 0, modif: 0, pim: 0, cert: 0, saldoCert: 0, comp: 0, dev: 0, gir: 0 };
}
function addAgg(a, r) {
  a.pia += r.pia; a.modif += r.modif; a.pim += r.pim;
  a.cert += r.cert; a.saldoCert += (r.pim - r.cert);
  a.comp += r.comp; a.dev += r.dev; a.gir += r.gir;
}

function ReportePrincipal({ data, rows, filters, setFilters }) {
  const hierarchy = React.useMemo(() => buildHierarchy(rows), [rows]);
  const finList = [...hierarchy.values()].sort((a, b) => b.agg.pim - a.agg.pim);

  const [openFins, setOpenFins] = React.useState(() => new Set(finList.slice(0, 3).map(f => f.cod)));
  const [openRubros, setOpenRubros] = React.useState(new Set());
  const [sortBy, setSortBy] = React.useState('pim');
  const [sortDir, setSortDir] = React.useState('desc');

  const toggleFin = (cod) => {
    const nx = new Set(openFins);
    nx.has(cod) ? nx.delete(cod) : nx.add(cod);
    setOpenFins(nx);
  };
  const toggleRub = (cod) => {
    const nx = new Set(openRubros);
    nx.has(cod) ? nx.delete(cod) : nx.add(cod);
    setOpenRubros(nx);
  };

  const expandAll = () => {
    setOpenFins(new Set(finList.map(f => f.cod)));
    const allR = new Set();
    finList.forEach(f => f.rubros.forEach((_, k) => allR.add(f.cod + ':' + k)));
    setOpenRubros(allR);
  };
  const collapseAll = () => { setOpenFins(new Set()); setOpenRubros(new Set()); };

  const sortedFinList = React.useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...finList].sort((a, b) => (a.agg[sortBy] - b.agg[sortBy]) * dir);
  }, [finList, sortBy, sortDir]);

  const onSort = (col) => {
    if (sortBy === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const grandAgg = aggregate(rows);

  const SortHead = ({ col, children, align }) => (
    <th className={align === 'right' ? 'num' : ''} onClick={() => onSort(col)} style={{cursor:'pointer', userSelect:'none'}}>
      {children}
      <span style={{marginLeft: 4, opacity: sortBy === col ? 1 : 0.25, fontSize: 9}}>
        {sortBy === col ? (sortDir === 'asc' ? '▲' : '▼') : '▾'}
      </span>
    </th>
  );

  return (
    <Panel
      title="Reporte principal — Finalidad / Rubro / Clasificador"
      tools={
        <div style={{display:'flex', gap: 6, alignItems: 'center'}}>
          <button className="btn ghost" onClick={expandAll}>Expandir todo</button>
          <button className="btn ghost" onClick={collapseAll}>Contraer todo</button>
        </div>
      }
      bodyStyle={{padding: 0}}>
      <div className="table-wrap" style={{maxHeight: 600, overflow:'auto'}}>
        <table className="data">
          <thead>
            <tr>
              <th style={{minWidth: 360}}>Concepto</th>
              <SortHead col="pia" align="right">PIA</SortHead>
              <SortHead col="modif" align="right">Modificaciones</SortHead>
              <SortHead col="pim" align="right">PIM</SortHead>
              <SortHead col="cert" align="right">Certificación</SortHead>
              <th className="num">Saldo cert.</th>
              <SortHead col="comp" align="right">Compromiso</SortHead>
              <SortHead col="dev" align="right">Devengado</SortHead>
              <SortHead col="gir" align="right">Girado</SortHead>
              <th className="num">% Cert.</th>
              <th className="num">% Comp.</th>
              <th className="num" style={{minWidth: 150}}>% Devengado</th>
            </tr>
          </thead>
          <tbody>
            {sortedFinList.map(fin => {
              const isOpen = openFins.has(fin.cod);
              return (
                <React.Fragment key={fin.cod}>
                  <tr className="level-fin">
                    <td onClick={() => toggleFin(fin.cod)} style={{cursor:'pointer'}}>
                      <Twirl open={isOpen} />
                      <span className="mono dim" style={{fontSize: 10.5, marginRight: 8}}>{fin.cod}</span>
                      {fin.nom}
                    </td>
                    <td className="num">{fmtMoney(fin.agg.pia)}</td>
                    <td className="num" style={{color: fin.agg.modif >= 0 ? 'var(--ok)' : 'var(--danger)'}}>
                      {fin.agg.modif >= 0 ? '+' : ''}{fmtMoney(fin.agg.modif)}
                    </td>
                    <td className="num">{fmtMoney(fin.agg.pim)}</td>
                    <td className="num">{fmtMoney(fin.agg.cert)}</td>
                    <td className="num muted">{fmtMoney(fin.agg.saldoCert)}</td>
                    <td className="num">{fmtMoney(fin.agg.comp)}</td>
                    <td className="num">{fmtMoney(fin.agg.dev)}</td>
                    <td className="num">{fmtMoney(fin.agg.gir)}</td>
                    <td className="num"><span className="num">{fmtPct(safePct(fin.agg.cert, fin.agg.pim))}</span></td>
                    <td className="num"><span className="num">{fmtPct(safePct(fin.agg.comp, fin.agg.pim))}</span></td>
                    <td className="num"><Pct value={safePct(fin.agg.dev, fin.agg.pim)} /></td>
                  </tr>

                  {isOpen && [...fin.rubros.values()].sort((a, b) => b.agg.pim - a.agg.pim).map(rub => {
                    const rk = fin.cod + ':' + rub.cod;
                    const rOpen = openRubros.has(rk);
                    return (
                      <React.Fragment key={rk}>
                        <tr className="level-rubro">
                          <td onClick={() => toggleRub(rk)} style={{cursor:'pointer'}}>
                            <Twirl open={rOpen} />
                            <span className="mono dim" style={{fontSize: 10.5, marginRight: 8}}>{rub.cod}</span>
                            {rub.nom}
                          </td>
                          <td className="num">{fmtMoney(rub.agg.pia)}</td>
                          <td className="num" style={{color: rub.agg.modif >= 0 ? 'var(--ok)' : 'var(--danger)'}}>{rub.agg.modif >= 0 ? '+' : ''}{fmtMoney(rub.agg.modif)}</td>
                          <td className="num">{fmtMoney(rub.agg.pim)}</td>
                          <td className="num">{fmtMoney(rub.agg.cert)}</td>
                          <td className="num muted">{fmtMoney(rub.agg.saldoCert)}</td>
                          <td className="num">{fmtMoney(rub.agg.comp)}</td>
                          <td className="num">{fmtMoney(rub.agg.dev)}</td>
                          <td className="num">{fmtMoney(rub.agg.gir)}</td>
                          <td className="num">{fmtPct(safePct(rub.agg.cert, rub.agg.pim))}</td>
                          <td className="num">{fmtPct(safePct(rub.agg.comp, rub.agg.pim))}</td>
                          <td className="num"><Pct value={safePct(rub.agg.dev, rub.agg.pim)} /></td>
                        </tr>

                        {rOpen && [...rub.clasifs.values()].sort((a, b) => b.agg.pim - a.agg.pim).map(cl => (
                          <tr className="level-clasif" key={rk + ':' + cl.cod}>
                            <td>
                              <span className="mono dim" style={{fontSize: 10.5, marginRight: 8}}>{cl.cod}</span>
                              <span style={{color: 'var(--fg)'}}>{cl.nom}</span>
                            </td>
                            <td className="num">{fmtMoney(cl.agg.pia)}</td>
                            <td className="num">{cl.agg.modif >= 0 ? '+' : ''}{fmtMoney(cl.agg.modif)}</td>
                            <td className="num">{fmtMoney(cl.agg.pim)}</td>
                            <td className="num">{fmtMoney(cl.agg.cert)}</td>
                            <td className="num muted">{fmtMoney(cl.agg.saldoCert)}</td>
                            <td className="num">{fmtMoney(cl.agg.comp)}</td>
                            <td className="num">{fmtMoney(cl.agg.dev)}</td>
                            <td className="num">{fmtMoney(cl.agg.gir)}</td>
                            <td className="num">{fmtPct(safePct(cl.agg.cert, cl.agg.pim))}</td>
                            <td className="num">{fmtPct(safePct(cl.agg.comp, cl.agg.pim))}</td>
                            <td className="num"><Pct value={safePct(cl.agg.dev, cl.agg.pim)} /></td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}

            <tr className="level-fin" style={{background: 'var(--bg-elev-2)', borderTop: '2px solid var(--border-strong)'}}>
              <td>
                <span style={{marginLeft: 16, textTransform:'uppercase', letterSpacing:'0.05em', fontSize: 11}}>Total general</span>
              </td>
              <td className="num" style={{fontWeight: 600}}>{fmtMoney(grandAgg.pia)}</td>
              <td className="num" style={{color: grandAgg.modif >= 0 ? 'var(--ok)' : 'var(--danger)', fontWeight: 600}}>
                {grandAgg.modif >= 0 ? '+' : ''}{fmtMoney(grandAgg.modif)}
              </td>
              <td className="num" style={{fontWeight: 600}}>{fmtMoney(grandAgg.pim)}</td>
              <td className="num" style={{fontWeight: 600}}>{fmtMoney(grandAgg.cert)}</td>
              <td className="num muted">{fmtMoney(grandAgg.saldoCert)}</td>
              <td className="num" style={{fontWeight: 600}}>{fmtMoney(grandAgg.comp)}</td>
              <td className="num" style={{fontWeight: 600}}>{fmtMoney(grandAgg.dev)}</td>
              <td className="num" style={{fontWeight: 600}}>{fmtMoney(grandAgg.gir)}</td>
              <td className="num" style={{fontWeight: 600}}>{fmtPct(grandAgg.avCert)}</td>
              <td className="num" style={{fontWeight: 600}}>{fmtPct(grandAgg.avComp)}</td>
              <td className="num"><Pct value={grandAgg.avDev} /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{padding: '8px 14px', display:'flex', justifyContent:'space-between', borderTop: '1px solid var(--border)', fontSize: 11.5, color: 'var(--fg-muted)'}}>
        <span>{finList.length} finalidades · {rows.length} registros base</span>
        <span>Montos en S/ (soles peruanos) · Porcentajes con 1 decimal</span>
      </div>
    </Panel>
  );
}

Object.assign(window, { ReportePrincipal });
