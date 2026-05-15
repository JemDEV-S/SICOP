"use client";

import { Filter, RotateCcw, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { CatalogoSimple } from "./types";

type FiltersBarProps = {
  rubros: CatalogoSimple[];
  unidades: CatalogoSimple[];
  programas: CatalogoSimple[];
};

function setParam(params: URLSearchParams, key: string, value: string) {
  if (value) params.set(key, value);
  else params.delete(key);
}

export function FiltersBar({ rubros, unidades, programas }: FiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const current = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  const apply = (key: string, value: string) => {
    const params = new URLSearchParams(current.toString());
    setParam(params, key, value);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const clear = () => {
    setQ("");
    startTransition(() => router.push(pathname));
  };

  const submitSearch = () => {
    const params = new URLSearchParams(current.toString());
    setParam(params, "q", q.trim());
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-muni-ink">
        <Filter className="h-5 w-5 text-muni-blue" />
        <h2 className="text-lg font-semibold">Filtros</h2>
        {isPending ? <span className="text-sm text-slate-500">Actualizando...</span> : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-600">Rubro</span>
          <select
            className="h-11 rounded-md border border-slate-300 bg-white px-3"
            value={searchParams.get("rubros") ?? ""}
            onChange={(event) => apply("rubros", event.target.value)}
          >
            <option value="">Todos</option>
            {rubros.map((rubro) => (
              <option key={rubro.codigo} value={rubro.codigo}>
                {rubro.codigo} - {rubro.nombreCorto ?? rubro.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-600">Unidad organica</span>
          <select
            className="h-11 rounded-md border border-slate-300 bg-white px-3"
            value={searchParams.get("unidades") ?? ""}
            onChange={(event) => apply("unidades", event.target.value)}
          >
            <option value="">Todas</option>
            {unidades.map((unidad) => (
              <option key={unidad.id} value={unidad.id}>
                {"- ".repeat(Math.max(0, (unidad.nivel ?? 1) - 1))}
                {unidad.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-600">Programa</span>
          <select
            className="h-11 rounded-md border border-slate-300 bg-white px-3"
            value={searchParams.get("programas") ?? ""}
            onChange={(event) => apply("programas", event.target.value)}
          >
            <option value="">Todos</option>
            {programas.map((programa) => (
              <option key={programa.codigo} value={programa.codigo}>
                {programa.codigo} - {programa.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-600">Mes desde</span>
          <select
            className="h-11 rounded-md border border-slate-300 bg-white px-3"
            value={searchParams.get("mesDesde") ?? "1"}
            onChange={(event) => apply("mesDesde", event.target.value)}
          >
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-600">Mes hasta</span>
          <select
            className="h-11 rounded-md border border-slate-300 bg-white px-3"
            value={searchParams.get("mesHasta") ?? "12"}
            onChange={(event) => apply("mesHasta", event.target.value)}
          >
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-600">Restringidos</span>
          <select
            className="h-11 rounded-md border border-slate-300 bg-white px-3"
            value={searchParams.get("incluirRestringido") ?? "true"}
            onChange={(event) => apply("incluirRestringido", event.target.value)}
          >
            <option value="true">Incluir</option>
            <option value="false">Excluir</option>
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-col gap-3 md:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitSearch();
            }}
            className="h-11 w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3"
            placeholder="Buscar finalidad, proyecto, CUI o nombre corto"
          />
        </label>
        <button
          type="button"
          onClick={submitSearch}
          className="h-11 rounded-md bg-muni-blue px-4 font-semibold text-white"
        >
          Buscar
        </button>
        <button
          type="button"
          onClick={clear}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 px-4 font-semibold text-slate-700"
        >
          <RotateCcw className="h-4 w-4" />
          Limpiar
        </button>
      </div>
    </section>
  );
}
