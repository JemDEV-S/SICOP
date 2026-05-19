import { clearSessionCookie, getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/url";

export async function POST(request: Request) {
  const user = await getCurrentAdmin();
  if (user) {
    await prisma.auditoria.create({ data: { usuarioId: user.id, accion: "LOGOUT", entidad: "usuarios", entidadId: String(user.id) } });
  }
  await clearSessionCookie();
  return Response.redirect(absoluteUrl("/login", request));
}
