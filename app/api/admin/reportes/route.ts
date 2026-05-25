import { writeFile } from "fs/promises";
import { join } from "path";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureReportesUploadDir, sanitizePdfName } from "@/lib/reportes-storage";
import { absoluteUrl } from "@/lib/url";

const MAX_PDF_SIZE = 20 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await requireAdmin();
  const form = await request.formData();
  const file = form.get("file");
  const titulo = String(form.get("titulo") ?? "").trim();
  const descripcion = String(form.get("descripcion") ?? "").trim();

  if (!(file instanceof File) || !titulo || file.type !== "application/pdf" || !/\.pdf$/i.test(file.name)) {
    return Response.redirect(absoluteUrl("/admin?report=invalid", request));
  }

  if (file.size > MAX_PDF_SIZE) {
    return Response.redirect(absoluteUrl("/admin?report=large", request));
  }

  const uploadDir = await ensureReportesUploadDir();

  const safeName = sanitizePdfName(file.name);
  const storedName = `${Date.now()}-${safeName || "reporte"}.pdf`;
  const publicPath = `/api/reportes/${storedName}`;

  await writeFile(join(uploadDir, storedName), Buffer.from(await file.arrayBuffer()));

  const reporte = await prisma.reporteDocumento.create({
    data: {
      titulo,
      descripcion: descripcion || null,
      nombreArchivo: file.name,
      rutaPublica: publicPath,
      mimeType: file.type,
      tamanoBytes: file.size,
      usuarioId: user.id,
    },
  });

  await prisma.auditoria.create({
    data: {
      usuarioId: user.id,
      accion: "REPORTE_CREADO",
      entidad: "reportes_documentos",
      entidadId: String(reporte.id),
      detalle: { titulo, nombreArchivo: file.name, tamanoBytes: file.size, uploadDir },
    },
  });

  return Response.redirect(absoluteUrl("/admin?report=ok", request));
}
