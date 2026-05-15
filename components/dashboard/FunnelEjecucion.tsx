"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { KpiResponse } from "./types";
import { formatCompactCurrency, formatCurrency } from "./format";

const colors = ["#3484A5", "#2CA792", "#F0C84F", "#607D8B", "#8CA3AD"];

export function FunnelEjecucion({ data }: { data: Pick<KpiResponse, "kpis"> }) {
  const rows = [
    { name: "PIM", value: data.kpis.pim },
    { name: "Certificado", value: data.kpis.certificado },
    { name: "Compromiso", value: data.kpis.compromisoAnual },
    { name: "Devengado", value: data.kpis.devengado },
    { name: "Girado", value: data.kpis.girado },
  ];

  return (
    <section className="rounded-md border border-[#1f2530] bg-[#13171f] p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-[#e7eaf0]">Embudo de ejecucion</h2>
        <p className="text-xs text-[#8a93a6]">Montos acumulados frente al PIM vigente.</p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 12 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1f2530" />
            <XAxis type="number" tickFormatter={formatCompactCurrency} tick={{ fill: "#8a93a6", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={92} tick={{ fill: "#8a93a6", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{ background: "#11141c", border: "1px solid #1f2530", borderRadius: 6, color: "#e7eaf0", fontSize: 12 }}
              labelStyle={{ color: "#8a93a6" }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {rows.map((row, index) => (
                <Cell key={row.name} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
