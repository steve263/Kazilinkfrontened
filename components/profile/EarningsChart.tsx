"use client";

interface EarningsChartProps {
  data: { label: string; amount: number }[];
}

export default function EarningsChart({ data }: EarningsChartProps) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <h4 className="text-sm font-bold text-kazi-dark mb-4">Earnings This Week</h4>
      <div className="flex items-end gap-2 h-28">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-kazi-orange rounded-t-lg transition-all duration-500"
              style={{ height: `${Math.max((d.amount / max) * 96, 4)}px` }}
            />
            <span className="text-[10px] text-gray-500 font-medium">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
