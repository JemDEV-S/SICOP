import { parseFiltros } from "./filtros";
import { prisma } from "@/lib/db";

export type SearchParamsInput = Record<string, string | string[] | undefined>;

export function paramsToUrlSearchParams(params: SearchParamsInput) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      search.set(key, value.join(","));
    } else if (value) {
      search.set(key, value);
    }
  }

  return search;
}

export function parsePageFiltros(params: SearchParamsInput) {
  return parseFiltros(paramsToUrlSearchParams(params));
}

export function getGroupBy(params: SearchParamsInput) {
  return typeof params.groupBy === "string" ? params.groupBy : "meta";
}

export async function getCatalogosBasicos() {
  const [rubros, unidades, programas] = await Promise.all([
    prisma.dimRubro.findMany({ orderBy: { codigo: "asc" } }),
    prisma.dimUnidadOrganica.findMany({
      orderBy: [{ nivel: "asc" }, { rutaNombres: "asc" }],
      select: { id: true, nivel: true, nombre: true, rutaNombres: true },
    }),
    prisma.dimProgramaPptal.findMany({ orderBy: { codigo: "asc" } }),
  ]);

  return { rubros, unidades, programas };
}
