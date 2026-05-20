import { prisma } from "@/lib/db";
import { okJson } from "@/lib/api/response";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  const unidadId = url.searchParams.get("unidadId");

  const where: Prisma.DimMetaWhereInput = {};

  if (unidadId) {
    const uid = Number(unidadId);
    if (Number.isFinite(uid)) {
      const unidad = await prisma.dimUnidadOrganica.findUnique({
        where: { id: uid },
        select: { ruta: true },
      });
      if (unidad) {
        where.unidadOrganica = {
          OR: [
            { ruta: unidad.ruta },
            { ruta: { startsWith: `${unidad.ruta}/` } },
          ],
        };
      } else {
        where.unidadOrganicaId = uid;
      }
    }
  }

  if (q) {
    where.OR = [
      { finalidadNombre: { contains: q } },
      { productoProyectoNombre: { contains: q } },
      { cui: { contains: q } },
      { productoProyectoCodigo: { contains: q } },
      { nombreCorto: { contains: q } },
    ];
  }

  const data = await prisma.dimMeta.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: [{ meta: "asc" }, { secFunc: "asc" }],
    take: Number(url.searchParams.get("limit") ?? 200),
    select: {
      id: true,
      secFunc: true,
      nombreCorto: true,
      productoProyectoNombre: true,
      productoProyectoCodigo: true,
      tipoProdProy: true,
      cui: true,
      unidadOrganicaId: true,
    },
  });

  return okJson({ data });
}
