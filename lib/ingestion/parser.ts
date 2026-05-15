import ExcelJS from "exceljs";
import {
  asNumber,
  cellValue,
  cleanText,
  getCell,
  getHeaderMap,
  splitCodeName,
} from "./excel";
import { MESES, type Mes, type ParseResult, type SheetGastoRow } from "./types";

const REQUIRED_COLUMNS: string[] = [
  "ano_eje",
  "programa_pptal",
  "tipo_prod_proy",
  "producto_proyecto",
  "funcion",
  "division_fn",
  "grupo_fn",
  "meta",
  "finalidad",
  "sec_func",
  "fuente_financ",
  "rubro",
  "categoria_gasto",
  "mto_pia",
  "mto_modificaciones",
  "mto_pim",
  "mto_certificado",
  "mto_compro_anual",
  "filtro_certificacion",
  "filtro_compromisoanual",
  "cui",
  "f",
];

for (const prefix of ["mto_at_comp", "mto_devenga", "mto_girado", "mto_pagado"]) {
  for (const mes of MESES) {
    REQUIRED_COLUMNS.push(`${prefix}_${String(mes).padStart(2, "0")}`);
  }
}

function parseTipoProdProy(value: unknown): "PRODUCTO" | "PROYECTO" {
  const text = cleanText(value).toUpperCase();
  return text.includes("PROYECTO") ? "PROYECTO" : "PRODUCTO";
}

function parseCategoria(value: unknown): "CORRIENTE" | "CAPITAL" | "SERVICIO_DEUDA" {
  const text = cleanText(value).toUpperCase();

  if (text.includes("CAPITAL")) {
    return "CAPITAL";
  }

  if (text.includes("DEUDA")) {
    return "SERVICIO_DEUDA";
  }

  return "CORRIENTE";
}

function buildMonthly(
  get: (column: string) => unknown,
  prefix: "mto_at_comp" | "mto_devenga" | "mto_girado" | "mto_pagado",
) {
  const values = {} as Record<Mes, number>;

  for (const mes of MESES) {
    values[mes] = asNumber(get(`${prefix}_${String(mes).padStart(2, "0")}`));
  }

  return values;
}

export async function parseSheetGasto(filePath: string): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.getWorksheet("SheetGasto");
  if (!worksheet) {
    throw new Error("El archivo no contiene la hoja obligatoria SheetGasto.");
  }

  const columnByHeader = getHeaderMap(worksheet, 1);
  const missing = REQUIRED_COLUMNS.filter((column) => !columnByHeader.has(column));
  if (missing.length > 0) {
    throw new Error(`SheetGasto no tiene columnas obligatorias: ${missing.join(", ")}.`);
  }

  const rows: SheetGastoRow[] = [];
  const warnings: string[] = [];
  const anos = new Set<number>();

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const get = (column: string) => getCell(row, columnByHeader.get(column));

    const anoEje = asNumber(get("ano_eje"));
    const secFunc = asNumber(get("sec_func"));
    const meta = asNumber(get("meta"));

    if (!anoEje && !secFunc && !meta) {
      continue;
    }

    if (!anoEje || !secFunc || !meta) {
      warnings.push(`Fila ${rowNumber}: omitida por ano_eje, sec_func o meta invalido.`);
      continue;
    }

    const programa = splitCodeName(get("programa_pptal"));
    const productoProyecto = splitCodeName(get("producto_proyecto"));
    const funcion = splitCodeName(get("funcion"));
    const division = splitCodeName(get("division_fn"));
    const grupo = splitCodeName(get("grupo_fn"));
    const finalidad = splitCodeName(get("finalidad"));
    const rubro = splitCodeName(get("rubro"));
    const clasificadorCodigo = cleanText(get("f"));

    if (!clasificadorCodigo) {
      warnings.push(`Fila ${rowNumber}: omitida por clasificador vacio.`);
      continue;
    }

    anos.add(anoEje);

    rows.push({
      rowNumber,
      anoEje,
      programaPptal: `${programa.codigo}.${programa.nombre}`,
      tipoProdProy: parseTipoProdProy(get("tipo_prod_proy")),
      productoProyectoCodigo: productoProyecto.codigo,
      productoProyectoNombre: productoProyecto.nombre,
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
      fuenteFinanc: cleanText(get("fuente_financ")),
      rubroCodigo: rubro.codigo,
      categoriaGasto: parseCategoria(get("categoria_gasto")),
      clasificadorCodigo,
      cui: cleanText(get("cui")) || null,
      mtoPia: asNumber(get("mto_pia")),
      mtoModificaciones: asNumber(get("mto_modificaciones")),
      mtoPim: asNumber(get("mto_pim")),
      mtoCertificado: asNumber(get("filtro_certificacion")) || asNumber(get("mto_certificado")),
      mtoCompromisoAnual: asNumber(get("filtro_compromisoanual")) || asNumber(get("mto_compro_anual")),
      compromisoMensual: buildMonthly(get, "mto_at_comp"),
      devengadoMensual: buildMonthly(get, "mto_devenga"),
      giradoMensual: buildMonthly(get, "mto_girado"),
      pagadoMensual: buildMonthly(get, "mto_pagado"),
    });
  }

  if (rows.length === 0) {
    throw new Error("SheetGasto no contiene filas validas para importar.");
  }

  if (anos.size > 1) {
    throw new Error(`La carga contiene mas de un ano_eje: ${Array.from(anos).join(", ")}.`);
  }

  return {
    rows,
    anoEje: rows[0].anoEje,
    warnings,
  };
}

export { cellValue };
