"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type UnidadFlat = { id: number; nivel: number; nombre: string; padreId: number | null };
type UnidadNode = UnidadFlat & { hijos: UnidadNode[] };

function buildTree(unidades: UnidadFlat[]): UnidadNode[] {
  const byId = new Map<number, UnidadNode>();
  const roots: UnidadNode[] = [];
  unidades.forEach((u) => byId.set(u.id, { ...u, hijos: [] }));
  unidades.forEach((u) => {
    const node = byId.get(u.id)!;
    if (u.padreId && byId.has(u.padreId)) {
      byId.get(u.padreId)!.hijos.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function getVisibleIds(unidades: UnidadFlat[], query: string): Set<number> | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const byId = new Map(unidades.map((u) => [u.id, u]));
  const visible = new Set<number>();

  for (const u of unidades) {
    if (u.nombre.toLowerCase().includes(q)) {
      visible.add(u.id);
      let pid = u.padreId;
      while (pid != null) {
        visible.add(pid);
        pid = byId.get(pid)?.padreId ?? null;
      }
    }
  }
  return visible;
}

export function SicopSidebarTree({ unidades }: { unidades: UnidadFlat[] }) {
  const [query, setQuery] = useState("");
  const tree = useMemo(() => buildTree(unidades), [unidades]);
  const visibleIds = useMemo(() => getVisibleIds(unidades, query), [unidades, query]);
  const hasResults = !visibleIds || visibleIds.size > 0;

  return (
    <>
      <div style={{ position: "relative", marginBottom: 8 }}>
        <span style={{
          position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
          color: "var(--fg-dim)", fontSize: 11, pointerEvents: "none",
        }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar unidad..."
          style={{
            width: "100%",
            padding: "5px 26px 5px 26px",
            fontSize: 11.5,
            border: "1px solid var(--border-strong)",
            borderRadius: 4,
            background: "var(--bg)",
            color: "var(--fg)",
            outline: "none",
            boxSizing: "border-box",
          }}
          spellCheck={false}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            style={{
              position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: "var(--fg-muted)", fontSize: 14, padding: "0 1px", lineHeight: 1,
            }}
            aria-label="Limpiar búsqueda"
          >
            ×
          </button>
        )}
      </div>

      <div style={{ display: "grid", gap: 1, fontSize: 12 }}>
        {!query && (
          <Link href="/" style={{
            borderRadius: 4, padding: "6px 8px", fontWeight: 600,
            background: "var(--accent-soft)", color: "var(--accent)",
            textDecoration: "none", fontSize: 12,
          }}>
            Todos los órganos
          </Link>
        )}

        {!hasResults ? (
          <div style={{ padding: "8px 4px", fontSize: 11.5, color: "var(--fg-dim)" }}>
            Sin resultados para &ldquo;{query}&rdquo;
          </div>
        ) : (
          tree.map((unidad) => (
            <UnidadTreeItem key={unidad.id} unidad={unidad} visibleIds={visibleIds} query={query} />
          ))
        )}
      </div>
    </>
  );
}

function UnidadTreeItem({
  unidad, visibleIds, query,
}: {
  unidad: UnidadNode;
  visibleIds: Set<number> | null;
  query: string;
}) {
  if (visibleIds && !visibleIds.has(unidad.id)) return null;

  const isMatch = !!query && unidad.nombre.toLowerCase().includes(query.toLowerCase());

  return (
    <div>
      <Link
        href={`/?unidades=${unidad.id}`}
        style={{
          display: "block",
          borderRadius: 4,
          padding: "6px 8px",
          paddingLeft: 8 + Math.max(0, unidad.nivel - 1) * 14,
          color: isMatch ? "var(--fg)" : "var(--fg-muted)",
          textDecoration: "none",
          fontWeight: isMatch ? 600 : undefined,
          background: isMatch ? "var(--hover)" : undefined,
          fontSize: 12,
        }}
        className="sicop-tree-item"
      >
        {query ? <HighlightText text={unidad.nombre} query={query} /> : unidad.nombre}
      </Link>
      {unidad.hijos.map((hijo) => (
        <UnidadTreeItem key={hijo.id} unidad={hijo} visibleIds={visibleIds} query={query} />
      ))}
    </div>
  );
}

function HighlightText({ text, query }: { text: string; query: string }) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{
        background: "var(--accent-soft)", color: "var(--accent-strong)",
        borderRadius: 2, padding: "0 1px",
      }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}
