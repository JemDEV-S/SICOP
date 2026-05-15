import { prisma } from "@/lib/db";
import { errorJson, okJson } from "@/lib/api/response";

export async function GET(request: Request) {
  const rawAnoEje = new URL(request.url).searchParams.get("anoEje");
  const anoEje = rawAnoEje ? Number(rawAnoEje) : undefined;
  const carga = await prisma.carga.findFirst({
    where: {
      estado: "EXITOSA",
      esVigente: true,
      ...(Number.isInteger(anoEje) ? { anoEje } : {}),
    },
    orderBy: { procesadoEn: "desc" },
  });

  if (!carga) {
    return errorJson("No hay carga vigente.", 404);
  }

  return okJson({ data: carga });
}
