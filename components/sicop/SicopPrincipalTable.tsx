"use client";

import { useState } from "react";
import { money, pct, pctTone } from "./SicopFormat";

type Clasificador = {
  codigo: string; nombre: string; restringido: boolean;
  pia: number; modificaciones: number; pim: number;
  certificado: number; compromisoAnual: number; devengado: number; girado: number;
  avanceCertificado: number; avanceCompromiso: number; avanceDevengado: number;
};
type Rubro = Omit<Clasificador, "restringido"> & { clasificadores: Clasificador[] };
type Finalidad = Omit<Rubro, "clasificadores" | "restringido"> & { rubros: Rubro[] };

export function SicopPrincipalTable({ data }: { data: Finalidad[] }) {
  const [openFinalidades, setOpenFinalidades] = useState(() => new Set(data.slice(0, 5).map((item) => item.codigo)));
  const [openRubros, setOpenRubros] = useState<Set<string>>(new Set());

  const toggleFinalidad = (codigo: string) => {
    const next = new Set(openFinalidades);
    if (next.has(codigo)) next.delete(codigo); else next.add(codigo);
    setOpenFinalidades(next);
  };
  const toggleRubro = (codigo: string) => {
    const next = new Set(openRubros);
    if (next.has(codigo)) next.delete(codigo); else next.add(codigo);
    setOpenRubros(next);
  };

  return (
    <div className="overflow-auto">
      <table className="sicop-table" style={{ minWidth: 1200 }}>
        <colgroup>
          <col style={{ width: "36%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "5%" }} />
          <col style={{ width: "5%" }} />
          <col style={{ width: "5%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Concepto</th>
            <th className="sicop-num">PIA</th>
            <th className="sicop-num">Modif.</th>
            <th className="sicop-num">PIM</th>
            <th className="sicop-num">Cert.</th>
            <th className="sicop-num">Comp.</th>
            <th className="sicop-num">Dev.</th>
            <th className="sicop-num">Gir.</th>
            <th className="sicop-num">% Cert.</th>
            <th className="sicop-num">% Comp.</th>
            <th className="sicop-num">% Dev.</th>
          </tr>
        </thead>
        <tbody>
          {data.map((fin) => {
            const finOpen = openFinalidades.has(fin.codigo);
            return (
              <Fragment key={fin.codigo}>
                <DataRow item={fin} label={`${fin.codigo} ${fin.nombre}`} level="finalidad" open={finOpen} onToggle={() => toggleFinalidad(fin.codigo)} />
                {finOpen ? fin.rubros.map((rubro) => {
                  const rubroKey = `${fin.codigo}:${rubro.codigo}`;
                  const rubroOpen = openRubros.has(rubroKey);
                  return (
                    <Fragment key={rubroKey}>
                      <DataRow item={rubro} label={`${rubro.codigo} ${rubro.nombre}`} level="rubro" open={rubroOpen} onToggle={() => toggleRubro(rubroKey)} />
                      {rubroOpen ? rubro.clasificadores.map((c) => (
                        <DataRow key={`${rubroKey}:${c.codigo}`} item={c} label={`${c.codigo} ${c.nombre}`} level="clasificador" />
                      )) : null}
                    </Fragment>
                  );
                }) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Fragment({ children }: { children: React.ReactNode }) { return <>{children}</>; }

function DataRow({ item, label, level, open, onToggle }: {
  item: Clasificador | Rubro | Finalidad; label: string;
  level: "finalidad" | "rubro" | "clasificador";
  open?: boolean; onToggle?: () => void;
}) {
  const rowStyle: React.CSSProperties =
    level === "finalidad"
      ? { background: "var(--bg-elev)", fontWeight: 600 }
      : level === "rubro"
      ? { background: "rgba(91,141,239,0.04)" }
      : {};

  const padLeft = level === "finalidad" ? 10 : level === "rubro" ? 28 : 52;
  const textColor = level === "clasificador" ? "var(--fg-muted)" : "var(--fg)";
  const fontSize = level === "clasificador" ? 11.5 : 12.5;

  return (
    <tr style={rowStyle} className="sicop-data-row">
      <td className="sicop-cell-text" style={{ paddingLeft: padLeft, color: textColor, fontSize }}>
        {onToggle ? (
          <button type="button" onClick={onToggle} style={{ marginRight: 6, width: 14, color: "var(--fg-dim)", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 11, flexShrink: 0 }}>
            {open ? "▾" : "▸"}
          </button>
        ) : (
          <span style={{ display: "inline-block", width: 14, marginRight: 6, flexShrink: 0 }} />
        )}
        {label}
        {"restringido" in item && item.restringido ? (
          <span style={{ marginLeft: 6, padding: "1px 5px", border: "1px solid rgba(230,162,60,0.4)", borderRadius: 100, fontSize: 10, color: "var(--warn)" }}>R</span>
        ) : null}
      </td>
      <td className="sicop-num">{money(item.pia)}</td>
      <td className="sicop-num" style={{ color: item.modificaciones >= 0 ? "var(--ok)" : "var(--danger)" }}>
        {item.modificaciones >= 0 ? "+" : ""}{money(item.modificaciones)}
      </td>
      <td className="sicop-num">{money(item.pim)}</td>
      <td className="sicop-num">{money(item.certificado)}</td>
      <td className="sicop-num">{money(item.compromisoAnual)}</td>
      <td className="sicop-num">{money(item.devengado)}</td>
      <td className="sicop-num">{money(item.girado)}</td>
      <td className="sicop-num">{pct(item.avanceCertificado)}</td>
      <td className="sicop-num">{pct(item.avanceCompromiso)}</td>
      <td className="sicop-num">
        <span className={`rounded-full border px-2 py-0.5 font-mono ${pctTone(item.avanceDevengado)}`}>{pct(item.avanceDevengado)}</span>
      </td>
    </tr>
  );
}
