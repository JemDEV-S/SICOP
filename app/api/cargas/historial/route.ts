import { prisma } from "@/lib/db";
import { okJson } from "@/lib/api/response";

export async function GET() {
  const data = await prisma.carga.findMany({
    orderBy: { creadoEn: "desc" },
    take: 50,
  });
  return okJson({ data });
}
