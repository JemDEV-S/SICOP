import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/url";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const { id } = await context.params;
  const cargaId = Number(id);
  const carga = await prisma.carga.findUnique({ where: { id: cargaId } });
  if (!carga || carga.estado !== "EXITOSA") return Response.redirect(absoluteUrl("/admin?restore=invalid", request));

  await prisma.$transaction([
    prisma.carga.updateMany({ where: { anoEje: carga.anoEje, esVigente: true }, data: { esVigente: false } }),
    prisma.carga.update({ where: { id: carga.id }, data: { esVigente: true } }),
    prisma.auditoria.create({ data: { usuarioId: user.id, accion: "CARGA_RESTAURADA", entidad: "cargas", entidadId: String(carga.id) } }),
  ]);

  return Response.redirect(absoluteUrl("/admin?restore=ok", request));
}
