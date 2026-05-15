export function money(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "-";
  return Math.round(value).toLocaleString("es-PE");
}

export function soles(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "-";
  return `S/ ${money(value)}`;
}

export function pct(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "-";
  return `${value.toFixed(1).replace(".", ",")}%`;
}

export function pctTone(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "bg-slate-700 text-slate-300";
  if (value > 100) return "bg-purple-500/15 text-purple-300 border-purple-500/50";
  if (value > 70) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/50";
  if (value > 30) return "bg-amber-500/15 text-amber-300 border-amber-500/50";
  return "bg-red-500/15 text-red-300 border-red-500/50";
}

export const monthLong = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
