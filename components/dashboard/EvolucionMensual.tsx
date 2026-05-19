"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SerieMensual } from "./types";
import { formatCompactCurrency, formatCurrency, monthLabels } from "./format";

export function EvolucionMensual({ data }: { data: SerieMensual[] }) {
  const rows = data.map((row) => ({
    ...row,
    mesNombre: monthLabels[row.mes - 1] ?? String(row.mes),
  }));

  return (
    <section className="rounded-md border border-[#1f2530] bg-[#13171f] p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-[#e7eaf0]">Evolucion mensual</h2>
        <p className="text-xs text-[#8a93a6]">Devengado, girado y pagado por mes.</p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2530" />
            <XAxis dataKey="mesNombre" tick={{ fill: "#8a93a6", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatCompactCurrency} width={68} tick={{ fill: "#8a93a6", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value, name) => [formatCurrency(Number(value)), name]}
              contentStyle={{ background: "#11141c", border: "1px solid #1f2530", borderRadius: 6, color: "#e7eaf0", fontSize: 12 }}
              labelStyle={{ color: "#8a93a6", marginBottom: 4 }}
            />
            <Legend
              iconType="line"
              iconSize={18}
              wrapperStyle={{ paddingTop: 10, fontSize: 11, color: "#8a93a6" }}
            />
            <Line type="monotone" dataKey="devengado" name="Devengado" stroke="#5b8def" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="girado" name="Girado" stroke="#2CA792" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="pagado" name="Pagado" stroke="#8a93a6" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
