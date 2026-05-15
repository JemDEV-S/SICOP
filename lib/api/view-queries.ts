import { round2, toNumber } from "./decimal";
import type { Filtros } from "./filtros";
import { getFactRows, type FactRow } from "./queries";

function emptyAgg() {
  return {
    pia: 0,
    modificaciones: 0,
    pim: 0,
    certificado: 0,
    compromisoAnual: 0,
    compromisoMensual: 0,
    devengado: 0,
    girado: 0,
    pagado: 0,
  };
}

type Agg = ReturnType<typeof emptyAgg>;

function addAgg(agg: Agg, fact: Awaited<ReturnType<typeof getFactRows>>[number]) {
  agg.pia += toNumber(fact.mtoPia);
  agg.modificaciones += toNumber(fact.mtoModificaciones);
  agg.pim += toNumber(fact.mtoPim);
  agg.certificado += toNumber(fact.mtoCertificado);
  agg.compromisoAnual += toNumber(fact.mtoCompromisoAnual);
  agg.compromisoMensual += toNumber(fact.mtoCompromisoMes);
  agg.devengado += toNumber(fact.mtoDevengado);
  agg.girado += toNumber(fact.mtoGirado);
  agg.pagado += toNumber(fact.mtoPagado);
}

function finalize(agg: Agg) {
  return {
    ...agg,
    saldoCertificar: round2(agg.pim - agg.certificado),
    avanceCertificado: agg.pim ? round2((agg.certificado / agg.pim) * 100) : 0,
    avanceCompromiso: agg.pim ? round2((agg.compromisoAnual / agg.pim) * 100) : 0,
    avanceDevengado: agg.pim ? round2((agg.devengado / agg.pim) * 100) : 0,
    avanceGirado: agg.pim ? round2((agg.girado / agg.pim) * 100) : 0,
  };
}

export async function getPrincipalHierarchy(filtros: Filtros, prefetched?: FactRow[]) {
  const facts = prefetched ?? await getFactRows(filtros);
  const finalidades = new Map<
    string,
    {
      codigo: string;
      nombre: string;
      agg: Agg;
      rubros: Map<
        string,
        {
          codigo: string;
          nombre: string;
          agg: Agg;
          clasificadores: Map<string, { codigo: string; nombre: string; restringido: boolean; agg: Agg }>;
        }
      >;
    }
  >();

  for (const fact of facts) {
    const meta = fact.metaDim;
    const finKey = `${meta.finalidadCodigo}|${meta.finalidadNombre}`;
    let finalidad = finalidades.get(finKey);
    if (!finalidad) {
      finalidad = {
        codigo: meta.finalidadCodigo,
        nombre: meta.finalidadNombre,
        agg: emptyAgg(),
        rubros: new Map(),
      };
      finalidades.set(finKey, finalidad);
    }
    addAgg(finalidad.agg, fact);

    let rubro = finalidad.rubros.get(fact.rubro.codigo);
    if (!rubro) {
      rubro = {
        codigo: fact.rubro.codigo,
        nombre: fact.rubro.nombre,
        agg: emptyAgg(),
        clasificadores: new Map(),
      };
      finalidad.rubros.set(fact.rubro.codigo, rubro);
    }
    addAgg(rubro.agg, fact);

    let clasificador = rubro.clasificadores.get(fact.clasificador.codigo);
    if (!clasificador) {
      clasificador = {
        codigo: fact.clasificador.codigo,
        nombre: fact.clasificador.descripcion,
        restringido: fact.clasificador.restringido,
        agg: emptyAgg(),
      };
      rubro.clasificadores.set(fact.clasificador.codigo, clasificador);
    }
    addAgg(clasificador.agg, fact);
  }

  return Array.from(finalidades.values())
    .map((fin) => ({
      codigo: fin.codigo,
      nombre: fin.nombre,
      ...finalize(fin.agg),
      rubros: Array.from(fin.rubros.values())
        .map((rub) => ({
          codigo: rub.codigo,
          nombre: rub.nombre,
          ...finalize(rub.agg),
          clasificadores: Array.from(rub.clasificadores.values())
            .map((clasif) => ({
              codigo: clasif.codigo,
              nombre: clasif.nombre,
              restringido: clasif.restringido,
              ...finalize(clasif.agg),
            }))
            .sort((a, b) => b.pim - a.pim),
        }))
        .sort((a, b) => b.pim - a.pim),
    }))
    .sort((a, b) => b.pim - a.pim);
}

export async function getInversiones(filtros: Filtros) {
  const facts = await getFactRows({ ...filtros, tipoProdProy: ["PROYECTO"] });
  const inversiones = new Map<
    string,
    {
      cui: string;
      nombre: string;
      unidadOrganica: string;
      meta: number;
      secFunc: number;
      rubro: string;
      agg: Agg;
    }
  >();

  for (const fact of facts) {
    const meta = fact.metaDim;
    const identificador = meta.cui ?? meta.productoProyectoCodigo;
    if (!identificador) continue;
    let inversion = inversiones.get(identificador);
    if (!inversion) {
      inversion = {
        cui: identificador,
        nombre: meta.productoProyectoNombre,
        unidadOrganica: meta.unidadOrganica.rutaNombres,
        meta: meta.meta,
        secFunc: meta.secFunc,
        rubro: fact.rubro.nombreCorto,
        agg: emptyAgg(),
      };
      inversiones.set(identificador, inversion);
    }
    addAgg(inversion.agg, fact);
  }

  return Array.from(inversiones.values())
    .map((item) => ({
      cui: item.cui,
      nombre: item.nombre,
      unidadOrganica: item.unidadOrganica,
      meta: item.meta,
      secFunc: item.secFunc,
      rubro: item.rubro,
      ...finalize(item.agg),
    }))
    .sort((a, b) => b.pim - a.pim);
}
