export type KpiResponse = {
  carga: {
    id: number;
    anoEje: number;
    nombreArchivo: string;
    procesadoEn: string | Date | null;
  };
  filtros: {
    mesDesde: number;
    mesHasta: number;
  };
  kpis: {
    pia: number;
    modificaciones: number;
    pim: number;
    certificado: number;
    compromisoAnual: number;
    compromisoMensual: number;
    devengado: number;
    girado: number;
    pagado: number;
    saldoPorCertificar: number;
    avanceCertificado: number;
    avanceCompromisoAnual: number;
    avanceDevengado: number;
    avanceGirado: number;
  };
};

export type SerieMensual = {
  mes: number;
  compromisoMensual: number;
  devengado: number;
  girado: number;
  pagado: number;
};

export type TablaRow = {
  metaId?: number;
  meta?: number;
  secFunc?: number;
  codigo?: string;
  nombre?: string;
  nombreCorto?: string;
  finalidad?: string;
  unidadOrganica?: string;
  cui?: string | null;
  pia: number;
  pim: number;
  certificado: number;
  compromisoAnual: number;
  compromisoMensual: number;
  devengado: number;
  girado: number;
  pagado: number;
  avanceDevengado: number;
};

export type CatalogoSimple = {
  id?: number;
  codigo?: string;
  nombre: string;
  nombreCorto?: string | null;
  nivel?: number;
  rutaNombres?: string;
};
