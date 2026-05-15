import { createHash } from "crypto";
import { basename } from "path";
import { readFile } from "fs/promises";
import { prisma } from "@/lib/db";
import { parseCatalogosIniciales, upsertCatalogosIniciales } from "./catalogos";
import { parseSheetGasto } from "./parser";
import { clearDimensionCaches, upsertDimensions } from "./upsertDims";
import { MESES, type ProcesarCargaOptions, type ProcesarCargaResult, type SheetGastoRow } from "./types";

const BATCH_SIZE = 1000;

async function fileSha256(filePath: string) {
  const buffer = await readFile(filePath);
  return createHash("sha256").update(buffer).digest("hex");
}

async function resetBudgetData() {
  await prisma.hechoEjecucion.deleteMany();
  await prisma.carga.deleteMany();
  await prisma.dimMeta.deleteMany();
  await prisma.dimFuncion.deleteMany();
  await prisma.dimProgramaPptal.deleteMany();
  await prisma.dimUnidadOrganica.deleteMany();
  await prisma.dimClasificadorGasto.deleteMany();
  await prisma.dimRubro.deleteMany();
}

function annualFact(cargaId: number, row: SheetGastoRow, ids: Awaited<ReturnType<typeof upsertDimensions>>) {
  return {
    cargaId,
    anoEje: row.anoEje,
    mes: 0,
    metaId: ids.metaId,
    rubroId: ids.rubroId,
    clasificadorId: ids.clasificadorId,
    categoriaGasto: row.categoriaGasto,
    mtoPia: row.mtoPia,
    mtoModificaciones: row.mtoModificaciones,
    mtoPim: row.mtoPim,
    mtoCertificado: row.mtoCertificado,
    mtoCompromisoAnual: row.mtoCompromisoAnual,
    mtoCompromisoMes: 0,
    mtoDevengado: 0,
    mtoGirado: 0,
    mtoPagado: 0,
  };
}

function monthlyFact(
  cargaId: number,
  row: SheetGastoRow,
  ids: Awaited<ReturnType<typeof upsertDimensions>>,
  mes: (typeof MESES)[number],
) {
  return {
    cargaId,
    anoEje: row.anoEje,
    mes,
    metaId: ids.metaId,
    rubroId: ids.rubroId,
    clasificadorId: ids.clasificadorId,
    categoriaGasto: row.categoriaGasto,
    mtoPia: 0,
    mtoModificaciones: 0,
    mtoPim: 0,
    mtoCertificado: 0,
    mtoCompromisoAnual: 0,
    mtoCompromisoMes: row.compromisoMensual[mes],
    mtoDevengado: row.devengadoMensual[mes],
    mtoGirado: row.giradoMensual[mes],
    mtoPagado: row.pagadoMensual[mes],
  };
}

export async function procesarCargaExcel(options: ProcesarCargaOptions): Promise<ProcesarCargaResult> {
  clearDimensionCaches();

  if (options.reset) {
    await resetBudgetData();
  }

  const hashArchivo = await fileSha256(options.filePath);
  const existing = await prisma.carga.findUnique({
    where: { hashArchivo },
    select: { id: true },
  });

  if (existing && !options.force) {
    throw new Error(`El archivo ya fue importado en la carga ${existing.id}. Usa --force para reprocesarlo.`);
  }

  if (existing && options.force) {
    await prisma.carga.delete({ where: { id: existing.id } });
  }

  const [catalogos, parsed] = await Promise.all([
    parseCatalogosIniciales(options.filePath),
    parseSheetGasto(options.filePath),
  ]);

  const maps = await upsertCatalogosIniciales(prisma, catalogos);
  const warnings = [...catalogos.warnings, ...parsed.warnings];

  const carga = await prisma.carga.create({
    data: {
      anoEje: parsed.anoEje,
      nombreArchivo: basename(options.filePath),
      hashArchivo,
      estado: "PROCESANDO",
      usuarioId: options.usuarioId,
    },
    select: { id: true },
  });

  let registros = 0;

  try {
    const batch: ReturnType<typeof annualFact>[] = [];

    for (const row of parsed.rows) {
      const ids = await upsertDimensions(prisma, row, maps);
      batch.push(annualFact(carga.id, row, ids));

      for (const mes of MESES) {
        batch.push(monthlyFact(carga.id, row, ids, mes));
      }

      if (batch.length >= BATCH_SIZE) {
        await prisma.hechoEjecucion.createMany({ data: batch });
        registros += batch.length;
        batch.length = 0;
      }
    }

    if (batch.length > 0) {
      await prisma.hechoEjecucion.createMany({ data: batch });
      registros += batch.length;
    }

    await prisma.$transaction([
      prisma.carga.updateMany({
        where: {
          anoEje: parsed.anoEje,
          id: { not: carga.id },
          esVigente: true,
        },
        data: { esVigente: false },
      }),
      prisma.carga.update({
        where: { id: carga.id },
        data: {
          estado: "EXITOSA",
          esVigente: true,
          totalFilas: parsed.rows.length,
          totalRegistros: registros,
          procesadoEn: new Date(),
        },
      }),
    ]);

    return {
      cargaId: carga.id,
      anoEje: parsed.anoEje,
      filas: parsed.rows.length,
      registros,
      vigente: true,
      warnings,
    };
  } catch (error) {
    await prisma.carga.update({
      where: { id: carga.id },
      data: {
        estado: "FALLIDA",
        mensajeError: error instanceof Error ? error.message : "Error desconocido",
        procesadoEn: new Date(),
      },
    });

    throw error;
  }
}
