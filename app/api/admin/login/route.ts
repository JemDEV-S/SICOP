import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const username = String(form.get("username") ?? "");
  const password = String(form.get("password") ?? "");
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const failed = await prisma.intentoLogin.count({ where: { ip, exitoso: false, creadoEn: { gte: since } } });
  if (failed >= 5) return Response.redirect(new URL("/login?error=1", request.url));

  const user = await prisma.usuario.findUnique({ where: { username } });
  const ok = Boolean(user?.activo && (await bcrypt.compare(password, user.passwordHash)));
  await prisma.intentoLogin.create({ data: { ip, username, exitoso: ok } });

  if (!ok || !user) return Response.redirect(new URL("/login?error=1", request.url));

  await Promise.all([
    prisma.usuario.update({ where: { id: user.id }, data: { ultimoAcceso: new Date() } }),
    prisma.auditoria.create({ data: { usuarioId: user.id, accion: "LOGIN", entidad: "usuarios", entidadId: String(user.id), ip, userAgent: request.headers.get("user-agent") } }),
  ]);
  await setSessionCookie(user.id);
  return Response.redirect(new URL("/admin", request.url));
}
