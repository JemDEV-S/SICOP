import { getCatalogosBasicos, parsePageFiltros, type SearchParamsInput } from "@/lib/api/page-data";
import { getKpis } from "@/lib/api/queries";
import { getInversiones } from "@/lib/api/view-queries";
import { money, pct, pctTone } from "@/components/sicop/SicopFormat";
import { SicopFilterBar } from "@/components/sicop/SicopFilterBar";
import { SicopKpis } from "@/components/sicop/SicopKpis";
import { Panel, Section, SicopShell } from "@/components/sicop/SicopShell";

type PageProps = {
  searchParams?: Promise<SearchParamsInput>;
};

export default async function InversionesPage({ searchParams }: PageProps) {
  const filtros = parsePageFiltros((await searchParams) ?? {});
  const [kpis, inversiones, catalogos] = await Promise.all([getKpis({ ...filtros, tipoProdProy: ["PROYECTO"] }), getInversiones(filtros), getCatalogosBasicos()]);

  return (
    <SicopShell>
      <Section title="Inversiones" sub={`${inversiones.length} proyectos de inversion activos`}>
        <SicopFilterBar {...catalogos} />
        <SicopKpis data={kpis} />
        <div className="mt-4">
          <Panel title="Avance por inversion">
            <div className="overflow-x-auto">
              <table className="sicop-table" style={{ minWidth: 960 }}>
                <colgroup>
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "36%" }} />
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "5%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>CUI / Código</th>
                    <th>Inversion</th>
                    <th>Unidad responsable</th>
                    <th className="sicop-num">PIM</th>
                    <th className="sicop-num">Devengado</th>
                    <th className="sicop-num">Girado</th>
                    <th className="sicop-num">Avance</th>
                  </tr>
                </thead>
                <tbody>
                  {inversiones.map((item) => (
                    <tr key={item.cui}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent-strong)", verticalAlign: "top", paddingTop: 10 }}>{item.cui}</td>
                      <td className="sicop-cell-text">{item.nombre}</td>
                      <td className="sicop-cell-text" style={{ color: "var(--fg-muted)", fontSize: 12 }}>{item.unidadOrganica}</td>
                      <td className="sicop-num">{money(item.pim)}</td>
                      <td className="sicop-num">{money(item.devengado)}</td>
                      <td className="sicop-num">{money(item.girado)}</td>
                      <td className="sicop-num">
                        <span className={`rounded-full border px-2 py-0.5 font-mono ${pctTone(item.avanceDevengado)}`}>{pct(item.avanceDevengado)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </Section>
    </SicopShell>
  );
}
