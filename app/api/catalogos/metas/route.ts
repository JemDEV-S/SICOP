import { prisma } from "@/lib/db";
import { okJson } from "@/lib/api/response";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  const data = await prisma.dimMeta.findMany({
    where: q
      ? {
          OR: [
            { finalidadNombre: { contains: q } },
            { productoProyectoNombre: { contains: q } },
            { cui: { contains: q } },
            { nombreCorto: { contains: q } },
          ],
        }
      : undefined,
    orderBy: [{ meta: "asc" }, { secFunc: "asc" }],
    take: Number(url.searchParams.get("limit") ?? 200),
    include: {
      programaPptal: true,
      unidadOrganica: {
        select: {
          id: true,
          nombre: true,
          rutaNombres: true,
        },
      },
    },
  });

  return okJson({ data });
}
