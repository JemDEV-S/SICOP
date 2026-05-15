import { prisma } from "@/lib/db";
import { okJson } from "@/lib/api/response";

export async function GET() {
  const data = await prisma.dimUnidadOrganica.findMany({
    orderBy: [{ nivel: "asc" }, { rutaNombres: "asc" }],
    select: {
      id: true,
      nivel: true,
      padreId: true,
      nombre: true,
      nombreCorto: true,
      ruta: true,
      rutaNombres: true,
    },
  });
  return okJson({ data });
}
