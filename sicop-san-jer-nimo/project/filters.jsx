// filters.jsx — filter sidebar (institutional hierarchy) + top filter bar

function Sidebar({ data, filters, setFilters }) {
  const organos = data.organos.filter(o => o.nivel === 'organo');
  const unidadesFor = (org) => data.organos.filter(u => u.padre === org.codigo);

  const [expanded, setExpanded] = React.useState(new Set(organos.map(o => o.codigo)));
  const toggle = (cod) => {
    const nx = new Set(expanded);
    nx.has(cod) ? nx.delete(cod) : nx.add(cod);
    setExpanded(nx);
  };

  const selectOrg = (cod) => setFilters({ ...filters, organo: cod === filters.organo ? null : cod, unidad: null });
  const selectUni = (cod, padre) => setFilters({ ...filters, organo: padre, unidad: cod === filters.unidad ? null : cod });

  // Tally registros per unit
  const countsByUnit = React.useMemo(() => {
    const m = {};
    data.registros.forEach(r => { m[r.unidadCod] = (m[r.unidadCod] || 0) + 1; });
    return m;
  }, [data.registros]);

  return (
    <aside className="sidebar">
      <div className="upper" style={{marginBottom: 8}}>Pliego</div>
      <div style={{fontSize: 12.5, fontWeight: 600, lineHeight: 1.3, marginBottom: 4}}>
        {data.pliego}
      </div>
      <div className="muted" style={{fontSize: 11, marginBottom: 16}}>
        {data.departamento} · {data.provincia} · EF {data.anio}
      </div>

      <div className="upper" style={{marginBottom: 8, display:'flex', justifyContent:'space-between'}}>
        <span>Estructura institucional</span>
        {(filters.organo || filters.unidad) && (
          <a onClick={(e) => { e.preventDefault(); setFilters({...filters, organo: null, unidad: null}); }}
             style={{color: 'var(--accent)', textTransform: 'none', letterSpacing: 0, fontSize: 10.5}}>limpiar</a>
        )}
      </div>
      <div className="tree">
        <div className={'tree-item organo' + ((!filters.organo && !filters.unidad) ? ' active' : '')}
             onClick={() => setFilters({...filters, organo: null, unidad: null})}>
          <span className="tree-caret"></span>
          <span style={{flex:1}}>Todos los órganos</span>
          <span className="dim mono" style={{fontSize: 10.5}}>{data.registros.length}</span>
        </div>
        {organos.map(o => {
          const open = expanded.has(o.codigo);
          const isActive = filters.organo === o.codigo && !filters.unidad;
          const unidades = unidadesFor(o);
          const total = unidades.reduce((a, u) => a + (countsByUnit[u.codigo] || 0), 0);
          return (
            <React.Fragment key={o.codigo}>
              <div className={'tree-item organo' + (isActive ? ' active' : '')}
                   onClick={() => selectOrg(o.codigo)}>
                <span className="tree-caret" onClick={(e) => { e.stopPropagation(); toggle(o.codigo); }}>
                  {open ? '▾' : '▸'}
                </span>
                <span style={{flex:1, fontSize:11}}>{o.nombre}</span>
                <span className="dim mono" style={{fontSize: 10.5}}>{total}</span>
              </div>
              {open && unidades.map(u => (
                <div key={u.codigo}
                     className={'tree-item unidad' + (filters.unidad === u.codigo ? ' active' : '')}
                     onClick={() => selectUni(u.codigo, o.codigo)}>
                  <span style={{flex:1}}>{u.nombre}</span>
                  <span className="dim mono" style={{fontSize: 10.5}}>{countsByUnit[u.codigo] || 0}</span>
                </div>
              ))}
            </React.Fragment>
          );
        })}
      </div>

      <div className="divider"></div>

      <div className="upper" style={{marginBottom: 8}}>Última actualización</div>
      <div style={{fontSize: 11.5, lineHeight: 1.55, color: 'var(--fg-muted)'}}>
        <div className="num" style={{color: 'var(--fg)'}}>{data.ultimaCarga}</div>
        <div>Fuente: Reporte Excel SIAF Web</div>
        <div className="mono" style={{fontSize: 10.5, color:'var(--fg-dim)', marginTop: 4, wordBreak: 'break-all'}}>{data.archivo}</div>
      </div>

      <div className="divider"></div>

      <div className="upper" style={{marginBottom: 8}}>Atajos de teclado</div>
      <div style={{display: 'grid', rowGap: 4, fontSize: 11, color: 'var(--fg-muted)'}}>
        <div style={{display:'flex', justifyContent:'space-between'}}><span>Búsqueda</span> <span><span className="kbd">/</span></span></div>
        <div style={{display:'flex', justifyContent:'space-between'}}><span>Limpiar filtros</span> <span><span className="kbd">⎋</span></span></div>
        <div style={{display:'flex', justifyContent:'space-between'}}><span>Ir a tabla</span> <span><span className="kbd">g</span> <span className="kbd">t</span></span></div>
      </div>
    </aside>
  );
}

function FilterBar({ data, filters, setFilters }) {
  const filterDefs = [
    { key: 'rubro', label: 'Rubro', options: data.rubros.map(r => [r.codigo, `${r.codigo} — ${r.nombre}`]) },
    { key: 'generica', label: 'Genérica', options: data.genericas.map(g => [g.codigo, `${g.codigo} — ${g.nombre}`]) },
    { key: 'fuente', label: 'Fuente', options: data.fuentes.map(f => [f.codigo, `${f.codigo} — ${f.nombre}`]) },
    { key: 'finalidad', label: 'Finalidad', options: data.finalidades.map(f => [f.codigo, `${f.codigo} — ${f.nombre}`]) },
  ];

  const cuiOptions = React.useMemo(() => {
    const set = new Map();
    data.registros.forEach(r => { if (r.cui) set.set(r.cui, r.inversion); });
    return [...set.entries()];
  }, [data.registros]);

  const activeCount = Object.entries(filters).filter(([k, v]) => v && k !== 'q').length;

  return (
    <div className="panel" style={{marginBottom: 14}}>
      <div style={{padding: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end'}}>
        <div className="filter" style={{minWidth: 110, maxWidth: 110}}>
          <label>Año fiscal</label>
          <select value={data.anio} onChange={() => {}}>
            <option>{data.anio}</option>
            <option>2025</option>
            <option>2024</option>
          </select>
        </div>

        {filterDefs.map(f => (
          <div key={f.key} className="filter" style={{minWidth: 150, flex: '1 1 150px'}}>
            <label>{f.label}</label>
            <select value={filters[f.key] || ''} onChange={(e) => setFilters({...filters, [f.key]: e.target.value || null})}>
              <option value="">Todos</option>
              {f.options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </select>
          </div>
        ))}

        <div className="filter" style={{minWidth: 200, flex: '1 1 200px'}}>
          <label>CUI / Inversión</label>
          <select value={filters.cui || ''} onChange={(e) => setFilters({...filters, cui: e.target.value || null})}>
            <option value="">Todas</option>
            {cuiOptions.map(([cui, nom]) => (
              <option key={cui} value={cui}>{cui} — {nom.slice(0, 40)}…</option>
            ))}
          </select>
        </div>

        <div className="filter" style={{minWidth: 200, flex: '2 1 220px'}}>
          <label>Búsqueda libre</label>
          <input id="search-input" type="text" placeholder="Órgano, meta, finalidad, clasificador…"
                 value={filters.q || ''}
                 onChange={(e) => setFilters({...filters, q: e.target.value})} />
        </div>

        <button className="btn ghost"
                onClick={() => setFilters({})}
                style={{height: 30}}
                disabled={activeCount === 0 && !filters.q}>
          Limpiar
          {(activeCount > 0 || filters.q) && (
            <span style={{
              background: 'var(--accent)', color: 'white',
              fontSize: 10, padding: '0 5px', borderRadius: 8, marginLeft: 4
            }}>{activeCount + (filters.q ? 1 : 0)}</span>
          )}
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, FilterBar });
