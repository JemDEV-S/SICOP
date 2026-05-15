import { prisma } from "@/lib/db";
import { round2, toNumber } from "./decimal";
import { buildHechoWhere, getCargaConsulta, type Filtros } from "./filtros";

export async function getKpis(filtros: Filtros) {
  const carga = await getCargaConsulta(filtros);
  const [anual, mensual] = await Promise.all([
    prisma.hechoEjecucion.aggregate({
      where: await buildHechoWhere(filtros, { mes: "anual" }),
      _sum: {
        mtoPia: true,
        mtoModificaciones: true,
        mtoPim: true,
        mtoCertificado: true,
        mtoCompromisoAnual: true,
      },
    }),
    prisma.hechoEjecucion.aggregate({
      where: await buildHechoWhere(filtros, { mes: "mensual" }),
      _sum: {
        mtoCompromisoMes: true,
        mtoDevengado: true,
        mtoGirado: true,
        mtoPagado: true,
      },
    }),
  ]);

  const pia = toNumber(anual._sum.mtoPia);
  const pim = toNumber(anual._sum.mtoPim);
  const certificado = toNumber(anual._sum.mtoCertificado);
  const compromisoAnual = toNumber(anual._sum.mtoCompromisoAnual);
  const devengado = toNumber(mensual._sum.mtoDevengado);
  const girado = toNumber(mensual._sum.mtoGirado);

  return {
    carga: {
      id: carga.id,
      anoEje: carga.anoEje,
      nombreArchivo: carga.nombreArchivo,
      procesadoEn: carga.procesadoEn,
    },
    filtros: {
      mesDesde: filtros.mesDesde ?? 1,
      mesHasta: filtros.mesHasta ?? 12,
    },
    kpis: {
      pia,
      modificaciones: toNumber(anual._sum.mtoModificaciones),
      pim,
      certificado,
      compromisoAnual,
      compromisoMensual: toNumber(mensual._sum.mtoCompromisoMes),
      devengado,
      girado,
      pagado: toNumber(mensual._sum.mtoPagado),
      saldoPorCertificar: round2(pim - certificado),
      avanceCertificado: pim ? round2((certificado / pim) * 100) : 0,
      avanceCompromisoAnual: pim ? round2((compromisoAnual / pim) * 100) : 0,
      avanceDevengado: pim ? round2((devengado / pim) * 100) : 0,
      avanceGirado: pim ? round2((girado / pim) * 100) : 0,
    },
  };
}

export type FactRow = Awaited<ReturnType<typeof getFactRows>>[number];

export async function getFactRows(filtros: Filtros, mode: "anual" | "mensual" | "todos" = "todos") {
  return prisma.hechoEjecucion.findMany({
    where: await buildHechoWhere(filtros, { mes: mode }),
    include: {
      rubro: true,
      clasificador: true,
      metaDim: {
        include: {
          programaPptal: true,
          funcion: true,
          unidadOrganica: true,
        },
      },
    },
  });
}

function emptyAgg() {
  return {
    pia: 0,
    pim: 0,
    certificado: 0,
    compromisoAnual: 0,
    compromisoMensual: 0,
    devengado: 0,
    girado: 0,
    pagado: 0,
  };
}

function addFact<T extends ReturnType<typeof emptyAgg>>(agg: T, fact: FactRow) {
  agg.pia += toNumber(fact.mtoPia);
  agg.pim += toNumber(fact.mtoPim);
  agg.certificado += toNumber(fact.mtoCertificado);
  agg.compromisoAnual += toNumber(fact.mtoCompromisoAnual);
  agg.compromisoMensual += toNumber(fact.mtoCompromisoMes);
  agg.devengado += toNumber(fact.mtoDevengado);
  agg.girado += toNumber(fact.mtoGirado);
  agg.pagado += toNumber(fact.mtoPagado);
  return agg;
}

function finalizeAgg<T extends ReturnType<typeof emptyAgg>>(agg: T) {
  return {
    ...agg,
    avanceDevengado: agg.pim ? round2((agg.devengado / agg.pim) * 100) : 0,
  };
}

export async function getSeriesMensuales(filtros: Filtros) {
  const rows = await prisma.hechoEjecucion.groupBy({
    by: ["mes"],
    where: await buildHechoWhere(filtros, { mes: "mensual" }),
    _sum: {
      mtoCompromisoMes: true,
      mtoDevengado: true,
      mtoGirado: true,
      mtoPagado: true,
    },
    orderBy: { mes: "asc" },
  });

  return rows.map((row) => ({
    mes: row.mes,
    compromisoMensual: toNumber(row._sum.mtoCompromisoMes),
    devengado: toNumber(row._sum.mtoDevengado),
    girado: toNumber(row._sum.mtoGirado),
    pagado: toNumber(row._sum.mtoPagado),
  }));
}

export async function getDistribucionRubro(filtros: Filtros, prefetched?: FactRow[]) {
  const facts = prefetched ?? await getFactRows(filtros);
  const map = new Map<string, ReturnType<typeof emptyAgg> & { codigo: string; nombre: string; nombreCorto: string }>();

  for (const fact of facts) {
    const key = fact.rubro.codigo;
    const agg =
      map.get(key) ??
      ({ ...emptyAgg(), codigo: fact.rubro.codigo, nombre: fact.rubro.nombre, nombreCorto: fact.rubro.nombreCorto });
    map.set(key, addFact(agg, fact));
  }

  return Array.from(map.values()).map(finalizeAgg).sort((a, b) => b.pim - a.pim);
}

export async function getDistribucionGenerica(filtros: Filtros, prefetched?: FactRow[]) {
  const facts = prefetched ?? await getFactRows(filtros);
  const map = new Map<string, ReturnType<typeof emptyAgg> & { codigo: string; nombre: string }>();

  for (const fact of facts) {
    const parts = fact.clasificador.codigo.split(".");
    const codigo = parts.slice(0, 2).join(".");
    const key = codigo;
    const agg = map.get(key) ?? { ...emptyAgg(), codigo, nombre: codigo };
    if (agg.nombre === codigo && fact.clasificador.codigo === codigo) {
      agg.nombre = fact.clasificador.descripcion;
    }
    map.set(key, addFact(agg, fact));
  }

  return Array.from(map.values()).map(finalizeAgg).sort((a, b) => b.pim - a.pim);
}

export async function getDistribucionOrganica(filtros: Filtros, prefetched?: FactRow[]) {
  const facts = prefetched ?? await getFactRows(filtros);
  const map = new Map<string, ReturnType<typeof emptyAgg> & { unidadOrganicaId: number; nombre: string; ruta: string }>();

  for (const fact of facts) {
    const unidad = fact.metaDim.unidadOrganica;
    const raiz = unidad.rutaNombres.split(" > ")[0] || unidad.nombre;
    const key = raiz;
    const agg = map.get(key) ?? { ...emptyAgg(), unidadOrganicaId: unidad.id, nombre: raiz, ruta: raiz };
    map.set(key, addFact(agg, fact));
  }

  return Array.from(map.values()).map(finalizeAgg).sort((a, b) => b.pim - a.pim);
}

export async function getRankingMetas(filtros: Filtros, limit = 20) {
  const facts = await getFactRows(filtros);
  const map = new Map<
    number,
    ReturnType<typeof emptyAgg> & {
      metaId: number;
      meta: number;
      secFunc: number;
      finalidad: string;
      unidadOrganica: string;
      cui: string | null;
    }
  >();

  for (const fact of facts) {
    const meta = fact.metaDim;
    const agg =
      map.get(meta.id) ??
      ({
        ...emptyAgg(),
        metaId: meta.id,
        meta: meta.meta,
        secFunc: meta.secFunc,
        finalidad: meta.finalidadNombre,
        unidadOrganica: meta.unidadOrganica.rutaNombres,
        cui: meta.cui,
      });
    map.set(meta.id, addFact(agg, fact));
  }

  return Array.from(map.values())
    .map(finalizeAgg)
    .sort((a, b) => b.devengado - a.devengado)
    .slice(0, limit);
}

export async function getTabla(filtros: Filtros, groupBy: string, limit = 200) {
  if (groupBy === "rubro") return (await getDistribucionRubro(filtros)).slice(0, limit);
  if (groupBy === "generica") return (await getDistribucionGenerica(filtros)).slice(0, limit);
  if (groupBy === "organica") return (await getDistribucionOrganica(filtros)).slice(0, limit);
  return getRankingMetas(filtros, limit);
}

export async function getHeatmapMesGenerica(filtros: Filtros) {
  const facts = await getFactRows(filtros, "mensual");
  const map = new Map<string, { mes: number; generica: string; devengado: number; girado: number }>();

  for (const fact of facts) {
    const generica = fact.clasificador.codigo.split(".").slice(0, 2).join(".");
    const key = `${fact.mes}|${generica}`;
    const agg = map.get(key) ?? { mes: fact.mes, generica, devengado: 0, girado: 0 };
    agg.devengado += toNumber(fact.mtoDevengado);
    agg.girado += toNumber(fact.mtoGirado);
    map.set(key, agg);
  }

  return Array.from(map.values()).sort((a, b) => a.mes - b.mes || a.generica.localeCompare(b.generica));
}
