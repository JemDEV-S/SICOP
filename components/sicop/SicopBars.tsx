import { money, pct } from "./SicopFormat";

type BarDatum = {
  label: string;
  value?: number;
  pim?: number;
  devengado?: number;
  avanceDevengado?: number;
};

export function SicopHorizontalBars({ data, mode = "single" }: { data: BarDatum[]; mode?: "single" | "pair" }) {
  const max = Math.max(1, ...data.flatMap((item) => [item.value ?? 0, item.pim ?? 0, item.devengado ?? 0]));

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {data.slice(0, 12).map((item) => (
        <div key={item.label} style={{ display: "grid", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--fg)" }}>{item.label}</span>
            <span style={{ flexShrink: 0, fontFamily: "var(--font-mono)", color: "var(--fg-muted)" }}>
              {mode === "pair" ? pct(item.avanceDevengado) : `S/ ${money(item.value ?? item.pim ?? 0)}`}
            </span>
          </div>
          {mode === "pair" ? (
            <div style={{ display: "grid", gap: 3 }}>
              <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 3, background: "var(--accent)", opacity: 0.45, width: `${((item.pim ?? 0) / max) * 100}%` }} />
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 3, background: "var(--accent)", width: `${((item.devengado ?? 0) / max) * 100}%` }} />
              </div>
            </div>
          ) : (
            <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 3, background: "var(--accent)", width: `${((item.value ?? item.pim ?? 0) / max) * 100}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* Paleta multi-color que respeta modo claro/oscuro */
const FLOW_COLORS = ["var(--accent)", "#52a673", "#5d9fdf", "var(--warn)", "var(--danger)"];

export function SicopFlow({ values }: { values: { label: string; value: number }[] }) {
  const max = Math.max(1, ...values.map((item) => item.value));

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 240 }}>
      {values.map((item, index) => (
        <div key={item.label} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg)", textAlign: "center" }}>
            S/ {money(item.value)}
          </div>
          {index > 0 && (
            <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-muted)" }}>
              {((item.value / values[0].value) * 100).toFixed(1)}%
            </div>
          )}
          <div style={{
            width: "100%",
            borderRadius: "3px 3px 0 0",
            background: FLOW_COLORS[index % FLOW_COLORS.length],
            height: `${Math.max(8, (item.value / max) * 170)}px`,
            transition: "height 0.3s ease",
          }} />
          <div style={{ fontSize: 11, color: "var(--fg-muted)", textAlign: "center" }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}
