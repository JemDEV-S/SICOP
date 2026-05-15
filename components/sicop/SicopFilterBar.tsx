"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { monthLong } from "./SicopFormat";

type Option = { codigo?: string; id?: number; nombre: string; nombreCorto?: string | null; nivel?: number };

export function SicopFilterBar({
  rubros,
  unidades,
  programas,
}: {
  rubros: Option[];
  unidades: Option[];
  programas: Option[];
}) {
  const router      = useRouter();
  const pathname    = usePathname();
  const sp          = useSearchParams();
  const [q, setQ]   = useState(sp.get("q") ?? "");
  const [pending, startTransition] = useTransition();

  const val = (k: string) => sp.get(k) ?? "";

  const push = (updates: Record<string, string>) => {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v); else params.delete(k);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const mesDesde       = val("mesDesde")             || "1";
  const mesHasta       = val("mesHasta")             || "12";
  const inclRestringido = val("incluirRestringido")  || "true";
  const selRubro       = val("rubros");
  const selUnidad      = val("unidades");
  const selPrograma    = val("programas");
  const currentQ       = val("q");

  /* ── chips activos ── */
  type Chip = { key: string; label: string; value: string };
  const chips: Chip[] = [];

  if (selRubro) {
    const f = rubros.find((r) => r.codigo === selRubro);
    chips.push({ key: "rubros", label: "Rubro", value: f ? (f.nombreCorto ?? f.nombre) : selRubro });
  }
  if (selUnidad) {
    const f = unidades.find((u) => String(u.id) === selUnidad);
    chips.push({ key: "unidades", label: "Unidad", value: f ? f.nombre : selUnidad });
  }
  if (selPrograma) {
    const f = programas.find((p) => p.codigo === selPrograma);
    chips.push({ key: "programas", label: "Programa", value: f ? f.codigo! : selPrograma });
  }
  if (mesDesde !== "1" || mesHasta !== "12") {
    chips.push({
      key: "_meses", label: "Meses",
      value: `${monthLong[+mesDesde - 1]?.slice(0, 3)} — ${monthLong[+mesHasta - 1]?.slice(0, 3)}`,
    });
  }
  if (inclRestringido === "false") {
    chips.push({ key: "incluirRestringido", label: "Restringidos", value: "Excluidos" });
  }
  if (currentQ) {
    chips.push({ key: "q", label: "Búsqueda", value: `"${currentQ}"` });
  }

  const removeChip = (key: string) => {
    if (key === "_meses") {
      const params = new URLSearchParams(sp.toString());
      params.delete("mesDesde"); params.delete("mesHasta");
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    } else {
      if (key === "q") setQ("");
      push({ [key]: "" });
    }
  };

  const clearAll = () => { setQ(""); startTransition(() => router.push(pathname)); };

  return (
    <div style={{
      marginBottom: 16, borderRadius: 8,
      border: "1px solid var(--border)",
      background: "var(--panel)",
      /* sin overflow:hidden — necesario para que el dropdown de unidades no quede cortado */
    }}>

      {/* ── cabecera ── */}
      <div style={{
        padding: "8px 14px",
        borderBottom: "1px solid var(--border)",
        borderRadius: "8px 8px 0 0",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden style={{ color: "var(--fg-muted)", flexShrink: 0 }}>
          <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--fg-muted)" }}>
          Filtros
        </span>
        {chips.length > 0 && (
          <span style={{ padding: "1px 7px", borderRadius: 100, fontSize: 10, fontWeight: 700, background: "var(--accent-soft)", color: "var(--accent-strong)" }}>
            {chips.length}
          </span>
        )}
        {pending && (
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--fg-muted)", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", border: "1.5px solid var(--accent)", borderTopColor: "transparent", animation: "sicop-spin 0.7s linear infinite" }} />
            Aplicando…
          </span>
        )}
      </div>

      {/* ── controles ── */}
      <div style={{ padding: "12px 14px", display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}>

        <Field label="Rubro">
          <select value={selRubro} onChange={(e) => push({ rubros: e.target.value })} className="sicop-input">
            <option value="">Todos los rubros</option>
            {rubros.map((r) => (
              <option key={r.codigo} value={r.codigo}>{r.codigo} — {r.nombreCorto ?? r.nombre}</option>
            ))}
          </select>
        </Field>

        {/* combobox con búsqueda */}
        <div style={{ display: "grid", gap: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-muted)" }}>
            Unidad orgánica
          </span>
          <UnidadCombobox
            options={unidades}
            value={selUnidad}
            onChange={(v) => push({ unidades: v })}
          />
        </div>

        <Field label="Programa presupuestal">
          <select value={selPrograma} onChange={(e) => push({ programas: e.target.value })} className="sicop-input">
            <option value="">Todos los programas</option>
            {programas.map((p) => (
              <option key={p.codigo} value={p.codigo}>{p.codigo} — {p.nombre}</option>
            ))}
          </select>
        </Field>

        <Field label="Rango de meses">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 14px 1fr", gap: 4, alignItems: "center" }}>
            <select value={mesDesde} onChange={(e) => push({ mesDesde: e.target.value })} className="sicop-input" style={{ paddingRight: 4 }}>
              {monthLong.map((n, i) => <option key={i + 1} value={i + 1}>{n.slice(0, 3)}</option>)}
            </select>
            <span style={{ fontSize: 10, color: "var(--fg-dim)", textAlign: "center" }}>—</span>
            <select value={mesHasta} onChange={(e) => push({ mesHasta: e.target.value })} className="sicop-input" style={{ paddingRight: 4 }}>
              {monthLong.map((n, i) => <option key={i + 1} value={i + 1}>{n.slice(0, 3)}</option>)}
            </select>
          </div>
        </Field>

        <Field label="Restringidos">
          <button
            type="button"
            onClick={() => push({ incluirRestringido: inclRestringido === "false" ? "true" : "false" })}
            style={{
              height: 34, padding: "0 12px", borderRadius: 4, fontSize: 12, fontWeight: 500,
              background: inclRestringido !== "false" ? "var(--ok-soft)" : "var(--danger-soft)",
              border: `1px solid ${inclRestringido !== "false" ? "rgba(46,194,126,0.35)" : "rgba(232,91,91,0.35)"}`,
              color: inclRestringido !== "false" ? "var(--ok)" : "var(--danger)",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 7, width: "100%",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              {inclRestringido !== "false" ? "✓" : "✕"}
            </span>
            {inclRestringido !== "false" ? "Incluir restringidos" : "Excluir restringidos"}
          </button>
        </Field>

        <Field label="Búsqueda libre">
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && push({ q: q.trim() })}
              placeholder="Finalidad, meta, clasificador..."
              className="sicop-input"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => push({ q: q.trim() })}
              style={{
                height: 34, padding: "0 12px", borderRadius: 4, fontSize: 12, fontWeight: 600,
                background: "var(--accent)", border: "1px solid var(--accent)",
                color: "#fff", cursor: "pointer", flexShrink: 0,
              }}
            >
              Buscar
            </button>
          </div>
        </Field>
      </div>

      {/* ── chips activos ── */}
      {chips.length > 0 && (
        <div style={{ padding: "0 14px 12px", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => removeChip(chip.key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "3px 7px 3px 10px", borderRadius: 100,
                background: "var(--accent-soft)", border: "1px solid rgba(91,141,239,0.2)",
                color: "var(--accent-strong)", fontSize: 11, cursor: "pointer",
              }}
            >
              <span style={{ color: "var(--fg-dim)", fontSize: 10, fontWeight: 500 }}>{chip.label}:</span>
              <span style={{ fontWeight: 500, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chip.value}</span>
              <span style={{ opacity: 0.5, fontSize: 14, lineHeight: 1, marginLeft: 1 }}>×</span>
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            style={{
              marginLeft: "auto", padding: "3px 10px", borderRadius: 4,
              background: "transparent", border: "1px solid var(--border-strong)",
              color: "var(--fg-muted)", fontSize: 11, fontWeight: 500, cursor: "pointer",
            }}
          >
            Limpiar todo
          </button>
        </div>
      )}

      <style>{`@keyframes sicop-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Combobox de búsqueda para Unidad Orgánica
   ───────────────────────────────────────────── */
function UnidadCombobox({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [text, setText]   = useState("");
  const [open, setOpen]   = useState(false);
  const ref               = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => String(o.id) === value);

  /* cierra al hacer click fuera */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setText("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = text.trim()
    ? options.filter((o) => o.nombre.toLowerCase().includes(text.toLowerCase()))
    : options;

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setText("");
  };

  /* texto mostrado en el input: nombre seleccionado cuando está cerrado, texto de búsqueda cuando abierto */
  const inputValue = open ? text : (selected?.nombre ?? "");

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          value={inputValue}
          onChange={(e) => { setText(e.target.value); setOpen(true); }}
          onFocus={() => { setText(""); setOpen(true); }}
          placeholder="Buscar unidad..."
          className="sicop-input"
          style={{ paddingRight: 26 }}
          autoComplete="off"
          spellCheck={false}
        />
        {value ? (
          /* botón × para borrar selección */
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); pick(""); }}
            aria-label="Quitar selección"
            style={{
              position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
              width: 18, height: 18, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "var(--border-strong)", border: "none",
              color: "var(--fg-muted)", cursor: "pointer", fontSize: 13, padding: 0, lineHeight: 1,
            }}
          >×</button>
        ) : (
          <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--fg-dim)", fontSize: 9 }}>▾</span>
        )}
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 3px)", left: 0, right: 0, zIndex: 200,
          background: "var(--bg-elev)", border: "1px solid var(--border-strong)",
          borderRadius: 6, maxHeight: 240, overflowY: "auto",
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        }}>
          {/* opción "todas" */}
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); pick(""); }}
            style={rowStyle(!value, 1, false)}
          >
            Todas las unidades
          </button>

          {filtered.length === 0 ? (
            <div style={{ padding: "10px 12px", color: "var(--fg-dim)", fontSize: 12 }}>
              Sin resultados para "{text}"
            </div>
          ) : (
            filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); pick(String(o.id!)); }}
                style={rowStyle(String(o.id) === value, o.nivel ?? 1, true)}
              >
                {o.nombre}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function rowStyle(active: boolean, nivel: number, indent: boolean) {
  return {
    display: "block" as const,
    width: "100%",
    textAlign: "left" as const,
    padding: `7px 12px 7px ${indent ? 10 + Math.max(0, nivel - 1) * 14 : 12}px`,
    background: active ? "var(--accent-soft)" : "transparent",
    border: "none",
    borderBottom: "1px solid var(--border)",
    color: active ? "var(--accent-strong)" : nivel > 1 ? "var(--fg-muted)" : "var(--fg)",
    fontSize: 12,
    cursor: "pointer" as const,
    lineHeight: 1.45,
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 5 }}>
      <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-muted)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
