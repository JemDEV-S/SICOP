import { getCatalogosBasicos, parsePageFiltros, type SearchParamsInput } from "@/lib/api/page-data";
import {
  getDistribucionGenerica,
  getDistribucionOrganica,
  getDistribucionRubro,
  getFactRows,
  getKpis,
  getSeriesMensuales,
} from "@/lib/api/queries";
import { getPrincipalHierarchy } from "@/lib/api/view-queries";
import { SicopHorizontalBars, SicopFlow } from "@/components/sicop/SicopBars";
import { SicopFilterBar } from "@/components/sicop/SicopFilterBar";
import { SicopKpis } from "@/components/sicop/SicopKpis";
import { Panel, Section, SicopShell } from "@/components/sicop/SicopShell";
import { SicopPrincipalTable } from "@/components/sicop/SicopPrincipalTable";

type PageProps = {
  searchParams?: Promise<SearchParamsInput>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const filtros = parsePageFiltros(params);

  // Una sola carga pesada; kpis/series/catalogos corren en paralelo
  const [facts, kpis, series, catalogos] = await Promise.all([
    getFactRows(filtros),
    getKpis(filtros),
    getSeriesMensuales(filtros),
    getCatalogosBasicos(),
  ]);

  // Distribuciones usan los facts ya cargados — sin roundtrip adicional a la BD
  const [organica, generica, rubro, principal] = await Promise.all([
    getDistribucionOrganica(filtros, facts),
    getDistribucionGenerica(filtros, facts),
    getDistribucionRubro(filtros, facts),
    getPrincipalHierarchy(filtros, facts),
  ]);

  return (
    <SicopShell>
      <Section
        title="Dashboard de ejecucion presupuestal"
        sub={`${principal.length.toLocaleString("es-PE")} finalidades · datos reales de la carga vigente #${kpis.carga.id}`}
        tools={<span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">Sincronizado</span>}
      >
        <SicopFilterBar {...catalogos} />
        <SicopKpis data={kpis} />

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <Panel title="PIM vs Devengado por organo">
            <SicopHorizontalBars data={organica.map((item) => ({ label: item.nombre, pim: item.pim, devengado: item.devengado, avanceDevengado: item.avanceDevengado }))} mode="pair" />
          </Panel>
          <Panel title="Flujo presupuestal">
            <SicopFlow
              values={[
                { label: "PIM", value: kpis.kpis.pim },
                { label: "Cert.", value: kpis.kpis.certificado },
                { label: "Comp.", value: kpis.kpis.compromisoAnual },
                { label: "Dev.", value: kpis.kpis.devengado },
                { label: "Gir.", value: kpis.kpis.girado },
              ]}
            />
          </Panel>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <Panel title="Distribucion PIM por generica">
            <SicopHorizontalBars data={generica.map((item) => ({ label: `${item.codigo} ${item.nombre}`, value: item.pim }))} />
          </Panel>
          <Panel title="Distribucion PIM por rubro">
            <SicopHorizontalBars data={rubro.map((item) => ({ label: `${item.codigo} ${item.nombreCorto}`, value: item.pim }))} />
          </Panel>
          <Panel title="Devengado mensual">
            <SicopHorizontalBars data={series.map((item) => ({ label: `Mes ${item.mes}`, value: item.devengado }))} />
          </Panel>
        </div>

        <div className="mt-4">
          <Panel title="Reporte principal - Finalidad / Rubro / Clasificador">
            <SicopPrincipalTable data={principal.slice(0, 20)} />
          </Panel>
        </div>

      </Section>
    </SicopShell>
  );
}
