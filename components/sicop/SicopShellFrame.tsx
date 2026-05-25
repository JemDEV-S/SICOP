/* Shell estático (sin queries DB) para usar en loading.tsx */
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/reporte-principal", label: "Reporte principal" },
  { href: "/mensual", label: "Ejecucion mensual" },
  { href: "/inversiones", label: "Inversiones" },
  { href: "/reportes", label: "Reportes" },
];

export function SicopShellFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--fg)" }}>
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
          }}>SJ</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>
              SICOP <span style={{ fontWeight: 400, color: "var(--fg-muted)" }}>San Jeronimo</span>
            </div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--fg-muted)" }}>
              Consulta presupuestal
            </div>
          </div>
        </Link>

        <nav style={{ display: "flex", gap: 2 }}>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} style={{
              padding: "7px 12px", borderRadius: 4, fontSize: 12.5, fontWeight: 500,
              color: "var(--fg-muted)", textDecoration: "none",
            }} className="sicop-nav-item">
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ flex: 1 }} />
        <ThemeToggle />
        <Link href="/admin" style={{
          padding: "5px 12px", borderRadius: 4, fontSize: 12, fontWeight: 500,
          border: "1px solid var(--border-strong)",
          color: "var(--fg)", textDecoration: "none",
        }}>Admin</Link>
      </header>

      <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>
        <aside style={{
          width: 280, flexShrink: 0,
          borderRight: "1px solid var(--border)",
          background: "var(--bg-elev)",
          padding: 14,
        }} className="sicop-sidebar-xl">
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-muted)", marginBottom: 6 }}>Pliego</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Municipalidad Distrital de San Jeronimo</div>
          <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 20 }}>Cusco · EF 2026</div>
          <div style={{ height: 1, background: "var(--border)" }} />
        </aside>
        <main style={{ flex: 1, minWidth: 0, overflowX: "hidden", padding: "16px 24px" }}>
          {children}
        </main>
      </div>

      <style>{`
        .sicop-nav-item:hover { background: var(--hover); color: var(--fg); }
        @media (max-width: 1279px) { .sicop-sidebar-xl { display: none; } }
      `}</style>
    </div>
  );
}
