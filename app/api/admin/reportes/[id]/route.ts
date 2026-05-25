import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/url";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const { id } = await params;
  const reporteId = Number(id);

  if (!Number.isInteger(reporteId)) {
    return Response.redirect(absoluteUrl("/admin?report=invalid", request));
  }

  const reporte = await prisma.reporteDocumento.update({
    where: { id: reporteId },
    data: { publicado: false },
  });

  await prisma.auditoria.create({
    data: {
      usuarioId: user.id,
      accion: "REPORTE_ELIMINADO",
      entidad: "reportes_documentos",
      entidadId: String(reporte.id),
      detalle: { titulo: reporte.titulo, nombreArchivo: reporte.nombreArchivo },
    },
  });

  return Response.redirect(absoluteUrl("/admin?report=deleted", request));
}
