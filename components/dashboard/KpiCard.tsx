import { formatCurrency, formatPercent } from "./format";

type KpiCardProps = {
  label: string;
  value: number;
  percent?: number;
  foot?: string;
  strong?: boolean;
};

export function KpiCard({ label, value, percent, foot, strong }: KpiCardProps) {
  return (
    <article className={`min-w-0 bg-[#13171f] p-4 hover:bg-[#161a24] ${strong ? "bg-[#161a24]" : ""}`}>
      <div className="text-[10px] font-medium uppercase tracking-wide text-[#8a93a6]">{label}</div>
      <div className="mt-2 font-mono text-xl font-medium text-[#e7eaf0]">
        <span className="mr-1 text-xs font-normal text-[#8a93a6]">S/</span>
        {formatCurrency(value)}
      </div>
      {typeof percent === "number" ? (
        <>
          <div className="mt-2 h-1 overflow-hidden rounded bg-[#1f2530]">
            <div className="h-full rounded bg-[#5b8def]" style={{ width: `${Math.min(100, Math.max(0, percent * 100))}%` }} />
          </div>
          <div className="mt-2 text-xs text-[#8a93a6]">
            <span className="font-mono">{formatPercent(percent)}</span> avance
          </div>
        </>
      ) : foot ? (
        <div className="mt-2 text-xs text-[#8a93a6]">{foot}</div>
      ) : null}
    </article>
  );
}
