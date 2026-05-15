import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const { id } = await context.params;
  const cargaId = Number(id);
  const carga = await prisma.carga.findUnique({ where: { id: cargaId } });
  if (!carga || carga.estado !== "EXITOSA") return Response.redirect(new URL("/admin?restore=invalid", request.url));

  await prisma.$transaction([
    prisma.carga.updateMany({ where: { anoEje: carga.anoEje, esVigente: true }, data: { esVigente: false } }),
    prisma.carga.update({ where: { id: carga.id }, data: { esVigente: true } }),
    prisma.auditoria.create({ data: { usuarioId: user.id, accion: "CARGA_RESTAURADA", entidad: "cargas", entidadId: String(carga.id) } }),
  ]);

  return Response.redirect(new URL("/admin?restore=ok", request.url));
}
