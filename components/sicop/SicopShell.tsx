import Link from "next/link";
import { prisma } from "@/lib/db";
import { ThemeToggle } from "./ThemeToggle";
import { SicopSidebarTree } from "./SicopSidebarTree";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/reporte-principal", label: "Reporte principal" },
  { href: "/mensual", label: "Ejecucion mensual" },
  { href: "/inversiones", label: "Inversiones" },
  { href: "/reportes", label: "Reportes" },
];

export async function SicopShell({ children }: { children: React.ReactNode }) {
  const [carga, unidades] = await Promise.all([
    prisma.carga.findFirst({ where: { esVigente: true, estado: "EXITOSA" }, orderBy: { procesadoEn: "desc" } }),
    prisma.dimUnidadOrganica.findMany({
      orderBy: [{ nivel: "asc" }, { rutaNombres: "asc" }],
      select: { id: true, nivel: true, nombre: true, padreId: true },
    }),
  ]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--fg)" }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        display: "flex", alignItems: "center", gap: 24,
        height: 56, padding: "0 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-elev)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6,
            display: "grid", placeItems: "center",
            background: "linear-gradient(135deg,#c5333a 0%,#8a1c2b 100%)",
            color: "#ffe9b0", fontFamily: "var(--font-mono)",
            fontWeight: 600, fontSize: 13,
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            SJ
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>
              SICOP <span style={{ fontWeight: 400, color: "var(--fg-muted)" }}>San Jeronimo</span>
            </div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--fg-muted)" }}>
              Consulta presupuestal · {carga?.anoEje ?? 2026}
            </div>
          </div>
        </Link>

        <nav style={{ display: "flex", gap: 2 }}>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} style={{
              padding: "7px 12px", borderRadius: 4, fontSize: 12.5, fontWeight: 500,
              color: "var(--fg-muted)", textDecoration: "none",
            }}
            className="sicop-nav-item">
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--fg-muted)" }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--ok)",
            boxShadow: "0 0 0 4px var(--ok-soft)",
          }} />
          Datos al{" "}
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg)" }}>
            {carga?.procesadoEn ? new Date(carga.procesadoEn).toLocaleDateString("es-PE") : "sin fecha"}
          </span>
        </div>

        <ThemeToggle />

        <Link href="/admin" style={{
          padding: "5px 12px", borderRadius: 4, fontSize: 12, fontWeight: 500,
          border: "1px solid var(--border-strong)",
          color: "var(--fg)", textDecoration: "none",
        }}>
          Admin
        </Link>
      </header>

      <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>
        {/* Sidebar */}
        <aside style={{
          width: 280, flexShrink: 0,
          borderRight: "1px solid var(--border)",
          background: "var(--bg-elev)",
          overflowY: "auto",
          padding: 14,
        }} className="sicop-sidebar-xl">
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-muted)", marginBottom: 6 }}>Pliego</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Municipalidad Distrital de San Jeronimo</div>
          <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 20 }}>Cusco · EF {carga?.anoEje ?? 2026}</div>

          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-muted)", marginBottom: 8 }}>Estructura institucional</div>
          <SicopSidebarTree unidades={unidades} />

          <div style={{ height: 1, background: "var(--border)", margin: "16px 0" }} />
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-muted)" }}>Ultima actualizacion</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, marginTop: 6 }}>
            {carga?.procesadoEn ? new Date(carga.procesadoEn).toLocaleString("es-PE") : "-"}
          </div>
          <div style={{ fontSize: 11, color: "var(--fg-dim)", marginTop: 4, wordBreak: "break-all" }}>{carga?.nombreArchivo}</div>
        </aside>

        <main style={{ flex: 1, minWidth: 0, overflowX: "hidden", padding: "16px 24px" }}>
          {children}
        </main>
      </div>

      <style>{`
        .sicop-nav-item:hover { background: var(--hover); color: var(--fg); }
        .sicop-tree-item:hover { background: var(--hover); color: var(--fg); }
        @media (max-width: 1279px) { .sicop-sidebar-xl { display: none; } }
      `}</style>
    </div>
  );
}


export function Section({
  title, sub, children, tools,
}: {
  title: string; sub?: string; tools?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section>
      <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em", color: "var(--fg)" }}>{title}</h1>
            {sub ? <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--fg-muted)" }}>{sub}</p> : null}
          </div>
          {tools}
        </div>
      </div>
      {children}
    </section>
  );
}

export function Panel({
  title, children, tools, className = "",
}: {
  title?: string; children: React.ReactNode; tools?: React.ReactNode; className?: string;
}) {
  return (
    <div className={className} style={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--panel)" }}>
      {title ? (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          padding: "11px 14px", borderBottom: "1px solid var(--border)",
        }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{title}</h2>
          {tools}
        </div>
      ) : null}
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}
