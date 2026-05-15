import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";

const csvNumberSchema = z
  .string()
  .optional()
  .transform((value) =>
    value
      ? value
          .split(",")
          .map((item) => Number(item.trim()))
          .filter((item) => Number.isFinite(item))
      : [],
  );

const csvStringSchema = z
  .string()
  .optional()
  .transform((value) =>
    value
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
  );

const optionalInt = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : undefined;
  });

const optionalBoolDefaultTrue = z
  .string()
  .optional()
  .transform((value) => value === "1" || value === "true");

export const filtrosSchema = z.object({
  cargaId: optionalInt,
  anoEje: optionalInt,
  mesDesde: optionalInt,
  mesHasta: optionalInt,
  unidades: csvNumberSchema,
  metas: csvNumberSchema,
  rubros: csvStringSchema,
  clasificadores: csvStringSchema,
  programas: csvStringSchema,
  categorias: csvStringSchema,
  tipoProdProy: csvStringSchema,
  incluirRestringido: optionalBoolDefaultTrue,
  q: z.string().optional().default(""),
});

export type Filtros = z.infer<typeof filtrosSchema>;

export function parseFiltros(searchParams: URLSearchParams): Filtros {
  const raw = Object.fromEntries(searchParams.entries());
  const parsed = filtrosSchema.parse(raw);
  const mesDesde = Math.max(1, Math.min(12, parsed.mesDesde ?? 1));
  const mesHasta = Math.max(mesDesde, Math.min(12, parsed.mesHasta ?? 12));

  return {
    ...parsed,
    mesDesde,
    mesHasta,
    incluirRestringido:
      raw.incluirRestringido === undefined
        ? true
        : raw.incluirRestringido === "1" || raw.incluirRestringido === "true",
  };
}

export async function getCargaConsulta(filtros: Filtros) {
  if (filtros.cargaId) {
    const carga = await prisma.carga.findUnique({ where: { id: filtros.cargaId } });
    if (!carga || carga.estado !== "EXITOSA") {
      throw new Error("La carga solicitada no existe o no esta exitosa.");
    }
    return carga;
  }

  const carga = await prisma.carga.findFirst({
    where: {
      estado: "EXITOSA",
      esVigente: true,
      ...(filtros.anoEje ? { anoEje: filtros.anoEje } : {}),
    },
    orderBy: { procesadoEn: "desc" },
  });

  if (!carga) {
    throw new Error("No hay una carga vigente disponible.");
  }

  return carga;
}

async function unidadDescendantWhere(unidadIds: number[]) {
  if (unidadIds.length === 0) {
    return undefined;
  }

  const unidades = await prisma.dimUnidadOrganica.findMany({
    where: { id: { in: unidadIds } },
    select: { ruta: true },
  });

  if (unidades.length === 0) {
    return { id: { in: [] } };
  }

  return {
    OR: unidades.map((unidad) => ({
      OR: [{ ruta: unidad.ruta }, { ruta: { startsWith: `${unidad.ruta}/` } }],
    })),
  };
}

function clasificadorWhere(codigos: string[]) {
  if (codigos.length === 0) {
    return undefined;
  }

  return {
    OR: codigos.map((codigo) => ({
      OR: [{ codigo }, { codigo: { startsWith: `${codigo}.` } }],
    })),
  };
}

export async function buildHechoWhere(
  filtros: Filtros,
  options?: {
    mes?: "anual" | "mensual" | "todos";
  },
): Promise<Prisma.HechoEjecucionWhereInput> {
  const carga = await getCargaConsulta(filtros);
  const unidadWhere = await unidadDescendantWhere(filtros.unidades);
  const clasifWhere = clasificadorWhere(filtros.clasificadores);
  const metaWhere: Prisma.DimMetaWhereInput = {};
  const where: Prisma.HechoEjecucionWhereInput = {
    cargaId: carga.id,
  };

  if (options?.mes === "anual") {
    where.mes = 0;
  } else if (options?.mes === "mensual") {
    where.mes = { gte: filtros.mesDesde, lte: filtros.mesHasta };
  }

  if (filtros.metas.length > 0) {
    metaWhere.id = { in: filtros.metas };
  }

  if (filtros.programas.length > 0) {
    metaWhere.programaPptal = { codigo: { in: filtros.programas } };
  }

  if (filtros.tipoProdProy.length > 0) {
    metaWhere.tipoProdProy = { in: filtros.tipoProdProy as Prisma.EnumTipoProdProyFilter["in"] };
  }

  if (filtros.q) {
    metaWhere.OR = [
      { finalidadNombre: { contains: filtros.q } },
      { productoProyectoNombre: { contains: filtros.q } },
      { cui: { contains: filtros.q } },
      { nombreCorto: { contains: filtros.q } },
    ];
  }

  if (unidadWhere) {
    metaWhere.unidadOrganica = unidadWhere;
  }

  if (Object.keys(metaWhere).length > 0) {
    where.metaDim = metaWhere;
  }

  if (filtros.rubros.length > 0) {
    where.rubro = { codigo: { in: filtros.rubros } };
  }

  if (filtros.categorias.length > 0) {
    where.categoriaGasto = {
      in: filtros.categorias as Prisma.EnumCategoriaGastoFilter["in"],
    };
  }

  if (clasifWhere || !filtros.incluirRestringido) {
    where.clasificador = {
      ...(clasifWhere ?? {}),
      ...(!filtros.incluirRestringido ? { restringido: false } : {}),
    };
  }

  return where;
}
