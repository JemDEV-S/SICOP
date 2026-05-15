import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin();
  if (actor.rol !== "SUPER_ADMIN") return new Response("Forbidden", { status: 403 });
  const { id } = await context.params;
  const userId = Number(id);
  if (userId === actor.id) return Response.redirect(new URL("/admin?user=self", request.url));

  const user = await prisma.usuario.findUnique({ where: { id: userId } });
  if (!user) return Response.redirect(new URL("/admin?user=missing", request.url));

  await prisma.$transaction([
    prisma.usuario.update({ where: { id: user.id }, data: { activo: !user.activo } }),
    prisma.auditoria.create({
      data: {
        usuarioId: actor.id,
        accion: user.activo ? "USUARIO_DESACTIVADO" : "USUARIO_ACTUALIZADO",
        entidad: "usuarios",
        entidadId: String(user.id),
      },
    }),
  ]);

  return Response.redirect(new URL("/admin?user=updated", request.url));
}
