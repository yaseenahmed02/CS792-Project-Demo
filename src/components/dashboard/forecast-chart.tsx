"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_SHIFTS } from "@/lib/constants";
import { formatHour } from "@/lib/utils/format";
import type { ForecastSeries } from "@/lib/types";

/** Muted chart palette for a professional look. */
const COLORS = {
  p10: "#34d399",   // emerald-400
  p50: "#0d9488",   // teal-600 (primary)
  p90: "#fb7185",   // rose-400
  capacity: "#ef4444",
  blockBoundary: "#d4d4d8",
  nowLine: "#0d9488",
};

interface ForecastChartProps {
  series: ForecastSeries;
  title: string;
  unit: string;
  showCapacityLine?: boolean;
  capacityValue?: number;
}

/**Custom tooltip displaying P10/P50/P90 values.*/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p90 = payload.find((p: any) => p.dataKey === "p90");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p50 = payload.find((p: any) => p.dataKey === "p50");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p10 = payload.find((p: any) => p.dataKey === "p10");

  return (
    <div className="rounded-md border bg-background p-2.5 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      <div className="space-y-1">
        {p90 && (
          <div className="flex items-center gap-2 text-xs">
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.p90 }} />
            <span className="text-muted-foreground">P90</span>
            <span className="font-mono font-medium ml-auto">{p90.value.toFixed(1)}</span>
          </div>
        )}
        {p50 && (
          <div className="flex items-center gap-2 text-xs">
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.p50 }} />
            <span className="text-muted-foreground">P50</span>
            <span className="font-mono font-medium ml-auto">{p50.value.toFixed(1)}</span>
          </div>
        )}
        {p10 && (
          <div className="flex items-center gap-2 text-xs">
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.p10 }} />
            <span className="text-muted-foreground">P10</span>
            <span className="font-mono font-medium ml-auto">{p10.value.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**Format chart data from ForecastSeries into Recharts-compatible format.*/
function formatChartData(series: ForecastSeries) {
  return series.data.map((point) => ({
    name: formatHour(point.hour),
    hour: point.hour,
    p10: point.p10,
    p50: point.p50,
    p90: point.p90,
  }));
}

/**
 * Forecast chart with P10/P50/P90 confidence bands, block boundaries,
 * current-hour marker, and optional capacity threshold line.
 */
export function ForecastChart({
  series,
  title,
  unit,
  showCapacityLine = false,
  capacityValue,
}: ForecastChartProps) {
  const chartData = formatChartData(series);
  const currentHour = new Date().getHours();
  const gradientId = title.replace(/\s+/g, "-").toLowerCase();

  const shiftBoundaries = [...new Set(DEFAULT_SHIFTS.map((s) => s.startHour))].filter((h) => h > 0);

  return (
    <Card className="border shadow-none">
      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{unit}</p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id={`gradient-p90-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.p90} stopOpacity={0.12} />
                <stop offset="100%" stopColor={COLORS.p90} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id={`gradient-p50-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.p50} stopOpacity={0.15} />
                <stop offset="100%" stopColor={COLORS.p50} stopOpacity={0.03} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-border"
              opacity={0.4}
            />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval={3}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={35}
            />

            <Tooltip content={<ChartTooltip />} />

            {/* P90 band */}
            <Area
              type="monotone"
              dataKey="p90"
              stroke={COLORS.p90}
              strokeWidth={1}
              strokeDasharray="4 3"
              fill={`url(#gradient-p90-${gradientId})`}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />

            {/* P50 median line */}
            <Area
              type="monotone"
              dataKey="p50"
              stroke={COLORS.p50}
              strokeWidth={2}
              fill={`url(#gradient-p50-${gradientId})`}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />

            {/* P10 line — no fill */}
            <Area
              type="monotone"
              dataKey="p10"
              stroke={COLORS.p10}
              strokeWidth={1}
              strokeDasharray="4 3"
              fill="none"
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />

            {/* Shift boundary lines */}
            {shiftBoundaries.map((hour) => (
              <ReferenceLine
                key={`shift-${hour}`}
                x={formatHour(hour)}
                stroke={COLORS.blockBoundary}
                strokeDasharray="3 3"
                strokeWidth={0.5}
              />
            ))}

            {/* Current hour marker */}
            <ReferenceLine
              x={formatHour(currentHour)}
              stroke={COLORS.nowLine}
              strokeWidth={1}
              strokeDasharray="3 2"
              label={{
                value: "Now",
                position: "top",
                style: { fontSize: 9, fill: COLORS.nowLine, fontWeight: 500 },
              }}
            />

            {/* Capacity threshold line */}
            {showCapacityLine && capacityValue != null && (
              <ReferenceLine
                y={capacityValue}
                stroke={COLORS.capacity}
                strokeDasharray="6 3"
                strokeWidth={1}
                label={{
                  value: `Capacity (${capacityValue})`,
                  position: "right",
                  style: { fontSize: 9, fill: COLORS.capacity },
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
