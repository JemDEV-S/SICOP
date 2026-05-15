import { parseFiltros } from "@/lib/api/filtros";
import { getTabla } from "@/lib/api/queries";
import { errorJson, okJson } from "@/lib/api/response";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filtros = parseFiltros(url.searchParams);
    const groupBy = url.searchParams.get("groupBy") ?? "meta";
    const limit = Number(url.searchParams.get("limit") ?? 200);
    return okJson({
      groupBy,
      data: await getTabla(filtros, groupBy, Number.isFinite(limit) ? limit : 200),
    });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Error al consultar tabla");
  }
}
