import type { PrismaClient } from "@prisma/client";
import type { CatalogImportMaps, SheetGastoRow } from "./types";

type PrismaTx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

type DimensionIds = {
  metaId: number;
  rubroId: number;
  clasificadorId: number;
};

const programaCache = new Map<string, number>();
const funcionCache = new Map<string, number>();
const metaCache = new Map<string, number>();

async function upsertPrograma(tx: PrismaTx, row: SheetGastoRow) {
  const [codigo, ...nameParts] = row.programaPptal.split(".");
  const nombre = nameParts.join(".").trim() || row.programaPptal;
  const cached = programaCache.get(codigo);
  if (cached) {
    return cached;
  }

  const programa = await tx.dimProgramaPptal.upsert({
    where: { codigo },
    update: { nombre },
    create: { codigo, nombre },
    select: { id: true },
  });

  programaCache.set(codigo, programa.id);
  return programa.id;
}

async function upsertFuncion(tx: PrismaTx, row: SheetGastoRow) {
  const key = `${row.funcionCodigo}|${row.divisionCodigo ?? ""}|${row.grupoCodigo ?? ""}`;
  const cached = funcionCache.get(key);
  if (cached) {
    return cached;
  }

  const existing = await tx.dimFuncion.findFirst({
    where: {
      codigo: row.funcionCodigo,
      divisionCodigo: row.divisionCodigo,
      grupoCodigo: row.grupoCodigo,
    },
    select: { id: true },
  });

  if (existing) {
    funcionCache.set(key, existing.id);
    return existing.id;
  }

  const funcion = await tx.dimFuncion.create({
    data: {
      codigo: row.funcionCodigo,
      nombre: row.funcionNombre,
      divisionCodigo: row.divisionCodigo,
      divisionNombre: row.divisionNombre,
      grupoCodigo: row.grupoCodigo,
      grupoNombre: row.grupoNombre,
    },
    select: { id: true },
  });

  funcionCache.set(key, funcion.id);
  return funcion.id;
}

async function upsertMeta(
  tx: PrismaTx,
  row: SheetGastoRow,
  programaPptalId: number,
  funcionId: number,
  unidadOrganicaId: number,
  nombreCorto: string | null,
) {
  const key = `${row.anoEje}|${row.meta}|${row.secFunc}`;
  const cached = metaCache.get(key);
  if (cached) {
    return cached;
  }

  const meta = await tx.dimMeta.upsert({
    where: {
      anoEje_meta_secFunc: {
        anoEje: row.anoEje,
        meta: row.meta,
        secFunc: row.secFunc,
      },
    },
    update: {
      finalidadCodigo: row.finalidadCodigo,
      finalidadNombre: row.finalidadNombre,
      tipoProdProy: row.tipoProdProy,
      productoProyectoCodigo: row.productoProyectoCodigo,
      productoProyectoNombre: row.productoProyectoNombre,
      cui: row.cui,
      programaPptalId,
      funcionId,
      unidadOrganicaId,
      nombreCorto: nombreCorto?.slice(0, 150) ?? null,
    },
    create: {
      anoEje: row.anoEje,
      meta: row.meta,
      secFunc: row.secFunc,
      finalidadCodigo: row.finalidadCodigo,
      finalidadNombre: row.finalidadNombre,
      tipoProdProy: row.tipoProdProy,
      productoProyectoCodigo: row.productoProyectoCodigo,
      productoProyectoNombre: row.productoProyectoNombre,
      cui: row.cui,
      programaPptalId,
      funcionId,
      unidadOrganicaId,
      nombreCorto: nombreCorto?.slice(0, 150) ?? null,
    },
    select: { id: true },
  });

  metaCache.set(key, meta.id);
  return meta.id;
}

export function clearDimensionCaches() {
  programaCache.clear();
  funcionCache.clear();
  metaCache.clear();
}

export async function upsertDimensions(
  tx: PrismaTx,
  row: SheetGastoRow,
  maps: CatalogImportMaps,
): Promise<DimensionIds> {
  const rubroId = maps.rubroIds.get(row.rubroCodigo);
  if (!rubroId) {
    throw new Error(`Fila ${row.rowNumber}: rubro ${row.rubroCodigo} no existe en catalogo RB.`);
  }

  const clasificadorId = maps.clasificadorIds.get(row.clasificadorCodigo);
  if (!clasificadorId) {
    throw new Error(`Fila ${row.rowNumber}: clasificador ${row.clasificadorCodigo} no existe en catalogo CG.`);
  }

  const unidadOrganicaId = maps.unidadOrganicaIdsBySecFunc.get(row.secFunc);
  if (!unidadOrganicaId) {
    throw new Error(`Fila ${row.rowNumber}: sec_func ${row.secFunc} no tiene estructura organica valida en SF.`);
  }

  const [programaPptalId, funcionId] = await Promise.all([upsertPrograma(tx, row), upsertFuncion(tx, row)]);
  const metaId = await upsertMeta(
    tx,
    row,
    programaPptalId,
    funcionId,
    unidadOrganicaId,
    maps.nombreCortoBySecFunc.get(row.secFunc) ?? null,
  );

  return {
    metaId,
    rubroId,
    clasificadorId,
  };
}
