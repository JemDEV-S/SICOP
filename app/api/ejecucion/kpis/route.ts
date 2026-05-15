import { errorJson, okJson } from "@/lib/api/response";
import { parseFiltros } from "@/lib/api/filtros";
import { getKpis } from "@/lib/api/queries";

export async function GET(request: Request) {
  try {
    const filtros = parseFiltros(new URL(request.url).searchParams);
    return okJson(await getKpis(filtros));
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Error al consultar KPIs");
  }
}
