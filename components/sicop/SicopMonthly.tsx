import type { SerieMensual } from "@/components/dashboard/types";
import { money, monthLong, pct, pctTone } from "./SicopFormat";

export function SicopMonthlyTable({ data, pim }: { data: SerieMensual[]; pim: number }) {
  const rows = data.map((row, index) => {
    const acumulado = data.slice(0, index + 1).reduce((sum, item) => sum + item.devengado, 0);
    return { ...row, acumulado, avance: pim ? (acumulado / pim) * 100 : 0 };
  });

  return (
    <div className="overflow-x-auto">
      <table className="sicop-table" style={{ minWidth: 760 }}>
        <colgroup>
          <col style={{ width: "18%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "12%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Mes</th>
            <th className="sicop-num">Compromiso</th>
            <th className="sicop-num">Devengado</th>
            <th className="sicop-num">Girado</th>
            <th className="sicop-num">Pagado</th>
            <th className="sicop-num">Dev. acumulado</th>
            <th className="sicop-num">% avance PIM</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.mes}>
              <td>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-dim)", marginRight: 8 }}>
                  {String(row.mes).padStart(2, "0")}
                </span>
                {monthLong[row.mes - 1]}
              </td>
              <td className="sicop-num">{money(row.compromisoMensual)}</td>
              <td className="sicop-num">{money(row.devengado)}</td>
              <td className="sicop-num">{money(row.girado)}</td>
              <td className="sicop-num">{money(row.pagado)}</td>
              <td className="sicop-num">{money(row.acumulado)}</td>
              <td className="sicop-num">
                <span className={`rounded-full border px-2 py-0.5 font-mono text-xs ${pctTone(row.avance)}`}>
                  {pct(row.avance)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
