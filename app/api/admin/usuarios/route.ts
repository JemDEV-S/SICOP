import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/url";

export async function POST(request: Request) {
  const actor = await requireAdmin();
  if (actor.rol !== "SUPER_ADMIN") return new Response("Forbidden", { status: 403 });

  const form = await request.formData();
  const username = String(form.get("username") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const nombreCompleto = String(form.get("nombreCompleto") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const rol = form.get("rol") === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN";

  if (!username || !email || !nombreCompleto || password.length < 8) {
    return Response.redirect(absoluteUrl("/admin?user=invalid", request));
  }

  const user = await prisma.usuario.create({
    data: {
      username,
      email,
      nombreCompleto,
      passwordHash: await bcrypt.hash(password, 12),
      rol,
    },
  });
  await prisma.auditoria.create({
    data: { usuarioId: actor.id, accion: "USUARIO_CREADO", entidad: "usuarios", entidadId: String(user.id) },
  });
  return Response.redirect(absoluteUrl("/admin?user=created", request));
}
