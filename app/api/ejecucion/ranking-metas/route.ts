import { parseFiltros } from "@/lib/api/filtros";
import { getRankingMetas } from "@/lib/api/queries";
import { errorJson, okJson } from "@/lib/api/response";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filtros = parseFiltros(url.searchParams);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    return okJson({ data: await getRankingMetas(filtros, Number.isFinite(limit) ? limit : 20) });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Error al consultar ranking de metas");
  }
}
