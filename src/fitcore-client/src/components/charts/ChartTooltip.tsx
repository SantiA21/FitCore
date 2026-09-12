import { cn } from "@/lib/utils";

type ChartTooltipPayloadEntry = {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
};

interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayloadEntry[];
  label?: string | number;
  formatter?: (value: number) => string;
  labelFormatter?: (label: string | number) => string;
  /** "line" para series de línea/área (traza corta), "rect" para barras (cuadrado). */
  variant?: "line" | "rect";
}

/**
 * Tooltip compartido para los gráficos de recharts de la app. El valor va
 * primero y en negrita (el lector ya tiene la serie, quiere el número); el
 * nombre de la serie queda como texto secundario, nunca coloreado — la
 * identidad la lleva la marca (línea o cuadrado) al lado, no el texto.
 */
export default function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  variant = "rect",
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-lg shadow-black/5 px-3 py-2 min-w-[120px]">
      {label != null && (
        <p className="text-[11px] font-bold text-gray-900 mb-1.5 pb-1.5 border-b border-gray-100">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={`${entry.dataKey ?? entry.name ?? i}`} className="flex items-center gap-2">
            {variant === "line" ? (
              <span className="h-0.5 w-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            ) : (
              <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
            )}
            <span className="text-[11px] text-gray-500">{entry.name}</span>
            <span className={cn("text-xs font-black text-gray-900 ml-auto tabular-nums")}>
              {typeof entry.value === "number" && formatter ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
