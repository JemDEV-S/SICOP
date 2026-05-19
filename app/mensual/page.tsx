import { getCatalogosBasicos, parsePageFiltros, type SearchParamsInput } from "@/lib/api/page-data";
import { getKpis, getSeriesMensuales } from "@/lib/api/queries";
import { SicopFilterBar } from "@/components/sicop/SicopFilterBar";
import { SicopKpis } from "@/components/sicop/SicopKpis";
import { SicopMonthlyTable } from "@/components/sicop/SicopMonthly";
import { SicopHorizontalBars } from "@/components/sicop/SicopBars";
import { isNoCargaVigenteError, NoCargaVigentePanel } from "@/components/sicop/NoCargaVigente";
import { Panel, Section, SicopShell } from "@/components/sicop/SicopShell";

type PageProps = {
  searchParams?: Promise<SearchParamsInput>;
};

export default async function MensualPage({ searchParams }: PageProps) {
  const filtros = parsePageFiltros((await searchParams) ?? {});
  const data = await Promise.all([getKpis(filtros), getSeriesMensuales(filtros), getCatalogosBasicos()]).catch((error) =>
    isNoCargaVigenteError(error) ? null : Promise.reject(error),
  );

  if (!data) {
    return (
      <SicopShell>
        <Section title="Ejecucion mensual" sub="Aun no hay una carga exitosa marcada como vigente.">
          <NoCargaVigentePanel />
        </Section>
      </SicopShell>
    );
  }

  const [kpis, series, catalogos] = data;

  return (
    <SicopShell>
      <Section title="Ejecucion mensual" sub="Compromiso, devengado, girado y pagado por mes">
        <SicopFilterBar {...catalogos} />
        <SicopKpis data={kpis} />
        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.4fr]">
          <Panel title="Devengado por mes">
            <SicopHorizontalBars data={series.map((item) => ({ label: `Mes ${item.mes}`, value: item.devengado }))} />
          </Panel>
          <Panel title="Detalle mensual">
            <SicopMonthlyTable data={series} pim={kpis.kpis.pim} />
          </Panel>
        </div>
      </Section>
    </SicopShell>
  );
}
