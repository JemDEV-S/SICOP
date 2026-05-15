import { clearSessionCookie, getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getCurrentAdmin();
  if (user) {
    await prisma.auditoria.create({ data: { usuarioId: user.id, accion: "LOGOUT", entidad: "usuarios", entidadId: String(user.id) } });
  }
  await clearSessionCookie();
  return Response.redirect(new URL("/login", request.url));
}
