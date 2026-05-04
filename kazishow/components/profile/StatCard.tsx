"use client";

interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
  icon?: React.ReactNode;
}

export default function StatCard({ label, value, color = "text-kazi-orange", icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-1 min-w-0">
      {icon && <div className={`${color} mb-1`}>{icon}</div>}
      <span className={`text-2xl font-black ${color} leading-none`}>{value}</span>
      <span className="text-xs text-gray-500 text-center font-medium leading-tight">{label}</span>
    </div>
  );
}
