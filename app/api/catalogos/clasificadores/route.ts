import { prisma } from "@/lib/db";
import { okJson } from "@/lib/api/response";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  const data = await prisma.dimClasificadorGasto.findMany({
    where: q
      ? {
          OR: [{ codigo: { startsWith: q } }, { descripcion: { contains: q } }],
        }
      : undefined,
    orderBy: [{ codigo: "asc" }],
    take: Number(url.searchParams.get("limit") ?? 300),
  });

  return okJson({ data });
}
