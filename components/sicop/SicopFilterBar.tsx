"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { monthLong } from "./SicopFormat";

type RubroOption      = { codigo: string; nombre: string; nombreCorto?: string | null };
type UnidadOption     = { id: number; nivel: number; nombre: string; rutaNombres?: string | null };
type GenericaOption   = { codigo: string; descripcion: string };
type MetaOption       = {
  id: number;
  secFunc: number;
  nombreCorto: string | null;
  productoProyectoNombre: string;
  productoProyectoCodigo: string;
  tipoProdProy: string;
  cui: string | null;
};

export function SicopFilterBar({
  rubros,
  unidades,
  genericas,
}: {
  rubros: RubroOption[];
  unidades: UnidadOption[];
  genericas: GenericaOption[];
}) {
  const router   = useRouter();
  const pathname = usePathname();
  const sp       = useSearchParams();
  const [cuiInput, setCuiInput]       = useState(sp.get("cui") ?? "");
  const [metaLabel, setMetaLabel]     = useState("");
  const [pending, startTransition]    = useTransition();
  const cuiDebounce                   = useRef<ReturnType<typeof setTimeout>>();

  const val = (k: string) => sp.get(k) ?? "";

  const push = (updates: Record<string, string>) => {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v); else params.delete(k);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const mesDesde        = val("mesDesde")            || "1";
  const mesHasta        = val("mesHasta")            || "12";
  const inclRestringido = val("incluirRestringido")  || "true";
  const selRubro        = val("rubros");
  const selUnidad       = val("unidades");
  const selMeta         = val("metas");
  const currentCui      = val("cui");
  const selClasif       = val("clasificadores");

  /* ── chips activos ── */
  type Chip = { key: string; label: string; value: string };
  const chips: Chip[] = [];

  if (selUnidad) {
    const f = unidades.find((u) => String(u.id) === selUnidad);
    chips.push({ key: "unidades", label: "Unidad orgánica", value: f ? f.nombre : selUnidad });
  }
  if (selMeta) {
    chips.push({ key: "metas", label: "Meta SF", value: metaLabel || `Meta #${selMeta}` });
  }
  if (currentCui) {
    chips.push({ key: "cui", label: "CUI", value: currentCui });
  }
  if (selRubro) {
    const f = rubros.find((r) => r.codigo === selRubro);
    chips.push({ key: "rubros", label: "Rubro", value: f ? (f.nombreCorto ?? f.nombre) : selRubro });
  }
  if (selClasif) {
    const f = genericas.find((g) => g.codigo === selClasif);
    chips.push({ key: "clasificadores", label: "Genérica", value: f ? `${f.codigo} ${f.descripcion}` : selClasif });
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

  const removeChip = (key: string) => {
    if (key === "_meses") {
      const params = new URLSearchParams(sp.toString());
      params.delete("mesDesde"); params.delete("mesHasta");
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    } else {
      if (key === "cui") { clearTimeout(cuiDebounce.current); setCuiInput(""); }
      if (key === "metas") { setMetaLabel(""); push({ metas: "" }); return; }
      push({ [key]: "" });
    }
  };

  const clearAll = () => {
    clearTimeout(cuiDebounce.current);
    setCuiInput("");
    setMetaLabel("");
    startTransition(() => router.push(pathname));
  };

  const handleMetaChange = (id: string, label: string, cui: string) => {
    setMetaLabel(label);
    clearTimeout(cuiDebounce.current);
    if (id) {
      /* Si la meta es PROYECTO muestra su CUI en el campo pero NO lo aplica como filtro URL:
         el filtro ya está cubierto por metas=ID (más preciso y compatible con el filtro de unidad). */
      setCuiInput(cui);
      push({ metas: id });
    } else {
      setCuiInput("");
      push({ metas: "", cui: "" });
    }
  };

  return (
    <div style={{
      marginBottom: 16,
      borderRadius: 8,
      border: "1px solid var(--border)",
      background: "var(--panel)",
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
      <div style={{ padding: "12px 14px", display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))" }}>

        {/* 1. Unidad orgánica */}
        <div style={{ display: "grid", gap: 5 }}>
          <FieldLabel>Unidad orgánica</FieldLabel>
          <UnidadCombobox
            options={unidades}
            value={selUnidad}
            onChange={(v) => { setMetaLabel(""); push({ unidades: v, metas: "" }); }}
          />
        </div>

        {/* 2. Meta (SF) */}
        <div style={{ display: "grid", gap: 5 }}>
          <FieldLabel>Meta / SF</FieldLabel>
          <MetaCombobox
            value={selMeta}
            unidadId={selUnidad}
            selectedLabel={metaLabel}
            onChange={handleMetaChange}
          />
        </div>

        {/* 3. CUI del proyecto */}
        <Field label="CUI del proyecto">
          <div style={{ position: "relative" }}>
            <input
              value={cuiInput}
              onChange={(e) => {
                const v = e.target.value;
                setCuiInput(v);
                clearTimeout(cuiDebounce.current);
                cuiDebounce.current = setTimeout(() => push({ cui: v.trim() }), 550);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  clearTimeout(cuiDebounce.current);
                  push({ cui: cuiInput.trim() });
                }
              }}
              placeholder="Ej: 2001621"
              className="sicop-input"
              style={{
                width: "100%",
                paddingRight: currentCui ? 26 : undefined,
                background: currentCui ? "var(--accent-soft)" : undefined,
                borderColor: currentCui ? "rgba(91,141,239,0.4)" : undefined,
              }}
              maxLength={12}
            />
            {currentCui && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); clearTimeout(cuiDebounce.current); setCuiInput(""); push({ cui: "" }); }}
                style={clearBtnStyle}
              >×</button>
            )}
          </div>
        </Field>

        {/* 4. Rubro */}
        <Field label="Rubro">
          <select value={selRubro} onChange={(e) => push({ rubros: e.target.value })} className="sicop-input">
            <option value="">Todos los rubros</option>
            {rubros.map((r) => (
              <option key={r.codigo} value={r.codigo}>{r.codigo} — {r.nombreCorto ?? r.nombre}</option>
            ))}
          </select>
        </Field>

        {/* 5. Genérica del clasificador */}
        <Field label="Genérica del clasificador">
          <select value={selClasif} onChange={(e) => push({ clasificadores: e.target.value })} className="sicop-input">
            <option value="">Todas las genéricas</option>
            {genericas.map((g) => (
              <option key={g.codigo} value={g.codigo}>{g.codigo} — {g.descripcion}</option>
            ))}
          </select>
        </Field>

        {/* 7. Rango de meses */}
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

        {/* 8. Restringidos */}
        <Field label="Clasificadores restringidos">
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
              <span style={{ fontWeight: 500, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chip.value}</span>
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
  options: UnidadOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => String(o.id) === value);

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

  const pick = (id: string) => { onChange(id); setOpen(false); setText(""); };
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
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); pick(""); }}
            aria-label="Quitar selección"
            style={clearBtnStyle}
          >×</button>
        ) : (
          <span style={chevronStyle}>▾</span>
        )}
      </div>
      {open && (
        <Dropdown>
          <DropRow active={!value} nivel={1} indent={false} onMouseDown={(e) => { e.preventDefault(); pick(""); }}>
            Todas las unidades
          </DropRow>
          {filtered.length === 0 ? (
            <div style={emptyStyle}>Sin resultados para &ldquo;{text}&rdquo;</div>
          ) : (
            filtered.map((o) => (
              <DropRow key={o.id} active={String(o.id) === value} nivel={o.nivel ?? 1} indent onMouseDown={(e) => { e.preventDefault(); pick(String(o.id)); }}>
                {o.nombre}
              </DropRow>
            ))
          )}
        </Dropdown>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Combobox async para Meta (SF)
   ───────────────────────────────────────────── */
function MetaCombobox({
  value,
  unidadId,
  selectedLabel,
  onChange,
}: {
  value: string;
  unidadId: string;
  selectedLabel: string;
  onChange: (id: string, label: string, cui: string) => void;
}) {
  const [text, setText]       = useState("");
  const [open, setOpen]       = useState(false);
  const [options, setOptions] = useState<MetaOption[]>([]);
  const [loading, setLoading] = useState(false);
  const ref                   = useRef<HTMLDivElement>(null);
  const debounce              = useRef<ReturnType<typeof setTimeout>>();

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

  useEffect(() => {
    if (!open) return;
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "80" });
        if (unidadId) params.set("unidadId", unidadId);
        if (text.trim()) params.set("q", text.trim());
        const res  = await fetch(`/api/catalogos/metas?${params}`);
        const json = await res.json();
        setOptions(json.data ?? []);
      } finally {
        setLoading(false);
      }
    }, text ? 280 : 0);
  }, [open, text, unidadId]);

  const metaDisplayLabel = (m: MetaOption) => {
    const nombre = m.nombreCorto ?? m.productoProyectoNombre.slice(0, 55);
    return `SF ${m.secFunc} — ${nombre}`;
  };

  const pick = (id: string, label: string, cui = "") => {
    onChange(id, label, cui);
    setOpen(false);
    setText("");
  };

  const inputValue = open ? text : (value ? (selectedLabel || `Meta #${value}`) : "");

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          value={inputValue}
          onChange={(e) => { setText(e.target.value); setOpen(true); }}
          onFocus={() => { setText(""); setOpen(true); }}
          placeholder={unidadId ? "Buscar meta de esta unidad..." : "Buscar meta (SF)..."}
          className="sicop-input"
          style={{ paddingRight: 26 }}
          autoComplete="off"
          spellCheck={false}
        />
        {value ? (
          <button type="button" onMouseDown={(e) => { e.preventDefault(); pick("", "", ""); }} aria-label="Quitar selección" style={clearBtnStyle}>×</button>
        ) : (
          <span style={chevronStyle}>▾</span>
        )}
      </div>
      {open && (
        <Dropdown>
          <DropRow active={!value} nivel={1} indent={false} onMouseDown={(e) => { e.preventDefault(); pick("", "", ""); }}>
            Todas las metas
          </DropRow>
          {loading ? (
            <div style={{ ...emptyStyle, display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", border: "1.5px solid var(--accent)", borderTopColor: "transparent", animation: "sicop-spin 0.7s linear infinite" }} />
              Buscando…
            </div>
          ) : options.length === 0 ? (
            <div style={emptyStyle}>{text ? `Sin resultados para "${text}"` : "Sin metas disponibles"}</div>
          ) : (
            options.map((m) => (
              <button
                key={m.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const cuiVal = m.cui ?? (m.tipoProdProy === "PROYECTO" ? m.productoProyectoCodigo : "");
                  pick(String(m.id), metaDisplayLabel(m), cuiVal);
                }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "8px 12px",
                  background: String(m.id) === value ? "var(--accent-soft)" : "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  lineHeight: 1.45,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                    background: m.tipoProdProy === "PROYECTO" ? "rgba(91,141,239,0.15)" : "rgba(46,194,126,0.15)",
                    color: m.tipoProdProy === "PROYECTO" ? "var(--accent-strong)" : "var(--ok)",
                    flexShrink: 0,
                  }}>
                    {m.tipoProdProy === "PROYECTO" ? "PROY" : "PROD"}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: String(m.id) === value ? "var(--accent-strong)" : "var(--fg)" }}>
                    SF {m.secFunc}
                  </span>
                  {(m.cui ?? (m.tipoProdProy === "PROYECTO" ? m.productoProyectoCodigo : null)) && (
                    <span style={{ fontSize: 10, color: "var(--fg-dim)" }}>
                      CUI: {m.cui ?? m.productoProyectoCodigo}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.nombreCorto ?? m.productoProyectoNombre.slice(0, 70)}
                </div>
              </button>
            ))
          )}
        </Dropdown>
      )}
    </div>
  );
}

/* ── helpers de UI ── */

function Dropdown({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 3px)", left: 0, right: 0, zIndex: 200,
      background: "var(--bg-elev)", border: "1px solid var(--border-strong)",
      borderRadius: 6, maxHeight: 280, overflowY: "auto",
      boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    }}>
      {children}
    </div>
  );
}

function DropRow({
  active, nivel, indent, onMouseDown, children,
}: {
  active: boolean;
  nivel: number;
  indent: boolean;
  onMouseDown: React.MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      style={{
        display: "block", width: "100%", textAlign: "left",
        padding: `7px 12px 7px ${indent ? 10 + Math.max(0, nivel - 1) * 14 : 12}px`,
        background: active ? "var(--accent-soft)" : "transparent",
        border: "none",
        borderBottom: "1px solid var(--border)",
        color: active ? "var(--accent-strong)" : nivel > 1 ? "var(--fg-muted)" : "var(--fg)",
        fontSize: 12,
        cursor: "pointer",
        lineHeight: 1.45,
      }}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 5 }}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </label>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-muted)" }}>
      {children}
    </span>
  );
}

const clearBtnStyle: React.CSSProperties = {
  position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
  width: 18, height: 18, borderRadius: "50%",
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "var(--border-strong)", border: "none",
  color: "var(--fg-muted)", cursor: "pointer", fontSize: 13, padding: 0, lineHeight: 1,
};

const chevronStyle: React.CSSProperties = {
  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
  pointerEvents: "none", color: "var(--fg-dim)", fontSize: 9,
};

const emptyStyle: React.CSSProperties = {
  padding: "10px 12px", color: "var(--fg-dim)", fontSize: 12,
};
