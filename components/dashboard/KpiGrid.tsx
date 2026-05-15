import type { KpiResponse } from "./types";
import { KpiCard } from "./KpiCard";

export function KpiGrid({ data }: { data: KpiResponse }) {
  const { kpis } = data;

  return (
    <div className="grid overflow-hidden rounded-md border border-[#1f2530] bg-[#1f2530] sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="PIA" value={kpis.pia} foot="Presupuesto apertura" />
      <KpiCard label="PIM" value={kpis.pim} foot="Presupuesto modificado" strong />
      <KpiCard label="Certificacion" value={kpis.certificado} percent={kpis.avanceCertificado} foot={`Saldo S/ ${kpis.saldoPorCertificar.toLocaleString("es-PE", { maximumFractionDigits: 0 })}`} />
      <KpiCard label="Compromiso anual" value={kpis.compromisoAnual} percent={kpis.avanceCompromisoAnual} />
      <KpiCard label="Compromiso mensual" value={kpis.compromisoMensual} />
      <KpiCard label="Devengado" value={kpis.devengado} percent={kpis.avanceDevengado} strong />
      <KpiCard label="Girado" value={kpis.girado} percent={kpis.avanceGirado} />
      <KpiCard label="Saldo por certificar" value={kpis.saldoPorCertificar} />
    </div>
  );
}
