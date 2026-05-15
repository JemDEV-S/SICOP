import { parseFiltros } from "@/lib/api/filtros";
import { getDistribucionOrganica } from "@/lib/api/queries";
import { errorJson, okJson } from "@/lib/api/response";

export async function GET(request: Request) {
  try {
    const filtros = parseFiltros(new URL(request.url).searchParams);
    return okJson({ data: await getDistribucionOrganica(filtros) });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Error al consultar distribucion organica");
  }
}
