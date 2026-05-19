import { mkdir, writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { procesarCargaExcel } from "@/lib/ingestion/procesarCarga";
import { procesarCargaCrudaExcel } from "@/lib/ingestion/raw";
import { absoluteUrl } from "@/lib/url";

export async function POST(request: Request) {
  const user = await requireAdmin();
  const form = await request.formData();
  const file = form.get("file");
  const tipo = String(form.get("tipo") ?? "completo");
  const extensionValida = tipo === "crudo" ? /\.(xls|xlsx)$/i.test(file instanceof File ? file.name : "") : /\.xlsx$/i.test(file instanceof File ? file.name : "");
  if (!(file instanceof File) || !extensionValida) {
    return Response.redirect(absoluteUrl("/admin?upload=invalid", request));
  }

  const dir = join(tmpdir(), "sicop-uploads");
  await mkdir(dir, { recursive: true });
  const extension = file.name.toLowerCase().endsWith(".xls") ? ".xls" : ".xlsx";
  const path = join(dir, `${Date.now()}${extension}`);
  await writeFile(path, Buffer.from(await file.arrayBuffer()));

  try {
    const result =
      tipo === "crudo"
        ? await procesarCargaCrudaExcel({ filePath: path, usuarioId: user.id })
        : await procesarCargaExcel({ filePath: path, usuarioId: user.id });
    await prisma.auditoria.create({
      data: { usuarioId: user.id, accion: "CARGA_CREADA", entidad: "cargas", entidadId: String(result.cargaId), detalle: result },
    });
    return Response.redirect(absoluteUrl("/admin?upload=ok", request));
  } catch (error) {
    return Response.redirect(absoluteUrl(`/admin?upload=error&message=${encodeURIComponent(error instanceof Error ? error.message : "Error")}`, request));
  } finally {
    await unlink(path).catch(() => undefined);
  }
}
