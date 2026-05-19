import { getCatalogosBasicos, parsePageFiltros, type SearchParamsInput } from "@/lib/api/page-data";
import { getKpis } from "@/lib/api/queries";
import { getPrincipalHierarchy } from "@/lib/api/view-queries";
import { SicopFilterBar } from "@/components/sicop/SicopFilterBar";
import { SicopKpis } from "@/components/sicop/SicopKpis";
import { SicopPrincipalTable } from "@/components/sicop/SicopPrincipalTable";
import { isNoCargaVigenteError, NoCargaVigentePanel } from "@/components/sicop/NoCargaVigente";
import { Panel, Section, SicopShell } from "@/components/sicop/SicopShell";

type PageProps = {
  searchParams?: Promise<SearchParamsInput>;
};

export default async function ReportePrincipalPage({ searchParams }: PageProps) {
  const filtros = parsePageFiltros((await searchParams) ?? {});
  const data = await Promise.all([getKpis(filtros), getPrincipalHierarchy(filtros), getCatalogosBasicos()]).catch((error) =>
    isNoCargaVigenteError(error) ? null : Promise.reject(error),
  );

  if (!data) {
    return (
      <SicopShell>
        <Section title="Reporte principal jerarquico" sub="Aun no hay una carga exitosa marcada como vigente.">
          <NoCargaVigentePanel />
        </Section>
      </SicopShell>
    );
  }

  const [kpis, principal, catalogos] = data;

  return (
    <SicopShell>
      <Section title="Reporte principal jerarquico" sub="Finalidad -> Rubro -> Clasificador, con todos los montos presupuestales">
        <SicopFilterBar {...catalogos} />
        <SicopKpis data={kpis} />
        <div className="mt-4">
          <Panel title={`${principal.length} finalidades encontradas`}>
            <SicopPrincipalTable data={principal} />
          </Panel>
        </div>
      </Section>
    </SicopShell>
  );
}
