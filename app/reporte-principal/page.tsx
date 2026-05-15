import { getCatalogosBasicos, parsePageFiltros, type SearchParamsInput } from "@/lib/api/page-data";
import { getKpis } from "@/lib/api/queries";
import { getPrincipalHierarchy } from "@/lib/api/view-queries";
import { SicopFilterBar } from "@/components/sicop/SicopFilterBar";
import { SicopKpis } from "@/components/sicop/SicopKpis";
import { SicopPrincipalTable } from "@/components/sicop/SicopPrincipalTable";
import { Panel, Section, SicopShell } from "@/components/sicop/SicopShell";

type PageProps = {
  searchParams?: Promise<SearchParamsInput>;
};

export default async function ReportePrincipalPage({ searchParams }: PageProps) {
  const filtros = parsePageFiltros((await searchParams) ?? {});
  const [kpis, principal, catalogos] = await Promise.all([getKpis(filtros), getPrincipalHierarchy(filtros), getCatalogosBasicos()]);

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
