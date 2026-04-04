"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { formatHour } from "@/lib/utils/format";
import type { ForecastSeries } from "@/lib/types";

const COLORS = {
  line: "#7c3aed",       // violet-600
  warning: "#fef3c7",    // amber-100 (light mode warning zone)
  capacity: "#ef4444",   // red-500
  now: "#0d9488",        // teal-600
};

const CAPACITY_PERCENT = 100;
const WARNING_THRESHOLD = 80;

interface ORUtilizationChartProps {
  series: ForecastSeries;
}

/** Convert fraction (0-1) series to percentage chart data. */
function formatChartData(series: ForecastSeries) {
  return series.data.map((point) => ({
    name: formatHour(point.hour),
    hour: point.hour,
    p50: Math.round(point.p50 * 1000) / 10,
    p10: Math.round(point.p10 * 1000) / 10,
    p90: Math.round(point.p90 * 1000) / 10,
  }));
}

/** Custom tooltip showing OR utilization percentages. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ORTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p50 = payload.find((p: any) => p.dataKey === "p50");

  return (
    <div className="rounded-md border bg-background p-2.5 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      {p50 && (
        <div className="flex items-center gap-2 text-xs">
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.line }} />
          <span className="text-muted-foreground">Utilization</span>
          <span className="font-mono font-medium ml-auto">{p50.value.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}

/**
 * Line chart showing OR utilization over 24 hours.
 * Displays as 0-100% with a warning zone above 80% and capacity line at 100%.
 */
export function ORUtilizationChart({ series }: ORUtilizationChartProps) {
  const chartData = formatChartData(series);
  const currentHour = new Date().getHours();

  return (
    <Card className="border shadow-none">
      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="text-sm font-medium text-foreground">
            Operating Room Utilization
          </h3>
          <p className="text-xs text-muted-foreground">% capacity</p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="or-warning-zone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.05} />
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
              domain={[0, 120]}
              tickFormatter={(v: number) => `${v}%`}
            />

            <Tooltip content={<ORTooltip />} />

            {/* Warning zone: 80-100% */}
            <ReferenceArea
              y1={WARNING_THRESHOLD}
              y2={CAPACITY_PERCENT}
              fill="url(#or-warning-zone)"
              strokeOpacity={0}
            />

            {/* Capacity line at 100% */}
            <ReferenceLine
              y={CAPACITY_PERCENT}
              stroke={COLORS.capacity}
              strokeDasharray="6 3"
              strokeWidth={1}
              label={{
                value: "Capacity",
                position: "right",
                style: { fontSize: 9, fill: COLORS.capacity },
              }}
            />

            {/* Current hour marker */}
            <ReferenceLine
              x={formatHour(currentHour)}
              stroke={COLORS.now}
              strokeWidth={1}
              strokeDasharray="3 2"
              label={{
                value: "Now",
                position: "top",
                style: { fontSize: 9, fill: COLORS.now, fontWeight: 500 },
              }}
            />

            <Line
              type="monotone"
              dataKey="p50"
              stroke={COLORS.line}
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
