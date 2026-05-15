import { createHash } from "crypto";
import { basename } from "path";
import { readFile } from "fs/promises";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { asNumber, cleanText, splitCodeName } from "./excel";
import { clearDimensionCaches, upsertDimensions } from "./upsertDims";
import { MESES, type Mes, type ProcesarCargaOptions, type ProcesarCargaResult, type SheetGastoRow } from "./types";

const BATCH_SIZE = 1000;

function normalizeHeader(value: unknown) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function parseTipoProdProy(value: unknown): "PRODUCTO" | "PROYECTO" {
  return cleanText(value).toUpperCase().includes("PROYECTO") ? "PROYECTO" : "PRODUCTO";
}

function parseCategoria(value: unknown): "CORRIENTE" | "CAPITAL" | "SERVICIO_DEUDA" {
  const text = cleanText(value).toUpperCase();
  if (text.includes("CAPITAL")) return "CAPITAL";
  if (text.includes("DEUDA")) return "SERVICIO_DEUDA";
  return "CORRIENTE";
}

function codePart(value: unknown) {
  return splitCodeName(value).codigo;
}

function buildMonthly(row: Record<string, unknown>, prefix: string) {
  const values = {} as Record<Mes, number>;
  for (const mes of MESES) values[mes] = asNumber(row[`${prefix}_${String(mes).padStart(2, "0")}`]);
  return values;
}

function buildClassifier(row: Record<string, unknown>) {
  return [
    codePart(row.tipo_transaccion),
    codePart(row.generica),
    codePart(row.subgenerica),
    codePart(row.subgenerica_det),
    codePart(row.especifica),
    codePart(row.especifica_det),
  ].join(".");
}

async function fileSha256(filePath: string) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

async function parseRawSheetGasto(filePath: string) {
  const workbook = XLSX.read(await readFile(filePath), { type: "buffer", cellDates: false });
  const sheet = workbook.Sheets.SheetGasto;
  if (!sheet) throw new Error("El archivo crudo no contiene la hoja SheetGasto.");

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  const normalizedRows = rawRows.map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeHeader(key), value])),
  );
  const headers = new Set(Object.keys(normalizedRows[0] ?? {}));
  const required = [
    "ano_eje", "programa_pptal", "tipo_prod_proy", "producto_proyecto", "funcion", "division_fn",
    "grupo_fn", "meta", "finalidad", "sec_func", "fuente_financ", "rubro", "categoria_gasto",
    "tipo_transaccion", "generica", "subgenerica", "subgenerica_det", "especifica", "especifica_det",
    "mto_pia", "mto_modificaciones", "mto_pim", "mto_certificado", "mto_compro_anual",
  ];
  for (const prefix of ["mto_at_comp", "mto_devenga", "mto_girado", "mto_pagado"]) {
    for (const mes of MESES) required.push(`${prefix}_${String(mes).padStart(2, "0")}`);
  }
  const missing = required.filter((column) => !headers.has(column));
  if (missing.length) throw new Error(`El Excel crudo no tiene columnas obligatorias: ${missing.join(", ")}.`);

  const rows: SheetGastoRow[] = [];
  const anos = new Set<number>();
  normalizedRows.forEach((row, index) => {
    const anoEje = asNumber(row.ano_eje);
    const secFunc = asNumber(row.sec_func);
    const meta = asNumber(row.meta);
    if (!anoEje && !secFunc && !meta) return;
    const programa = splitCodeName(row.programa_pptal);
    const producto = splitCodeName(row.producto_proyecto);
    const funcion = splitCodeName(row.funcion);
    const division = splitCodeName(row.division_fn);
    const grupo = splitCodeName(row.grupo_fn);
    const finalidad = splitCodeName(row.finalidad);
    const rubro = splitCodeName(row.rubro);
    anos.add(anoEje);
    rows.push({
      rowNumber: index + 2,
      anoEje,
      programaPptal: `${programa.codigo}.${programa.nombre}`,
      tipoProdProy: parseTipoProdProy(row.tipo_prod_proy),
      productoProyectoCodigo: producto.codigo,
      productoProyectoNombre: producto.nombre,
      funcionCodigo: funcion.codigo,
      funcionNombre: funcion.nombre,
      divisionCodigo: division.codigo || null,
      divisionNombre: division.nombre || null,
      grupoCodigo: grupo.codigo || null,
      grupoNombre: grupo.nombre || null,
      meta,
      finalidadCodigo: finalidad.codigo,
      finalidadNombre: finalidad.nombre,
      secFunc,
      fuenteFinanc: cleanText(row.fuente_financ),
      rubroCodigo: rubro.codigo,
      categoriaGasto: parseCategoria(row.categoria_gasto),
      clasificadorCodigo: buildClassifier(row),
      cui: null,
      mtoPia: asNumber(row.mto_pia),
      mtoModificaciones: asNumber(row.mto_modificaciones),
      mtoPim: asNumber(row.mto_pim),
      mtoCertificado: asNumber(row.mto_certificado),
      mtoCompromisoAnual: asNumber(row.mto_compro_anual),
      compromisoMensual: buildMonthly(row, "mto_at_comp"),
      devengadoMensual: buildMonthly(row, "mto_devenga"),
      giradoMensual: buildMonthly(row, "mto_girado"),
      pagadoMensual: buildMonthly(row, "mto_pagado"),
    });
  });
  if (!rows.length) throw new Error("El Excel crudo no contiene filas válidas.");
  if (anos.size > 1) throw new Error(`La carga contiene más de un año: ${Array.from(anos).join(", ")}.`);
  return { rows, anoEje: rows[0].anoEje };
}

async function buildMapsFromExistingCatalogs(secFuncs: number[]) {
  const [rubros, clasificadores, metas] = await Promise.all([
    prisma.dimRubro.findMany({ select: { id: true, codigo: true } }),
    prisma.dimClasificadorGasto.findMany({ select: { id: true, codigo: true } }),
    prisma.dimMeta.findMany({
      where: { secFunc: { in: secFuncs } },
      select: { secFunc: true, unidadOrganicaId: true, nombreCorto: true },
      distinct: ["secFunc"],
    }),
  ]);
  return {
    rubroIds: new Map(rubros.map((item) => [item.codigo, item.id])),
    clasificadorIds: new Map(clasificadores.map((item) => [item.codigo, item.id])),
    unidadOrganicaIdsBySecFunc: new Map(metas.map((item) => [item.secFunc, item.unidadOrganicaId])),
    nombreCortoBySecFunc: new Map(metas.map((item) => [item.secFunc, item.nombreCorto])),
  };
}

function annualFact(cargaId: number, row: SheetGastoRow, ids: Awaited<ReturnType<typeof upsertDimensions>>) {
  return {
    cargaId, anoEje: row.anoEje, mes: 0, metaId: ids.metaId, rubroId: ids.rubroId, clasificadorId: ids.clasificadorId,
    categoriaGasto: row.categoriaGasto, mtoPia: row.mtoPia, mtoModificaciones: row.mtoModificaciones, mtoPim: row.mtoPim,
    mtoCertificado: row.mtoCertificado, mtoCompromisoAnual: row.mtoCompromisoAnual, mtoCompromisoMes: 0, mtoDevengado: 0, mtoGirado: 0, mtoPagado: 0,
  };
}

function monthlyFact(cargaId: number, row: SheetGastoRow, ids: Awaited<ReturnType<typeof upsertDimensions>>, mes: Mes) {
  return {
    cargaId, anoEje: row.anoEje, mes, metaId: ids.metaId, rubroId: ids.rubroId, clasificadorId: ids.clasificadorId,
    categoriaGasto: row.categoriaGasto, mtoPia: 0, mtoModificaciones: 0, mtoPim: 0, mtoCertificado: 0, mtoCompromisoAnual: 0,
    mtoCompromisoMes: row.compromisoMensual[mes], mtoDevengado: row.devengadoMensual[mes], mtoGirado: row.giradoMensual[mes], mtoPagado: row.pagadoMensual[mes],
  };
}

export async function procesarCargaCrudaExcel(options: ProcesarCargaOptions): Promise<ProcesarCargaResult> {
  clearDimensionCaches();
  const hashArchivo = await fileSha256(options.filePath);
  const existing = await prisma.carga.findUnique({ where: { hashArchivo }, select: { id: true } });
  if (existing && !options.force) throw new Error(`El archivo ya fue importado en la carga ${existing.id}.`);
  const parsed = await parseRawSheetGasto(options.filePath);
  const maps = await buildMapsFromExistingCatalogs(Array.from(new Set(parsed.rows.map((row) => row.secFunc))));
  const carga = await prisma.carga.create({
    data: { anoEje: parsed.anoEje, nombreArchivo: basename(options.filePath), hashArchivo, estado: "PROCESANDO", usuarioId: options.usuarioId },
    select: { id: true },
  });
  let registros = 0;
  try {
    const batch: ReturnType<typeof annualFact>[] = [];
    for (const row of parsed.rows) {
      const ids = await upsertDimensions(prisma, row, maps);
      batch.push(annualFact(carga.id, row, ids));
      for (const mes of MESES) batch.push(monthlyFact(carga.id, row, ids, mes));
      if (batch.length >= BATCH_SIZE) {
        await prisma.hechoEjecucion.createMany({ data: batch });
        registros += batch.length;
        batch.length = 0;
      }
    }
    if (batch.length) {
      await prisma.hechoEjecucion.createMany({ data: batch });
      registros += batch.length;
    }
    await prisma.$transaction([
      prisma.carga.updateMany({ where: { anoEje: parsed.anoEje, id: { not: carga.id }, esVigente: true }, data: { esVigente: false } }),
      prisma.carga.update({ where: { id: carga.id }, data: { estado: "EXITOSA", esVigente: true, totalFilas: parsed.rows.length, totalRegistros: registros, procesadoEn: new Date() } }),
    ]);
    return { cargaId: carga.id, anoEje: parsed.anoEje, filas: parsed.rows.length, registros, vigente: true, warnings: [] };
  } catch (error) {
    await prisma.carga.update({ where: { id: carga.id }, data: { estado: "FALLIDA", mensajeError: error instanceof Error ? error.message : "Error desconocido", procesadoEn: new Date() } });
    throw error;
  }
}
