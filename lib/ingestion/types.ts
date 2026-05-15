export const MESES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export type Mes = (typeof MESES)[number];

export type SheetGastoRow = {
  rowNumber: number;
  anoEje: number;
  programaPptal: string;
  tipoProdProy: "PRODUCTO" | "PROYECTO";
  productoProyectoCodigo: string;
  productoProyectoNombre: string;
  funcionCodigo: string;
  funcionNombre: string;
  divisionCodigo: string | null;
  divisionNombre: string | null;
  grupoCodigo: string | null;
  grupoNombre: string | null;
  meta: number;
  finalidadCodigo: string;
  finalidadNombre: string;
  secFunc: number;
  fuenteFinanc: string;
  rubroCodigo: string;
  categoriaGasto: "CORRIENTE" | "CAPITAL" | "SERVICIO_DEUDA";
  clasificadorCodigo: string;
  cui: string | null;
  mtoPia: number;
  mtoModificaciones: number;
  mtoPim: number;
  mtoCertificado: number;
  mtoCompromisoAnual: number;
  compromisoMensual: Record<Mes, number>;
  devengadoMensual: Record<Mes, number>;
  giradoMensual: Record<Mes, number>;
  pagadoMensual: Record<Mes, number>;
};

export type ParseResult = {
  rows: SheetGastoRow[];
  anoEje: number;
  warnings: string[];
};

export type ProcesarCargaOptions = {
  filePath: string;
  usuarioId?: number;
  force?: boolean;
  reset?: boolean;
};

export type ProcesarCargaResult = {
  cargaId: number;
  anoEje: number;
  filas: number;
  registros: number;
  vigente: boolean;
  warnings: string[];
};

export type RubroCatalogRow = {
  codigo: string;
  nombre: string;
  fuenteCodigo: string;
  fuenteNombre: string;
  nombreCorto: string;
  descripcion: string | null;
};

export type ClasificadorCatalogRow = {
  codigo: string;
  codigoPadre: string | null;
  nivel: number;
  descripcion: string;
  descripcionDetallada: string | null;
  restringido: boolean;
};

export type SecFuncCatalogRow = {
  secFunc: number;
  productoProyectoTipo: string;
  finalidadCodigo: string;
  finalidadNombre: string;
  organo: string;
  unidadOrganica: string;
  subUnidadOrganica: string;
  nombreCorto: string | null;
};

export type CatalogosIniciales = {
  rubros: RubroCatalogRow[];
  clasificadores: ClasificadorCatalogRow[];
  secFuncs: SecFuncCatalogRow[];
  warnings: string[];
};

export type CatalogImportMaps = {
  rubroIds: Map<string, number>;
  clasificadorIds: Map<string, number>;
  unidadOrganicaIdsBySecFunc: Map<number, number>;
  nombreCortoBySecFunc: Map<number, string | null>;
};
