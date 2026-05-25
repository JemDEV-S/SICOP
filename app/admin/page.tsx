import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Panel, Section, SicopShell } from "@/components/sicop/SicopShell";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ upload?: string; restore?: string; report?: string; message?: string; user?: string }>;
}) {
  const user = await requireAdmin();
  const params = (await searchParams) ?? {};
  const [cargas, usuarios, auditoria, reportes] = await Promise.all([
    prisma.carga.findMany({ orderBy: { creadoEn: "desc" }, take: 20 }),
    prisma.usuario.findMany({ orderBy: { creadoEn: "desc" }, select: { id: true, username: true, email: true, rol: true, activo: true } }),
    prisma.auditoria.findMany({ orderBy: { creadoEn: "desc" }, take: 12, include: { usuario: { select: { username: true } } } }),
    prisma.reporteDocumento.findMany({ orderBy: { creadoEn: "desc" }, take: 12, include: { usuario: { select: { nombreCompleto: true } } } }),
  ]);

  const vigente = cargas.find((carga) => carga.esVigente);
  const cargasExitosas = cargas.filter((carga) => carga.estado === "EXITOSA").length;
  const usuariosActivos = usuarios.filter((item) => item.activo).length;
  const cargasFallidas = cargas.filter((carga) => carga.estado === "FALLIDA").length;

  return (
    <SicopShell>
      <Section
        title="Panel administrativo"
        sub={`Sesión iniciada como ${user.nombreCompleto} · ${user.rol}`}
        tools={
          <form action="/api/admin/logout" method="post">
            <button className="rounded border border-[#2b3340] px-3 py-1 text-xs">Cerrar sesión</button>
          </form>
        }
      >
        {params.upload === "ok" ? <Notice tone="ok">Carga procesada y publicada.</Notice> : null}
        {params.upload === "invalid" ? <Notice tone="warn">Sube un archivo .xlsx válido.</Notice> : null}
        {params.upload === "error" ? <Notice tone="warn">No se pudo procesar la carga: {params.message}</Notice> : null}
        {params.restore === "ok" ? <Notice tone="ok">Carga restaurada como vigente.</Notice> : null}
        {params.user === "created" ? <Notice tone="ok">Usuario creado.</Notice> : null}
        {params.user === "updated" ? <Notice tone="ok">Usuario actualizado.</Notice> : null}
        {params.report === "ok" ? <Notice tone="ok">Reporte PDF publicado.</Notice> : null}
        {params.report === "deleted" ? <Notice tone="ok">Reporte retirado de la vista publica.</Notice> : null}
        {params.report === "invalid" ? <Notice tone="warn">Completa el titulo y sube un archivo PDF valido.</Notice> : null}
        {params.report === "large" ? <Notice tone="warn">El PDF supera el limite de 20 MB.</Notice> : null}

        <div className="admin-hero-grid">
          <AdminMetric
            label="Carga vigente"
            value={vigente?.nombreArchivo ?? "Sin carga"}
            detail={vigente?.procesadoEn ? `Procesada ${formatDateTime(vigente.procesadoEn)}` : "Todavía no hay una versión publicada"}
          />
          <AdminMetric label="Cargas exitosas" value={String(cargasExitosas)} detail={`${cargas.length} visibles en historial`} />
          <AdminMetric label="Usuarios activos" value={String(usuariosActivos)} detail={`${usuarios.length} cuentas registradas`} />
          <AdminMetric
            label="Alertas"
            value={String(cargasFallidas)}
            detail={cargasFallidas ? "Cargas fallidas por revisar" : "Sin cargas fallidas recientes"}
            tone={cargasFallidas ? "warn" : "ok"}
          />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel title="Actualizar datos">
            <div className="grid gap-3">
              <form action="/api/admin/cargas" method="post" encType="multipart/form-data" className="admin-upload">
                <input type="hidden" name="tipo" value="crudo" />
                <div>
                  <div className="text-base font-semibold">Excel crudo</div>
                  <p className="mt-2 max-w-xl text-sm text-[#8a93a6]">
                    Para el archivo exportado directamente del origen, como <strong>ReporteGasto (56).xls</strong>. El sistema deriva el clasificador y reutiliza los catálogos ya registrados.
                  </p>
                </div>
                <label className="admin-file-drop">
                  <span>Seleccionar archivo .xls o .xlsx</span>
                  <input name="file" type="file" accept=".xls,.xlsx" required />
                </label>
                <button className="admin-primary-button">Subir Excel crudo</button>
              </form>

              <form action="/api/admin/cargas" method="post" encType="multipart/form-data" className="admin-upload is-secondary">
                <input type="hidden" name="tipo" value="completo" />
                <div>
                  <div className="text-base font-semibold">Excel completo</div>
                  <p className="mt-2 max-w-xl text-sm text-[#8a93a6]">
                    Para el libro enriquecido con hojas auxiliares como <strong>RB</strong>, <strong>CG</strong>, <strong>SF</strong> y <strong>SheetGasto</strong>.
                  </p>
                </div>
                <label className="admin-file-drop">
                  <span>Seleccionar archivo .xlsx</span>
                  <input name="file" type="file" accept=".xlsx" required />
                </label>
                <button className="admin-secondary-button">Subir Excel completo</button>
              </form>
            </div>
          </Panel>

          <Panel title="Usuarios administradores">
            <div className="overflow-x-auto">
              <table className="sicop-table">
                <thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th></tr></thead>
                <tbody>
                  {usuarios.map((item) => (
                    <tr key={item.id}>
                      <td>{item.username}</td>
                      <td>{item.email}</td>
                      <td><span className="admin-pill">{item.rol}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`admin-status ${item.activo ? "is-ok" : "is-muted"}`}>{item.activo ? "Activo" : "Inactivo"}</span>
                          {user.rol === "SUPER_ADMIN" && item.id !== user.id ? (
                            <form action={`/api/admin/usuarios/${item.id}`} method="post">
                              <button className="rounded border border-[#2b3340] px-2 py-1 text-xs">
                                {item.activo ? "Desactivar" : "Activar"}
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {user.rol === "SUPER_ADMIN" ? (
              <form action="/api/admin/usuarios" method="post" className="mt-4 grid gap-2 md:grid-cols-2">
                <input name="username" placeholder="usuario" className="sicop-input" required />
                <input name="email" type="email" placeholder="correo" className="sicop-input" required />
                <input name="nombreCompleto" placeholder="nombre completo" className="sicop-input" required />
                <input name="password" type="password" placeholder="contraseña inicial" className="sicop-input" required />
                <select name="rol" className="sicop-input">
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                </select>
                <button className="admin-primary-button">Crear usuario</button>
              </form>
            ) : null}
          </Panel>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel title="Publicar reporte PDF">
            <form action="/api/admin/reportes" method="post" encType="multipart/form-data" className="admin-upload reports-admin-upload">
              <div>
                <div className="text-base font-semibold">Nuevo documento publico</div>
                <p className="mt-2 max-w-xl text-sm text-[#8a93a6]">
                  El archivo aparecera en la pestana Reportes para consulta publica. Usa titulos claros y descriptivos.
                </p>
              </div>
              <input name="titulo" placeholder="Titulo del reporte" className="sicop-input" maxLength={180} required />
              <textarea name="descripcion" placeholder="Descripcion breve" className="sicop-input admin-textarea" rows={3} />
              <label className="admin-file-drop">
                <span>Seleccionar archivo PDF</span>
                <input name="file" type="file" accept="application/pdf,.pdf" required />
              </label>
              <button className="admin-primary-button">Publicar PDF</button>
            </form>
          </Panel>

          <Panel title="Reportes publicados">
            <div className="overflow-x-auto">
              <table className="sicop-table">
                <thead><tr><th>Documento</th><th>Fecha</th><th>Estado</th><th className="sicop-num">Tamano</th><th>Accion</th></tr></thead>
                <tbody>
                  {reportes.map((reporte) => (
                    <tr key={reporte.id}>
                      <td className="sicop-cell-text">
                        <div className="font-medium">{reporte.titulo}</div>
                        <div className="mt-1 text-xs text-[#8a93a6]">{reporte.nombreArchivo}</div>
                      </td>
                      <td>{formatDateTime(reporte.creadoEn)}</td>
                      <td><span className={`admin-status ${reporte.publicado ? "is-ok" : "is-muted"}`}>{reporte.publicado ? "Publicado" : "Retirado"}</span></td>
                      <td className="sicop-num">{formatBytes(reporte.tamanoBytes)}</td>
                      <td>
                        {reporte.publicado ? (
                          <div className="flex items-center gap-2">
                            <a className="rounded border border-[#2b3340] px-2 py-1 text-xs" href={reporteHref(reporte.rutaPublica)} target="_blank" rel="noreferrer">Abrir</a>
                            <form action={`/api/admin/reportes/${reporte.id}`} method="post">
                              <button className="rounded border border-[#2b3340] px-2 py-1 text-xs">Retirar</button>
                            </form>
                          </div>
                        ) : "Retirado"}
                      </td>
                    </tr>
                  ))}
                  {!reportes.length ? (
                    <tr>
                      <td colSpan={5} className="sicop-cell-text">Todavia no hay reportes registrados.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          <Panel title="Historial de cargas">
            <div className="overflow-x-auto">
              <table className="sicop-table">
                <thead><tr><th>Archivo</th><th>Fecha</th><th>Estado</th><th className="sicop-num">Filas</th><th className="sicop-num">Registros</th><th>Acción</th></tr></thead>
                <tbody>
                  {cargas.map((carga) => (
                    <tr key={carga.id}>
                      <td>{carga.nombreArchivo}</td>
                      <td>{formatDateTime(carga.procesadoEn ?? carga.creadoEn)}</td>
                      <td>
                        <span className={`admin-status ${carga.estado === "EXITOSA" ? "is-ok" : carga.estado === "FALLIDA" ? "is-warn" : "is-muted"}`}>
                          {carga.estado}{carga.esVigente ? " · vigente" : ""}
                        </span>
                      </td>
                      <td className="sicop-num">{carga.totalFilas}</td>
                      <td className="sicop-num">{carga.totalRegistros}</td>
                      <td>
                        {!carga.esVigente && carga.estado === "EXITOSA" ? (
                          <form action={`/api/admin/cargas/${carga.id}/restaurar`} method="post">
                            <button className="rounded border border-[#2b3340] px-2 py-1 text-xs">Restaurar</button>
                          </form>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Bitácora reciente">
            <div className="admin-timeline">
              {auditoria.map((item) => (
                <div key={item.id.toString()} className="admin-timeline-item">
                  <span className="admin-timeline-dot" />
                  <div>
                    <div className="font-medium">{humanizeAction(item.accion)}</div>
                    <div className="text-xs text-[#8a93a6]">
                      {item.usuario?.username ?? "sistema"} · {item.entidad ?? "-"} #{item.entidadId ?? "-"}
                    </div>
                    <div className="mt-1 text-[11px] text-[#5d6678]">{formatDateTime(item.creadoEn)}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </Section>
    </SicopShell>
  );
}

function AdminMetric({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "ok" | "warn";
}) {
  return (
    <article className={`admin-metric ${tone !== "default" ? `is-${tone}` : ""}`}>
      <div className="admin-metric-label">{label}</div>
      <div className="admin-metric-value">{value}</div>
      <div className="admin-metric-detail">{detail}</div>
    </article>
  );
}

function Notice({ children, tone }: { children: React.ReactNode; tone: "ok" | "warn" }) {
  return (
    <div className={`mb-4 rounded border p-3 text-sm ${tone === "ok" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>
      {children}
    </div>
  );
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString("es-PE", { maximumFractionDigits: 1 })} MB`;
}

function reporteHref(rutaPublica: string) {
  if (rutaPublica.startsWith("/api/reportes/")) return rutaPublica;
  const filename = rutaPublica.split("/").filter(Boolean).at(-1);
  return filename ? `/api/reportes/${filename}` : rutaPublica;
}

function humanizeAction(action: string) {
  return action
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\w/, (char) => char.toUpperCase());
}
