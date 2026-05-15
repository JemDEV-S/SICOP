import { prisma } from "@/lib/db";
import { okJson } from "@/lib/api/response";

export async function GET() {
  const data = await prisma.dimProgramaPptal.findMany({
    orderBy: { codigo: "asc" },
  });
  return okJson({ data });
}
