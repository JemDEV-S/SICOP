import { prisma } from "@/lib/db";
import { Panel, Section, SicopShell } from "@/components/sicop/SicopShell";

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
  const reportes = await prisma.reporteDocumento.findMany({
    where: { publicado: true },
    orderBy: { creadoEn: "desc" },
    include: { usuario: { select: { nombreCompleto: true } } },
  });
  const totalBytes = reportes.reduce((total, item) => total + item.tamanoBytes, 0);

  return (
    <SicopShell>
      <Section
        title="Reportes"
        sub="Documentos institucionales publicados para consulta ciudadana"
        tools={<span className="rounded border border-[#2b3340] px-2 py-1 text-xs text-[var(--fg-muted)]">{reportes.length} PDF publicados</span>}
      >
        <div className="reports-showcase">
          <div className="reports-showcase-main">
            <div className="reports-kicker">Biblioteca publica</div>
            <p>
              Consulta los documentos oficiales en formato PDF. Cada archivo publicado desde administracion queda disponible aqui con acceso directo.
            </p>
          </div>
          <div className="reports-stat">
            <span>{reportes.length}</span>
            <small>documentos</small>
          </div>
          <div className="reports-stat">
            <span>{formatBytes(totalBytes)}</span>
            <small>en archivos</small>
          </div>
        </div>

        <div className="mt-4">
          <Panel title="Documentos disponibles">
            {reportes.length ? (
              <div className="reports-grid">
                {reportes.map((reporte, index) => (
                  <article className="report-card" key={reporte.id}>
                    <div className="report-card-topline">
                      <span className="report-file-mark">PDF</span>
                      <span>{formatDate(reporte.creadoEn)}</span>
                    </div>
                    <h2>{reporte.titulo}</h2>
                    <p>{reporte.descripcion || "Documento publicado para descarga y revision publica."}</p>
                    <div className="report-card-meta">
                      <span>{formatBytes(reporte.tamanoBytes)}</span>
                      <span>{reporte.usuario?.nombreCompleto ?? "Administracion"}</span>
                    </div>
                    <div className="report-card-footer">
                      <span>#{String(index + 1).padStart(2, "0")}</span>
                      <a href={reporteHref(reporte.rutaPublica)} target="_blank" rel="noreferrer">
                        Abrir PDF
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="reports-empty">
                <div className="report-file-mark">PDF</div>
                <h2>No hay reportes publicados</h2>
                <p>Cuando administracion suba documentos PDF, apareceran en esta biblioteca publica.</p>
              </div>
            )}
          </Panel>
        </div>
      </Section>
    </SicopShell>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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
