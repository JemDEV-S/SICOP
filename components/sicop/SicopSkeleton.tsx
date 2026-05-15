/* Bloques de "pulso" que imitan el layout de cada página mientras carga */

function Pulse({ w = "100%", h = 16, r = 4, style }: { w?: string | number; h?: number; r?: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "var(--border)",
      animation: "sicop-pulse 1.6s ease-in-out infinite",
      ...style,
    }} />
  );
}

/* KPI grid: 8 tarjetas */
function KpiSkeleton() {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(2,1fr)",
      gap: 1, background: "var(--border)",
      border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden",
    }} className="sicop-kpi-grid-sk">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ background: "var(--panel)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          <Pulse w="55%" h={10} />
          <Pulse w="75%" h={22} r={3} />
          <Pulse w="100%" h={3} r={2} />
        </div>
      ))}
      <style>{`
        @media (min-width: 640px)  { .sicop-kpi-grid-sk { grid-template-columns: repeat(2,1fr); } }
        @media (min-width: 1024px) { .sicop-kpi-grid-sk { grid-template-columns: repeat(4,1fr); } }
      `}</style>
    </div>
  );
}

/* Barra de filtros */
function FilterSkeleton() {
  return (
    <div style={{ marginBottom: 16, borderRadius: 8, border: "1px solid var(--border)", background: "var(--panel)" }}>
      {/* header */}
      <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
        <Pulse w={12} h={12} r={2} />
        <Pulse w={50} h={9} r={3} />
      </div>
      {/* fields */}
      <div style={{ padding: "12px 14px", display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: "grid", gap: 5 }}>
            <Pulse w="55%" h={9} />
            <Pulse h={34} r={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* Gráficos en pares */
function ChartPairSkeleton() {
  return (
    <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1.45fr 1fr", marginTop: 14 }} className="sicop-chart-pair-sk">
      <div style={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--panel)", padding: 14 }}>
        <Pulse w="40%" h={13} style={{ marginBottom: 12 }} />
        <Pulse h={220} r={4} />
      </div>
      <div style={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--panel)", padding: 14 }}>
        <Pulse w="40%" h={13} style={{ marginBottom: 12 }} />
        <Pulse h={220} r={4} />
      </div>
      <style>{`@media (max-width: 1279px) { .sicop-chart-pair-sk { grid-template-columns: 1fr; } }`}</style>
    </div>
  );
}

/* Tabla con filas skeleton */
function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div style={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--panel)", marginTop: 14, overflow: "hidden" }}>
      <div style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)" }}>
        <Pulse w="30%" h={13} />
      </div>
      <div style={{ padding: 14 }}>
        {/* Header */}
        <div style={{ display: "flex", gap: 12, paddingBottom: 10, borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
          <Pulse w="35%" h={9} />
          {Array.from({ length: 5 }).map((_, i) => (
            <Pulse key={i} w="9%" h={9} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{
            display: "flex", gap: 12, padding: "9px 0",
            borderBottom: i < rows - 1 ? "1px solid var(--border)" : "none",
            opacity: 1 - i * (0.08),
          }}>
            <Pulse w={`${30 + Math.sin(i * 1.3) * 8}%`} h={10} />
            {Array.from({ length: 5 }).map((_, j) => (
              <Pulse key={j} w="9%" h={10} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* Exportaciones: esqueleto para cada tipo de página */
export function DashboardSkeleton() {
  return (
    <PageShell>
      <TitleSkeleton sub="Cargando datos..." />
      <FilterSkeleton />
      <KpiSkeleton />
      <ChartPairSkeleton />
      <TableSkeleton rows={10} />
    </PageShell>
  );
}

export function ReporteSkeleton() {
  return (
    <PageShell>
      <TitleSkeleton sub="Cargando reporte..." />
      <FilterSkeleton />
      <KpiSkeleton />
      <TableSkeleton rows={14} />
    </PageShell>
  );
}

export function MensualSkeleton() {
  return (
    <PageShell>
      <TitleSkeleton sub="Cargando ejecucion mensual..." />
      <FilterSkeleton />
      <KpiSkeleton />
      <div style={{ marginTop: 14, display: "grid", gap: 14, gridTemplateColumns: "1fr 1.4fr" }} className="sicop-mensual-sk">
        <div style={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--panel)", padding: 14 }}>
          <Pulse w="40%" h={13} style={{ marginBottom: 12 }} />
          <Pulse h={240} r={4} />
        </div>
        <TableSkeleton rows={12} />
        <style>{`@media (max-width: 1279px) { .sicop-mensual-sk { grid-template-columns: 1fr; } }`}</style>
      </div>
    </PageShell>
  );
}

export function InversionesSkeleton() {
  return (
    <PageShell>
      <TitleSkeleton sub="Cargando inversiones..." />
      <FilterSkeleton />
      <KpiSkeleton />
      <TableSkeleton rows={12} />
    </PageShell>
  );
}

/* ── helpers internos ── */
function TitleSkeleton({ sub }: { sub: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Pulse w="45%" h={22} r={4} />
      <div style={{ marginTop: 6, fontSize: 12, color: "var(--fg-muted)", display: "flex", alignItems: "center", gap: 8 }}>
        <LoadingDots />
        {sub}
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 3 }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 4, height: 4, borderRadius: "50%",
          background: "var(--accent)",
          animation: `sicop-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          display: "inline-block",
        }} />
      ))}
    </span>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <style>{`
        @keyframes sicop-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
      `}</style>
    </>
  );
}
