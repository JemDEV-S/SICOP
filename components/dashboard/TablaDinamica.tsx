"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
import type { TablaRow } from "./types";
import { formatCurrency, formatPercent } from "./format";

const groups = [
  { id: "meta", label: "Meta" },
  { id: "rubro", label: "Rubro" },
  { id: "generica", label: "Generica" },
  { id: "organica", label: "Organica" },
];

function rowLabel(row: TablaRow) {
  if (row.finalidad) return `${row.meta ?? ""} - ${row.finalidad}`;
  if (row.nombreCorto) return `${row.codigo ?? ""} - ${row.nombreCorto}`;
  if (row.nombre) return `${row.codigo ? `${row.codigo} - ` : ""}${row.nombre}`;
  return "Sin etiqueta";
}

export function TablaDinamica({ data, groupBy }: { data: TablaRow[]; groupBy: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const columns = useMemo<ColumnDef<TablaRow>[]>(
    () => [
      {
        header: "Detalle",
        accessorFn: rowLabel,
        cell: ({ row }) => (
          <div className="max-w-xl">
            <p className="font-medium text-[#e7eaf0]">{rowLabel(row.original)}</p>
            {row.original.unidadOrganica ? <p className="mt-0.5 text-[11px] text-[#8a93a6]">{row.original.unidadOrganica}</p> : null}
          </div>
        ),
      },
      {
        header: "PIM",
        accessorKey: "pim",
        cell: (info) => formatCurrency(Number(info.getValue())),
      },
      {
        header: "Devengado",
        accessorKey: "devengado",
        cell: (info) => formatCurrency(Number(info.getValue())),
      },
      {
        header: "Girado",
        accessorKey: "girado",
        cell: (info) => formatCurrency(Number(info.getValue())),
      },
      {
        header: "Avance",
        accessorKey: "avanceDevengado",
        cell: (info) => formatPercent(Number(info.getValue())),
      },
    ],
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const changeGroup = (nextGroup: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("groupBy", nextGroup);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  return (
    <section className="rounded-md border border-[#1f2530] bg-[#13171f]">
      <div className="flex flex-col gap-3 border-b border-[#1f2530] p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#e7eaf0]">Tabla dinamica</h2>
          <p className="text-xs text-[#8a93a6]">Agrupacion seleccionada: {groupBy}</p>
        </div>
        <div className="inline-flex rounded border border-[#2b3340] p-0.5">
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => changeGroup(group.id)}
              className={`h-7 rounded px-3 text-xs font-medium transition-colors ${
                groupBy === group.id ? "bg-[#5b8def] text-white" : "text-[#8a93a6] hover:bg-[#1a1f2b] hover:text-[#e7eaf0]"
              }`}
            >
              {group.label}
            </button>
          ))}
        </div>
      </div>
      {isPending ? <p className="px-4 pt-3 text-xs text-[#8a93a6]">Actualizando tabla...</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-xs">
          <thead className="text-[#8a93a6]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, idx) => (
                  <th
                    key={header.id}
                    className={`border-b border-[#1f2530] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide ${idx === 0 ? "text-left" : "text-center"}`}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-[#1f2530] align-top hover:bg-[#161a24]">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-[#e7eaf0]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
