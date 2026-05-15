// app.jsx — Main app shell

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "density": "regular",
  "semaforoBadges": true,
  "accent": "#5b8def",
  "showAdminToggle": true
}/*EDITMODE-END*/;

function App() {
  const data = window.SICOP_DATA;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = React.useState('dashboard'); // dashboard | principal | mensual | inversiones | admin
  const [filters, setFilters] = React.useState({});
  const [adminUser, setAdminUser] = React.useState(null);
  const [toast, setToast] = React.useState(null);

  // Apply theme + density via data attrs on root
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', t.theme);
    document.documentElement.setAttribute('data-density', t.density);
    document.documentElement.style.setProperty('--accent', t.accent);
  }, [t.theme, t.density, t.accent]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        if (e.key === 'Escape') e.target.blur();
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      } else if (e.key === 'Escape') {
        setFilters({});
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const showAdmin = view === 'admin';
  const inAdminApp = showAdmin && adminUser;

  // Filters visibility — only when in a public view
  const showSidebar = !showAdmin;

  return (
    <>
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">SJ</div>
          <div>
            <div className="brand-title">SICOP <span style={{fontWeight: 400, color: 'var(--fg-muted)'}}>San Jerónimo</span></div>
            <div className="brand-sub">Consulta Presupuestal · {data.anio}</div>
          </div>
        </div>

        {!showAdmin && (
          <nav className="nav">
            <div className={'nav-item' + (view === 'dashboard' ? ' active' : '')} onClick={() => setView('dashboard')}>Dashboard</div>
            <div className={'nav-item' + (view === 'principal' ? ' active' : '')} onClick={() => setView('principal')}>Reporte principal</div>
            <div className={'nav-item' + (view === 'mensual' ? ' active' : '')} onClick={() => setView('mensual')}>Ejecución mensual</div>
            <div className={'nav-item' + (view === 'inversiones' ? ' active' : '')} onClick={() => setView('inversiones')}>Inversiones</div>
          </nav>
        )}

        <div className="header-spacer"></div>

        <div className="header-meta">
          {!showAdmin && (
            <>
              <span className="muted">
                <span className="live-dot" style={{display: 'inline-block', marginRight: 6, verticalAlign: 'middle'}}></span>
                Datos al <span className="num" style={{color: 'var(--fg)', marginLeft: 4}}>13/05/2026 08:30</span>
              </span>
            </>
          )}
          {t.showAdminToggle && (
            <button className={'btn ' + (showAdmin ? 'primary' : 'ghost')} onClick={() => setView(showAdmin ? 'dashboard' : 'admin')}>
              {showAdmin ? 'Volver al portal público' : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" strokeLinejoin="round" /></svg>
                  Acceso administrativo
                </>
              )}
            </button>
          )}
        </div>
      </header>

      <div className="app-body">
        {showSidebar && <Sidebar data={data} filters={filters} setFilters={setFilters} />}

        {!showAdmin && (
          <main className="main">
            {view === 'dashboard' && <Dashboard data={data} filters={filters} setFilters={setFilters} />}
            {view === 'principal' && (
              <Section title="Reporte principal jerárquico"
                       sub="Estructura Finalidad → Rubro → Clasificador — Equivalente a la hoja PRINCIPAL del SIAF">
                <FilterBar data={data} filters={filters} setFilters={setFilters} />
                <ReportePrincipal data={data} rows={applyFilters(data.registros, filters)} filters={filters} setFilters={setFilters} />
              </Section>
            )}
            {view === 'mensual' && <ReporteMensual data={data} filters={filters} setFilters={setFilters} />}
            {view === 'inversiones' && <ReporteInversiones data={data} filters={filters} setFilters={setFilters} />}
          </main>
        )}

        {showAdmin && !adminUser && (
          <AdminLogin onLogin={(u) => { setAdminUser(u); setToast({type:'ok', msg:'Sesión iniciada como ' + u.nombre}); setTimeout(() => setToast(null), 3000); }} />
        )}

        {inAdminApp && (
          <AdminLayout user={adminUser} onLogout={() => { setAdminUser(null); setView('dashboard'); }} data={data} />
        )}
      </div>

      {toast && (
        <div className="toast">
          <span className="dot high"></span>
          <span>{toast.msg}</span>
        </div>
      )}

      <TweaksPanel>
        <TweakSection label="Apariencia" />
        <TweakRadio label="Tema" value={t.theme} options={['dark', 'light']}
                    onChange={(v) => setTweak('theme', v)} />
        <TweakRadio label="Densidad" value={t.density} options={['compact', 'regular', 'comfy']}
                    onChange={(v) => setTweak('density', v)} />
        <TweakColor label="Color de acento" value={t.accent}
                    options={['#5b8def', '#22c55e', '#e6a23c', '#c5333a', '#8c5fd1']}
                    onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Comportamiento" />
        <TweakToggle label="Mostrar acceso administrativo" value={t.showAdminToggle}
                     onChange={(v) => setTweak('showAdminToggle', v)} />
        <TweakToggle label="Semáforo en KPIs (badge color)" value={t.semaforoBadges}
                     onChange={(v) => setTweak('semaforoBadges', v)} />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
