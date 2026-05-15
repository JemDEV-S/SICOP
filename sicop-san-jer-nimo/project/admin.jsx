// admin.jsx — Login, carga de Excel, vista previa, historial

function AdminLogin({ onLogin }) {
  const [user, setUser] = React.useState('jvargas@munisanjeronimo.gob.pe');
  const [pass, setPass] = React.useState('');
  const [err, setErr] = React.useState(null);

  const submit = (e) => {
    e.preventDefault();
    if (!pass) { setErr('Ingrese su contraseña'); return; }
    onLogin({ email: user, nombre: 'Juan Vargas', rol: 'Administrador' });
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div style={{display:'flex', alignItems:'center', gap: 12, marginBottom: 24}}>
          <div className="brand-mark" style={{width: 40, height: 40, fontSize: 16}}>SJ</div>
          <div>
            <div style={{fontWeight: 600, fontSize: 14}}>SICOP San Jerónimo</div>
            <div className="muted" style={{fontSize: 11.5}}>Panel de administración</div>
          </div>
        </div>
        <div style={{fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em', marginBottom: 4}}>Ingrese a su cuenta</div>
        <div className="muted" style={{fontSize: 12, marginBottom: 24}}>Acceso restringido al equipo de Planeamiento y Presupuesto.</div>

        <div className="filter" style={{marginBottom: 14}}>
          <label>Usuario institucional</label>
          <input type="text" value={user} onChange={(e) => setUser(e.target.value)} />
        </div>
        <div className="filter" style={{marginBottom: 14}}>
          <label>Contraseña</label>
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" />
        </div>

        {err && <div className="badge low" style={{padding: '6px 10px', marginBottom: 14, fontFamily: 'var(--font-sans)'}}>{err}</div>}

        <button type="submit" className="btn primary" style={{width: '100%', justifyContent: 'center', padding: '10px'}}>
          Ingresar al panel
        </button>

        <div style={{marginTop: 18, fontSize: 11, color: 'var(--fg-muted)', textAlign:'center', lineHeight: 1.5}}>
          ¿Problemas para acceder? Comuníquese con la <br/>Sub Gerencia de Tecnologías de Información.
        </div>
      </form>

      <div style={{position:'fixed', bottom: 16, left: 0, right: 0, textAlign:'center', fontSize: 11, color: 'var(--fg-dim)'}}>
        Municipalidad Distrital de San Jerónimo · Cusco · 2026
      </div>
    </div>
  );
}

function AdminLayout({ user, onLogout, data, onUpload }) {
  const [tab, setTab] = React.useState('cargar');
  return (
    <div className="main">
      <Section
        title={'Bienvenido, ' + user.nombre.split(' ')[0]}
        sub="Panel de administración — carga, validación y mantenimiento de información presupuestal"
        tools={
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <span className="muted tiny" style={{textTransform:'none'}}>{user.email}</span>
            <button className="btn ghost" onClick={onLogout}>Cerrar sesión</button>
          </div>
        }>

        <div className="tabs" style={{marginBottom: 16}}>
          {[
            ['cargar', 'Cargar Excel'],
            ['historial', 'Historial de cargas'],
            ['editar', 'Editar registros'],
            ['unidades', 'Unidades orgánicas'],
            ['mapeo', 'Mapeo metas / CUI'],
          ].map(([k, l]) => (
            <div key={k} className={'tab' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>{l}</div>
          ))}
        </div>

        {tab === 'cargar' && <CargaExcel data={data} onUpload={onUpload} />}
        {tab === 'historial' && <HistorialCargas data={data} />}
        {tab === 'editar' && <EditarRegistros data={data} />}
        {tab === 'unidades' && <AdminUnidades data={data} />}
        {tab === 'mapeo' && <MapeoMetas data={data} />}
      </Section>
    </div>
  );
}

// ============== CARGA EXCEL — multi-step ==============
function CargaExcel({ data, onUpload }) {
  // Steps: idle -> uploading -> validating -> preview -> importing -> done
  const [step, setStep] = React.useState('idle');
  const [progress, setProgress] = React.useState(0);
  const [filename, setFilename] = React.useState(null);
  const [over, setOver] = React.useState(false);
  const fileRef = React.useRef();

  const startUpload = (fname) => {
    setFilename(fname || 'ReporteGasto_13.05.26.xlsx');
    setStep('uploading');
    setProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p += 15 + Math.random() * 20;
      setProgress(Math.min(100, p));
      if (p >= 100) {
        clearInterval(t);
        setTimeout(() => { setStep('validating'); setProgress(0); runValidation(); }, 200);
      }
    }, 180);
  };

  const runValidation = () => {
    let p = 0;
    const t = setInterval(() => {
      p += 8 + Math.random() * 15;
      setProgress(Math.min(100, p));
      if (p >= 100) {
        clearInterval(t);
        setTimeout(() => setStep('preview'), 200);
      }
    }, 200);
  };

  const confirmImport = () => {
    setStep('importing');
    setProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p += 8 + Math.random() * 12;
      setProgress(Math.min(100, p));
      if (p >= 100) {
        clearInterval(t);
        setTimeout(() => setStep('done'), 200);
      }
    }, 180);
  };

  const reset = () => { setStep('idle'); setProgress(0); setFilename(null); };

  // Mock validation results
  const previewSummary = {
    archivo: filename || 'ReporteGasto_13.05.26.xlsx',
    anio: 2026,
    filas: 1248,
    nuevos: 12,
    existentes: 1236,
    advertencias: [
      { tipo: 'warn', txt: '3 registros con CUI no reconocido en catálogo: CUI-2768122, CUI-2768855, CUI-2768901' },
      { tipo: 'warn', txt: '1 meta sin unidad responsable asignada (Meta 0148): asignar antes de importar' },
      { tipo: 'info', txt: 'Hoja SheetGasto detectada · 1.248 filas · 87 columnas' },
      { tipo: 'info', txt: 'Hoja PRINCIPAL detectada como referencia · 312 filas' },
    ],
    estado: 'observado',
  };

  return (
    <div style={{display:'flex', flexDirection:'column', gap: 14}}>
      <Stepper current={
        step === 'idle' ? 0 :
        step === 'uploading' ? 1 :
        step === 'validating' ? 2 :
        step === 'preview' ? 3 :
        step === 'importing' ? 4 :
        5
      } />

      {step === 'idle' && (
        <Panel title="Cargar archivo Excel del SIAF Web">
          <div className={'dropzone' + (over ? ' over' : '')}
               onDragOver={(e) => { e.preventDefault(); setOver(true); }}
               onDragLeave={() => setOver(false)}
               onDrop={(e) => { e.preventDefault(); setOver(false); startUpload(e.dataTransfer.files[0]?.name); }}
               onClick={() => fileRef.current?.click()}>
            <svg className="drop-icon" viewBox="0 0 48 48" fill="none">
              <rect x="8" y="6" width="32" height="40" rx="3" stroke="currentColor" strokeWidth="1.5" fill="var(--bg-elev-2)" />
              <path d="M16 22h16M16 28h16M16 34h10" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="36" cy="36" r="9" fill="var(--ok)" />
              <path d="M32 36h8M36 32v8" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div style={{fontSize: 14, fontWeight: 500, marginBottom: 6}}>
              Arrastre el reporte Excel del SIAF Web o haga clic para seleccionar
            </div>
            <div className="muted" style={{fontSize: 12}}>
              Formato esperado: <span className="mono">ReporteGasto_dd.mm.yy.xlsx</span> · Hojas <span className="mono">SheetGasto</span> + <span className="mono">PRINCIPAL</span>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{display:'none'}}
                   onChange={(e) => startUpload(e.target.files[0]?.name)} />
            <button className="btn primary" style={{marginTop: 18}} onClick={(e) => { e.stopPropagation(); startUpload(); }}>
              Seleccionar archivo
            </button>
          </div>

          <div style={{marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14}}>
            <div className="panel" style={{padding: 12}}>
              <div className="upper" style={{marginBottom: 6}}>Hoja fuente</div>
              <div style={{fontFamily:'var(--font-mono)', fontSize: 12.5}}>SheetGasto</div>
              <div className="muted" style={{fontSize: 11, marginTop: 4, lineHeight: 1.45}}>Hoja base de datos. Usada para importar los registros presupuestales.</div>
            </div>
            <div className="panel" style={{padding: 12}}>
              <div className="upper" style={{marginBottom: 6}}>Hoja referencia</div>
              <div style={{fontFamily:'var(--font-mono)', fontSize: 12.5}}>PRINCIPAL</div>
              <div className="muted" style={{fontSize: 11, marginTop: 4, lineHeight: 1.45}}>Usada como referencia visual para el reporte principal jerárquico.</div>
            </div>
            <div className="panel" style={{padding: 12}}>
              <div className="upper" style={{marginBottom: 6}}>Última carga válida</div>
              <div className="mono" style={{fontSize: 12.5}}>{data.ultimaCarga}</div>
              <div className="muted" style={{fontSize: 11, marginTop: 4, lineHeight: 1.45}}>{data.archivo}</div>
            </div>
          </div>
        </Panel>
      )}

      {(step === 'uploading' || step === 'validating' || step === 'importing') && (
        <Panel title={
          step === 'uploading' ? 'Cargando archivo…' :
          step === 'validating' ? 'Validando estructura y consistencia…' :
          'Importando registros…'
        }>
          <div style={{display:'flex', alignItems:'center', gap: 16}}>
            <div className="mono" style={{fontSize: 12, color: 'var(--fg-muted)', minWidth: 80}}>{Math.round(progress)}%</div>
            <div style={{flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow:'hidden'}}>
              <div style={{
                width: progress + '%',
                height: '100%',
                background: 'var(--accent)',
                transition: 'width 0.2s',
              }}></div>
            </div>
          </div>
          <div className="mono" style={{fontSize: 11, color: 'var(--fg-muted)', marginTop: 14}}>
            {step === 'uploading' && '> Recibiendo ' + filename + '…'}
            {step === 'validating' && (
              <div style={{display:'flex', flexDirection:'column', gap: 4}}>
                <div>✓ Hoja <span style={{color:'var(--fg)'}}>SheetGasto</span> encontrada</div>
                <div>✓ Hoja <span style={{color:'var(--fg)'}}>PRINCIPAL</span> encontrada</div>
                <div>✓ Columnas obligatorias presentes</div>
                <div>✓ Año fiscal detectado: <span style={{color:'var(--fg)'}}>2026</span></div>
                <div>{progress > 60 ? '✓' : '⋯'} Validando montos y porcentajes…</div>
                <div>{progress > 85 ? '✓' : '⋯'} Detectando duplicados…</div>
              </div>
            )}
            {step === 'importing' && (
              <div style={{display:'flex', flexDirection:'column', gap: 4}}>
                <div>✓ Backup creado</div>
                <div>{progress > 30 ? '✓' : '⋯'} Procesando {Math.round((progress/100) * 1248)} / 1.248 filas</div>
                <div>{progress > 70 ? '✓' : '⋯'} Recalculando indicadores agregados</div>
              </div>
            )}
          </div>
        </Panel>
      )}

      {step === 'preview' && (
        <PreviewImportacion summary={previewSummary} onConfirm={confirmImport} onCancel={reset} />
      )}

      {step === 'done' && (
        <Panel title="Importación completada">
          <div style={{padding: 8, display: 'flex', flexDirection:'column', alignItems:'center', gap: 14, textAlign:'center'}}>
            <div style={{width: 56, height: 56, borderRadius: '50%', background:'var(--ok-soft)', display:'grid', placeItems:'center', border:'2px solid var(--ok)'}}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--ok)" strokeWidth="2.5"><path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div>
              <div style={{fontSize: 16, fontWeight: 600}}>Importación finalizada correctamente</div>
              <div className="muted" style={{fontSize: 12.5, marginTop: 4}}>
                12 registros creados · 1.236 actualizados · 0 errores · Dashboard público actualizado
              </div>
            </div>
            <div style={{display: 'flex', gap: 8, marginTop: 6}}>
              <button className="btn" onClick={reset}>Cargar otro archivo</button>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}

function Stepper({ current }) {
  const steps = ['Cargar', 'Validar', 'Vista previa', 'Importar'];
  // current is 0..5 — map to step idx
  const stepIdx = current <= 1 ? 0 : current === 2 ? 1 : current === 3 ? 2 : current >= 4 ? 3 : 0;
  const done = current >= 5;
  return (
    <div style={{display:'flex', gap: 0, padding: 12, background:'var(--panel)', border:'1px solid var(--border)', borderRadius: 'var(--radius)'}}>
      {steps.map((s, i) => (
        <div key={i} style={{flex: 1, display:'flex', alignItems:'center', gap: 8}}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: i < stepIdx || done ? 'var(--ok)' : i === stepIdx ? 'var(--accent)' : 'var(--bg-elev-2)',
            border: '1px solid ' + (i <= stepIdx || done ? 'transparent' : 'var(--border-strong)'),
            display:'grid', placeItems:'center', fontSize: 11, color: i <= stepIdx || done ? 'white' : 'var(--fg-muted)',
            fontFamily: 'var(--font-mono)',
            flexShrink: 0,
          }}>
            {(i < stepIdx || done) ? '✓' : i + 1}
          </div>
          <div style={{fontSize: 12, fontWeight: 500, color: i === stepIdx ? 'var(--fg)' : 'var(--fg-muted)'}}>{s}</div>
          {i < steps.length - 1 && <div style={{flex: 1, height: 1, background: i < stepIdx || done ? 'var(--ok)' : 'var(--border)', margin: '0 12px'}}></div>}
        </div>
      ))}
    </div>
  );
}

function PreviewImportacion({ summary, onConfirm, onCancel }) {
  return (
    <Panel title="Vista previa de la importación"
           tools={
             <span className={'badge ' + (summary.estado === 'apto' ? 'high' : summary.estado === 'observado' ? 'mid' : 'low')}
                   style={{fontFamily:'var(--font-sans)', fontSize: 11}}>
               <span className={'dot ' + (summary.estado === 'apto' ? 'high' : summary.estado === 'observado' ? 'mid' : 'low')}></span>
               {summary.estado === 'apto' ? 'Apto para importar' : summary.estado === 'observado' ? 'Importable con observaciones' : 'Con errores'}
             </span>
           }>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow:'hidden', marginBottom: 16}}>
        <SumCell label="Archivo" value={summary.archivo} mono tiny />
        <SumCell label="Año fiscal" value={summary.anio} />
        <SumCell label="Filas leídas" value={summary.filas.toLocaleString('es-PE')} />
        <SumCell label="Registros nuevos" value={'+' + summary.nuevos} accent="var(--ok)" />
        <SumCell label="A actualizar" value={summary.existentes.toLocaleString('es-PE')} accent="var(--accent)" />
      </div>

      <div className="upper" style={{marginBottom: 8}}>Observaciones y validaciones</div>
      <div style={{display:'flex', flexDirection:'column', gap: 6, marginBottom: 16}}>
        {summary.advertencias.map((a, i) => (
          <div key={i} style={{
            display:'flex', gap: 10, padding: '8px 12px',
            background: a.tipo === 'warn' ? 'var(--warn-soft)' : a.tipo === 'err' ? 'var(--danger-soft)' : 'var(--bg-elev-2)',
            borderLeft: '2px solid ' + (a.tipo === 'warn' ? 'var(--warn)' : a.tipo === 'err' ? 'var(--danger)' : 'var(--accent)'),
            borderRadius: 'var(--radius-sm)',
            fontSize: 12, alignItems: 'flex-start',
          }}>
            <span style={{
              color: a.tipo === 'warn' ? 'var(--warn)' : a.tipo === 'err' ? 'var(--danger)' : 'var(--accent)',
              fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase',
              flexShrink: 0, minWidth: 50,
            }}>
              {a.tipo === 'warn' ? 'Aviso' : a.tipo === 'err' ? 'Error' : 'Info'}
            </span>
            <span style={{flex: 1, color: 'var(--fg)', lineHeight: 1.4}}>{a.txt}</span>
          </div>
        ))}
      </div>

      <div style={{display:'flex', gap: 8, justifyContent:'flex-end'}}>
        <button className="btn ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn primary" onClick={onConfirm}>Confirmar importación</button>
      </div>
    </Panel>
  );
}

function SumCell({ label, value, accent, mono, tiny }) {
  return (
    <div style={{background:'var(--panel)', padding: '10px 12px'}}>
      <div className="upper" style={{marginBottom: 4}}>{label}</div>
      <div className={(mono ? 'mono' : '') + ' num'} style={{
        fontSize: tiny ? 11.5 : 14, color: accent || 'var(--fg)',
        fontWeight: 500,
        wordBreak: 'break-all',
      }}>{value}</div>
    </div>
  );
}

// ============== HISTORIAL DE CARGAS ==============
function HistorialCargas({ data }) {
  return (
    <Panel title="Historial de cargas" bodyStyle={{padding: 0}}>
      <table className="data">
        <thead>
          <tr>
            <th>Archivo</th>
            <th>Fecha</th>
            <th>Usuario</th>
            <th className="num">Año</th>
            <th className="num">Filas</th>
            <th className="num">Creados</th>
            <th className="num">Actualizados</th>
            <th className="num">Errores</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {data.historial.map(h => (
            <tr key={h.id}>
              <td><span className="mono" style={{fontSize: 11.5}}>{h.archivo}</span></td>
              <td className="num muted">{h.fecha}</td>
              <td style={{maxWidth: 220, overflow:'hidden', textOverflow:'ellipsis'}}>{h.usuario}</td>
              <td className="num">{h.anio}</td>
              <td className="num">{h.filas.toLocaleString('es-PE')}</td>
              <td className="num" style={{color: h.creados > 0 ? 'var(--ok)' : 'var(--fg-muted)'}}>+{h.creados}</td>
              <td className="num">{h.actualizados.toLocaleString('es-PE')}</td>
              <td className="num" style={{color: h.errores > 0 ? 'var(--danger)' : 'var(--fg-muted)'}}>{h.errores}</td>
              <td>
                <span className={'badge ' + (h.estado === 'procesado' ? 'high' : h.estado === 'observado' ? 'mid' : 'low')}
                      style={{fontFamily:'var(--font-sans)'}}>
                  <span className={'dot ' + (h.estado === 'procesado' ? 'high' : h.estado === 'observado' ? 'mid' : 'low')}></span>
                  {h.estado.charAt(0).toUpperCase() + h.estado.slice(1)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

// ============== EDITAR REGISTROS ==============
function EditarRegistros({ data }) {
  const [q, setQ] = React.useState('');
  const [editing, setEditing] = React.useState(null);

  const rows = data.registros.filter(r => {
    if (!q) return true;
    return [r.unidadNom, r.finNom, r.clasifNom, r.meta, r.cui].filter(Boolean).join(' ').toLowerCase().includes(q.toLowerCase());
  }).slice(0, 30);

  return (
    <Panel title="Edición manual de registros"
           tools={
             <input type="text" placeholder="Buscar registro…"
                    value={q} onChange={(e) => setQ(e.target.value)}
                    style={{background:'var(--bg-elev-2)', border:'1px solid var(--border-strong)', padding:'5px 10px', borderRadius:4, width: 220}} />
           }
           bodyStyle={{padding: 0}}>
      <div className="table-wrap" style={{maxHeight: 540, overflow:'auto'}}>
        <table className="data">
          <thead>
            <tr>
              <th>ID</th>
              <th>Unidad</th>
              <th>Finalidad</th>
              <th>Clasificador</th>
              <th>CUI</th>
              <th className="num">PIM</th>
              <th className="num">Devengado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td className="mono dim">{String(r.id).padStart(5,'0')}</td>
                <td>{r.unidadNom}</td>
                <td style={{maxWidth: 260, overflow:'hidden', textOverflow:'ellipsis'}}>{r.finNom}</td>
                <td className="mono" style={{fontSize:11}}>{r.clasifCod}</td>
                <td className="mono" style={{color:'var(--accent)'}}>{r.cui || '—'}</td>
                <td className="num">{fmtMoney(r.pim)}</td>
                <td className="num">{fmtMoney(r.dev)}</td>
                <td>
                  <button className="btn ghost" style={{padding: '3px 8px', fontSize: 11}}
                          onClick={() => setEditing(r)}>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && <EditModal record={editing} onClose={() => setEditing(null)} />}
    </Panel>
  );
}

function EditModal({ record, onClose }) {
  const [r, setR] = React.useState(record);
  return (
    <div style={{position:'fixed', inset: 0, background:'rgba(0,0,0,0.55)', zIndex: 50, display:'grid', placeItems:'center'}}
         onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           style={{width: 560, background:'var(--panel)', border:'1px solid var(--border-strong)', borderRadius: 'var(--radius-lg)', boxShadow:'var(--shadow-lg)', maxHeight: '85vh', overflow:'auto'}}>
        <div style={{padding: '14px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <div style={{fontSize: 14, fontWeight: 600}}>Editar registro presupuestal</div>
            <div className="muted mono" style={{fontSize: 11}}>ID {String(r.id).padStart(5,'0')} · {r.unidadNom}</div>
          </div>
          <button className="btn ghost" onClick={onClose}>Cerrar</button>
        </div>
        <div style={{padding: 18, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12}}>
          {[
            ['meta','Meta'],['finCod','Finalidad'],['cui','CUI'],['clasifCod','Clasificador'],
            ['pia','PIA',true],['pim','PIM',true],['cert','Certificación',true],['comp','Compromiso anual',true],
            ['dev','Devengado',true],['gir','Girado',true],
          ].map(([k, l, num]) => (
            <div key={k} className="filter">
              <label>{l}</label>
              <input type={num ? 'number' : 'text'}
                     value={r[k] || ''}
                     onChange={(e) => setR({...r, [k]: num ? Number(e.target.value) : e.target.value})} />
            </div>
          ))}
        </div>
        <div style={{padding: '12px 18px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap: 8}}>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={onClose}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}

// ============== UNIDADES ORGÁNICAS ==============
function AdminUnidades({ data }) {
  return (
    <Panel title="Unidades orgánicas" bodyStyle={{padding: 0}}>
      <table className="data">
        <thead><tr><th>Código</th><th>Nombre</th><th>Padre</th><th>Nivel</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {data.organos.map(o => {
            const padre = data.organos.find(p => p.codigo === o.padre);
            return (
              <tr key={o.codigo}>
                <td className="mono" style={{fontSize: 11.5}}>{o.codigo}</td>
                <td style={{fontWeight: o.nivel === 'organo' ? 600 : 400}}>{o.nombre}</td>
                <td className="muted">{padre ? padre.nombre : '—'}</td>
                <td><span className="badge neutral">{o.nivel}</span></td>
                <td><span className="badge high"><span className="dot high"></span>Activa</span></td>
                <td><button className="btn ghost" style={{padding:'3px 8px', fontSize: 11}}>Editar</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  );
}

function MapeoMetas({ data }) {
  const conCUI = data.registros.filter(r => r.cui);
  const unique = [...new Map(conCUI.map(r => [r.cui, r])).values()];
  return (
    <Panel title="Mapeo de metas y CUI con unidades responsables" bodyStyle={{padding: 0}}>
      <div style={{padding: '10px 14px', borderBottom:'1px solid var(--border)', fontSize: 12, color: 'var(--fg-muted)'}}>
        Asocie cada meta o CUI con la unidad responsable cuando el Excel no la identifique claramente.
      </div>
      <table className="data">
        <thead><tr><th>CUI</th><th>Inversión</th><th>Meta</th><th>Unidad responsable</th><th>UEI</th><th></th></tr></thead>
        <tbody>
          {unique.map(r => (
            <tr key={r.cui}>
              <td className="mono" style={{color:'var(--accent)'}}>{r.cui}</td>
              <td style={{maxWidth: 320, whiteSpace:'normal', lineHeight: 1.3, paddingTop: 6, paddingBottom: 6}}>{r.inversion}</td>
              <td className="mono">{r.meta}</td>
              <td>{r.unidadNom}</td>
              <td className="muted">{r.uei}</td>
              <td><button className="btn ghost" style={{padding:'3px 8px', fontSize: 11}}>Reasignar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

Object.assign(window, { AdminLogin, AdminLayout });
