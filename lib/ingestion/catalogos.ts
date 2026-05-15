import ExcelJS from "exceljs";
import type { PrismaClient } from "@prisma/client";
import {
  asNumber,
  cleanText,
  getCell,
  getHeaderMap,
  splitCodeName,
} from "./excel";
import type {
  CatalogImportMaps,
  CatalogosIniciales,
  ClasificadorCatalogRow,
  RubroCatalogRow,
  SecFuncCatalogRow,
} from "./types";

type PrismaTx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

function classifierParent(codigo: string) {
  const parts = codigo.split(".");
  return parts.length > 1 ? parts.slice(0, -1).join(".") : null;
}

function classifierNivel(codigo: string) {
  return codigo.split(".").filter(Boolean).length;
}

function parseRestriccion(value: unknown) {
  const text = cleanText(value).toUpperCase();
  return text.includes("RESTRINGIDO") || text.includes("NO PUEDE");
}

function requireSheet(workbook: ExcelJS.Workbook, name: string) {
  const worksheet = workbook.getWorksheet(name);
  if (!worksheet) {
    throw new Error(`El archivo no contiene la hoja obligatoria ${name}.`);
  }

  return worksheet;
}

function parseRubros(worksheet: ExcelJS.Worksheet) {
  const headers = getHeaderMap(worksheet, 1);
  const rows: RubroCatalogRow[] = [];
  const seen = new Set<string>();

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const rubro = splitCodeName(getCell(row, headers.get("rubro")));
    const fuente = splitCodeName(getCell(row, headers.get("fuente")));

    if (!rubro.codigo || seen.has(rubro.codigo)) {
      continue;
    }

    seen.add(rubro.codigo);
    rows.push({
      codigo: rubro.codigo,
      nombre: rubro.nombre,
      fuenteCodigo: fuente.codigo,
      fuenteNombre: fuente.nombre,
      nombreCorto: cleanText(getCell(row, 5)).replace(/^\d+\.\s*/, "").slice(0, 20) || rubro.codigo,
      descripcion: cleanText(getCell(row, headers.get("des_rubro"))) || null,
    });
  }

  return rows;
}

function parseClasificadores(worksheet: ExcelJS.Worksheet) {
  const headers = getHeaderMap(worksheet, 1);
  const rows: ClasificadorCatalogRow[] = [];
  const seen = new Set<string>();

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const codigo = cleanText(getCell(row, headers.get("clasificador")));

    if (!codigo || seen.has(codigo)) {
      continue;
    }

    seen.add(codigo);
    rows.push({
      codigo,
      codigoPadre: classifierParent(codigo),
      nivel: classifierNivel(codigo),
      descripcion: cleanText(getCell(row, headers.get("descripcion"))).slice(0, 300) || codigo,
      descripcionDetallada: cleanText(getCell(row, headers.get("descripcion_detallada"))) || null,
      restringido: parseRestriccion(getCell(row, 5)),
    });
  }

  return rows;
}

function parseSecFuncs(worksheet: ExcelJS.Worksheet) {
  const rows: SecFuncCatalogRow[] = [];
  const seen = new Set<number>();

  for (let rowNumber = 3; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const secFunc = asNumber(getCell(row, 2));

    if (!secFunc || seen.has(secFunc)) {
      continue;
    }

    const organo = cleanText(getCell(row, 6));
    const unidadOrganica = cleanText(getCell(row, 7));
    const subUnidadOrganica = cleanText(getCell(row, 8));

    if (!organo || !unidadOrganica || !subUnidadOrganica) {
      continue;
    }

    seen.add(secFunc);
    rows.push({
      secFunc,
      productoProyectoTipo: cleanText(getCell(row, 3)),
      finalidadCodigo: cleanText(getCell(row, 4)),
      finalidadNombre: cleanText(getCell(row, 5)),
      organo,
      unidadOrganica,
      subUnidadOrganica,
      nombreCorto: cleanText(getCell(row, 9)) || null,
    });
  }

  return rows;
}

export async function parseCatalogosIniciales(filePath: string): Promise<CatalogosIniciales> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const rubros = parseRubros(requireSheet(workbook, "RB"));
  const clasificadores = parseClasificadores(requireSheet(workbook, "CG"));
  const secFuncs = parseSecFuncs(requireSheet(workbook, "SF"));
  const warnings: string[] = [];

  if (rubros.length === 0) {
    throw new Error("La hoja RB no contiene rubros validos.");
  }

  if (clasificadores.length === 0) {
    throw new Error("La hoja CG no contiene clasificadores validos.");
  }

  if (secFuncs.length === 0) {
    throw new Error("La hoja SF no contiene estructura organica valida.");
  }

  return { rubros, clasificadores, secFuncs, warnings };
}

async function upsertUnidadNivel(
  tx: PrismaTx,
  nivel: number,
  nombre: string,
  padreId: number | null,
  nombreCorto?: string | null,
) {
  const existing = await tx.dimUnidadOrganica.findFirst({
    where: { nivel, padreId, nombre },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const parent = padreId
    ? await tx.dimUnidadOrganica.findUnique({
        where: { id: padreId },
        select: { ruta: true, rutaNombres: true },
      })
    : null;

  const created = await tx.dimUnidadOrganica.create({
    data: {
      nivel,
      padreId,
      nombre,
      nombreCorto: nombreCorto?.slice(0, 50),
      ruta: "pending",
      rutaNombres: parent ? `${parent.rutaNombres} > ${nombre}` : nombre,
    },
    select: { id: true },
  });

  await tx.dimUnidadOrganica.update({
    where: { id: created.id },
    data: { ruta: parent ? `${parent.ruta}/${created.id}` : String(created.id) },
  });

  return created.id;
}

export async function upsertCatalogosIniciales(
  tx: PrismaTx,
  catalogos: CatalogosIniciales,
): Promise<CatalogImportMaps> {
  const rubroIds = new Map<string, number>();
  const clasificadorIds = new Map<string, number>();
  const unidadOrganicaIdsBySecFunc = new Map<number, number>();
  const nombreCortoBySecFunc = new Map<number, string | null>();

  for (const rubro of catalogos.rubros) {
    const saved = await tx.dimRubro.upsert({
      where: { codigo: rubro.codigo },
      update: rubro,
      create: rubro,
      select: { id: true },
    });
    rubroIds.set(rubro.codigo, saved.id);
  }

  for (const clasificador of catalogos.clasificadores) {
    const saved = await tx.dimClasificadorGasto.upsert({
      where: { codigo: clasificador.codigo },
      update: clasificador,
      create: clasificador,
      select: { id: true },
    });
    clasificadorIds.set(clasificador.codigo, saved.id);
  }

  const unidadCache = new Map<string, number>();
  const cachedUnidad = async (
    nivel: number,
    nombre: string,
    padreId: number | null,
    nombreCorto?: string | null,
  ) => {
    const key = `${nivel}|${padreId ?? "root"}|${nombre}`;
    const cached = unidadCache.get(key);
    if (cached) {
      return cached;
    }

    const id = await upsertUnidadNivel(tx, nivel, nombre, padreId, nombreCorto);
    unidadCache.set(key, id);
    return id;
  };

  for (const secFunc of catalogos.secFuncs) {
    const organoId = await cachedUnidad(1, secFunc.organo, null);
    let leafId = organoId;
    let leafName = secFunc.organo;
    let leafLevel = 1;

    if (secFunc.unidadOrganica && secFunc.unidadOrganica !== leafName) {
      leafId = await cachedUnidad(2, secFunc.unidadOrganica, leafId);
      leafName = secFunc.unidadOrganica;
      leafLevel = 2;
    }

    if (secFunc.subUnidadOrganica && secFunc.subUnidadOrganica !== leafName) {
      leafId = await cachedUnidad(leafLevel + 1, secFunc.subUnidadOrganica, leafId);
    }

    unidadOrganicaIdsBySecFunc.set(secFunc.secFunc, leafId);
    nombreCortoBySecFunc.set(secFunc.secFunc, secFunc.nombreCorto);
  }

  return { rubroIds, clasificadorIds, unidadOrganicaIdsBySecFunc, nombreCortoBySecFunc };
}
