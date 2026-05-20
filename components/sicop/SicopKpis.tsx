import { pct, pctTone, money } from "./SicopFormat";
import type { KpiResponse } from "@/components/dashboard/types";

export function SicopKpis({ data }: { data: KpiResponse }) {
  const k = data.kpis;
  const items = [
    { label: "PIA", value: k.pia, foot: "Presupuesto apertura" },
    { label: "Modificaciones", value: k.modificaciones, foot: "PIM − PIA", accent: k.modificaciones >= 0 ? "var(--ok)" : "var(--danger)" },
    { label: "PIM", value: k.pim, foot: "Presupuesto modificado", strong: true },
    { label: "Certificacion", value: k.certificado, pct: k.avanceCertificado, foot: `Saldo S/ ${money(k.saldoPorCertificar)}` },
    { label: "Compromiso anual", value: k.compromisoAnual, pct: k.avanceCompromisoAnual },
    { label: "Devengado", value: k.devengado, pct: k.avanceDevengado, strong: true },
    { label: "Girado", value: k.girado, pct: k.avanceGirado },
    { label: "Pagado", value: k.pagado },
    {
      label: "Saldo disponible",
      value: k.saldoDisponible,
      foot: "PIM − Compromiso anual",
      accent: k.saldoDisponible >= 0 ? "var(--ok)" : "var(--danger)",
    },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(2,1fr)",
      gap: 1,
      background: "var(--border)",
      border: "1px solid var(--border)",
      borderRadius: 6,
      overflow: "hidden",
    }} className="sicop-kpi-grid">
      {items.map((item) => (
        <article key={item.label} style={{
          background: item.strong ? "var(--bg-elev-2)" : "var(--panel)",
          padding: "14px 16px",
          display: "flex", flexDirection: "column", gap: 6,
          cursor: "default",
          transition: "background 0.12s",
        }} className="sicop-kpi-card">
          <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-muted)", fontWeight: 500 }}>
            {item.label}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 19, fontWeight: 500, color: item.accent ?? "var(--fg)", fontVariantNumeric: "tabular-nums" }}>
            <span style={{ fontSize: 11, fontWeight: 400, color: "var(--fg-muted)", marginRight: 3 }}>S/</span>
            {money(item.value)}
          </div>
          {typeof item.pct === "number" ? (
            <>
              <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden", marginTop: 2 }}>
                <div style={{ height: "100%", background: "var(--accent)", borderRadius: "inherit", width: `${Math.min(100, Math.max(0, item.pct))}%` }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--fg-muted)" }}>
                <span className={`rounded-full border px-2 py-0.5 font-mono ${pctTone(item.pct)}`}>{pct(item.pct)}</span>
                <span>avance</span>
              </div>
            </>
          ) : item.foot ? (
            <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>{item.foot}</div>
          ) : null}
        </article>
      ))}
      <style>{`
        @media (min-width: 640px) { .sicop-kpi-grid { grid-template-columns: repeat(2,1fr); } }
        @media (min-width: 1024px) { .sicop-kpi-grid { grid-template-columns: repeat(4,1fr); } }
        .sicop-kpi-card:hover { background: var(--bg-elev-2) !important; }
      `}</style>
    </div>
  );
}
