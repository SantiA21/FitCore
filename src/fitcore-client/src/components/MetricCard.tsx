import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  value: string | number;
  label: string;
  icon: LucideIcon;
}

export default function MetricCard({ value, label, icon: Icon }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 relative">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-semibold text-black mb-1">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
    </div>
  );
}
